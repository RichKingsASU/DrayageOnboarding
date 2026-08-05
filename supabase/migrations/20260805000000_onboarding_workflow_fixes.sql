-- Onboarding workflow fixes: optional bill-to codes, checklist state, SOP document linkage.
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS bill_to_code TEXT;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS checklist_state JSONB;

COMMENT ON COLUMN public.accounts.bill_to_code IS 'Optional billing system code. Must be manually entered or preserved from an existing saved value; no default is assigned.';
COMMENT ON COLUMN public.accessorial_sops.delivery_rules IS 'Long-form Standard Delivery SOP instructions. Stored as TEXT to preserve multiline content without truncation.';

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS checklist_item_key TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS description TEXT;

CREATE TABLE IF NOT EXISTS public.checklist_document_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  checklist_item_key TEXT NOT NULL,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  uploaded_by TEXT DEFAULT 'System',
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, checklist_item_key, document_id)
);

CREATE INDEX IF NOT EXISTS idx_checklist_document_completions_account
ON public.checklist_document_completions(account_id, checklist_item_key);

ALTER TABLE public.checklist_document_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage checklist document completions via account access" ON public.checklist_document_completions;
CREATE POLICY "Manage checklist document completions via account access"
ON public.checklist_document_completions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.accounts WHERE id = checklist_document_completions.account_id));

CREATE OR REPLACE FUNCTION public.document_type_to_checklist_item(doc_type public.doc_type_enum)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
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
SET search_path = public
AS $$
DECLARE
  target_key TEXT;
  remaining_count INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    target_key := COALESCE(NEW.checklist_item_key, public.document_type_to_checklist_item(NEW.type));
    IF target_key IS NOT NULL THEN
      INSERT INTO public.checklist_document_completions(account_id, checklist_item_key, document_id, uploaded_by, completed_at)
      VALUES (NEW.account_id, target_key, NEW.id, COALESCE(NEW.uploaded_by, 'System'), COALESCE(NEW.uploaded_at, NOW()))
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
