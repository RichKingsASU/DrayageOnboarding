-- File: 20260805000000_onboarding_workflow_fixes.sql
-- Purpose: Adds onboarding checklist persistence and document-to-checklist linkage fixes to the initial schema.
-- Dependencies: Existing public.accounts, public.documents, and public.accessorial_sops tables.
-- Maintainer note: Checklist item keys must remain aligned with frontend ChecklistState keys.

-- Onboarding workflow fixes: optional bill-to codes, checklist state, SOP document linkage.
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS bill_to_code TEXT;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS checklist_state JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.accounts.bill_to_code IS 'Optional billing system code. Must be manually entered or preserved from an existing saved value; no default is assigned.';
COMMENT ON COLUMN public.accessorial_sops.delivery_rules IS 'Long-form Standard Delivery SOP instructions. Stored as TEXT to preserve multiline content without truncation.';

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS checklist_item_key TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_checklist_item_key_allowed;
ALTER TABLE public.documents
  ADD CONSTRAINT documents_checklist_item_key_allowed
  CHECK (checklist_item_key IS NULL OR checklist_item_key IN ('filesUploaded', 'creditApp', 'contract'));

CREATE TABLE IF NOT EXISTS public.checklist_document_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  checklist_item_key TEXT NOT NULL,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  uploaded_by TEXT DEFAULT 'System',
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, checklist_item_key, document_id)
);

ALTER TABLE public.checklist_document_completions DROP CONSTRAINT IF EXISTS checklist_document_completions_key_allowed;
ALTER TABLE public.checklist_document_completions
  ADD CONSTRAINT checklist_document_completions_key_allowed
  CHECK (checklist_item_key IN ('filesUploaded', 'creditApp', 'contract'));

CREATE INDEX IF NOT EXISTS idx_checklist_document_completions_account
ON public.checklist_document_completions(account_id, checklist_item_key);

ALTER TABLE public.checklist_document_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage checklist document completions via account access" ON public.checklist_document_completions;
CREATE POLICY "Manage checklist document completions via account access"
ON public.checklist_document_completions FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.accounts
    WHERE id = checklist_document_completions.account_id
      AND organization_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.accounts a
    JOIN public.documents d ON d.id = checklist_document_completions.document_id
    WHERE a.id = checklist_document_completions.account_id
      AND d.account_id = checklist_document_completions.account_id
      AND a.organization_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.document_type_to_checklist_item(doc_type public.doc_type_enum)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT CASE doc_type::TEXT
    WHEN 'SOP Document' THEN 'filesUploaded'
    WHEN 'Credit Application' THEN 'creditApp'
    WHEN 'Liability Agreement' THEN 'contract'
    ELSE NULL
  END
$$;

CREATE OR REPLACE FUNCTION public.sync_document_checklist_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_key TEXT;
  remaining_count INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    target_key := COALESCE(NEW.checklist_item_key, public.document_type_to_checklist_item(NEW.type));
    IF target_key IS NOT NULL THEN
      IF target_key NOT IN ('filesUploaded', 'creditApp', 'contract') THEN
        RAISE EXCEPTION 'Unsupported checklist item key: %', target_key;
      END IF;

      INSERT INTO public.checklist_document_completions(account_id, checklist_item_key, document_id, uploaded_by, completed_at)
      VALUES (NEW.account_id, target_key, NEW.id, COALESCE(auth.uid()::TEXT, NEW.uploaded_by, 'System'), COALESCE(NEW.uploaded_at, NOW()))
      ON CONFLICT (account_id, checklist_item_key, document_id) DO NOTHING;

      UPDATE public.accounts
      SET checklist_state = jsonb_set(COALESCE(checklist_state, '{}'::jsonb), ARRAY[target_key], 'true'::jsonb, true),
          updated_at = NOW()
      WHERE id = NEW.account_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    target_key := COALESCE(OLD.checklist_item_key, public.document_type_to_checklist_item(OLD.type));
    IF target_key IS NOT NULL THEN
      DELETE FROM public.checklist_document_completions WHERE document_id = OLD.id;

      SELECT COUNT(*) INTO remaining_count
      FROM public.documents d
      WHERE d.account_id = OLD.account_id
        AND COALESCE(d.checklist_item_key, public.document_type_to_checklist_item(d.type)) = target_key
        AND d.id <> OLD.id;

      IF remaining_count = 0 THEN
        UPDATE public.accounts
        SET checklist_state = jsonb_set(COALESCE(checklist_state, '{}'::jsonb), ARRAY[target_key], 'false'::jsonb, true),
            updated_at = NOW()
        WHERE id = OLD.account_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_documents_sync_checklist_insert ON public.documents;
CREATE TRIGGER trg_documents_sync_checklist_insert
AFTER INSERT ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.sync_document_checklist_completion();

DROP TRIGGER IF EXISTS trg_documents_sync_checklist_delete ON public.documents;
CREATE TRIGGER trg_documents_sync_checklist_delete
AFTER DELETE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.sync_document_checklist_completion();

-- Tighten tenant policies that previously allowed every authenticated user to operate on every row.
DROP POLICY IF EXISTS "Allow authenticated team members to read accounts" ON public.accounts;
CREATE POLICY "Allow account owners to read accounts"
ON public.accounts FOR SELECT TO authenticated
USING (organization_id = auth.uid());

DROP POLICY IF EXISTS "Allow authenticated team members to insert accounts" ON public.accounts;
CREATE POLICY "Allow account owners to insert accounts"
ON public.accounts FOR INSERT TO authenticated
WITH CHECK (organization_id = auth.uid());

DROP POLICY IF EXISTS "Allow authenticated team members to update accounts" ON public.accounts;
CREATE POLICY "Allow account owners to update accounts"
ON public.accounts FOR UPDATE TO authenticated
USING (organization_id = auth.uid())
WITH CHECK (organization_id = auth.uid());

DROP POLICY IF EXISTS "Manage accessorial_sops via account access" ON public.accessorial_sops;
CREATE POLICY "Manage accessorial_sops via account access"
ON public.accessorial_sops FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.accounts WHERE id = accessorial_sops.account_id AND organization_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.accounts WHERE id = accessorial_sops.account_id AND organization_id = auth.uid()));

DROP POLICY IF EXISTS "Manage documents via account access" ON public.documents;
CREATE POLICY "Manage documents via account access"
ON public.documents FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.accounts WHERE id = documents.account_id AND organization_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.accounts WHERE id = documents.account_id AND organization_id = auth.uid()));

DROP POLICY IF EXISTS "Allow authenticated read on drayage-vault" ON storage.objects;
CREATE POLICY "Allow account-scoped read on drayage-vault"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'drayage-vault' AND EXISTS (SELECT 1 FROM public.accounts WHERE id::text = (storage.foldername(name))[1] AND organization_id = auth.uid()));

DROP POLICY IF EXISTS "Allow authenticated upload on drayage-vault" ON storage.objects;
CREATE POLICY "Allow account-scoped upload on drayage-vault"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'drayage-vault' AND EXISTS (SELECT 1 FROM public.accounts WHERE id::text = (storage.foldername(name))[1] AND organization_id = auth.uid()));

DROP POLICY IF EXISTS "Allow authenticated delete on drayage-vault" ON storage.objects;
CREATE POLICY "Allow account-scoped delete on drayage-vault"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'drayage-vault' AND EXISTS (SELECT 1 FROM public.accounts WHERE id::text = (storage.foldername(name))[1] AND organization_id = auth.uid()));
