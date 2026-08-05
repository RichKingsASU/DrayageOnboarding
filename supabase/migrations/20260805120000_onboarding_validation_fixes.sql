-- File: 20260805120000_onboarding_validation_fixes.sql
-- Purpose: Validates realtime publication membership, storage constraints, RLS policy behavior, and workflow defaults.
-- Dependencies: Supabase realtime publication, storage.objects, auth.uid(), and prior onboarding migrations.
-- Maintainer note: Uses idempotent guards so local resets and repeated migration runs stay safe.

-- 1. Ensure required tables are in the realtime publication
BEGIN;

-- Create publication if it doesn't exist (Supabase typically creates this by default, but safe to check)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

-- Add accounts, documents, accessorial_sops to realtime publication if they aren't already
-- Add accounts, documents, accessorial_sops to realtime publication if they aren't already
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['public.accounts', 'public.documents', 'public.accessorial_sops'])
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = split_part(t, '.', 1) 
      AND tablename = split_part(t, '.', 2)
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %s', t);
    END IF;
  END LOOP;
END;
$$;



-- 2. Explicitly tighten Storage path policies
-- The previous migration added policies, but we can make sure they are strictly bounded
-- by the accounts table and auth.uid().
DROP POLICY IF EXISTS "Allow account-scoped read on drayage-vault" ON storage.objects;
CREATE POLICY "Allow account-scoped read on drayage-vault"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'drayage-vault' 
  AND EXISTS (
    SELECT 1 FROM public.accounts 
    WHERE id::text = (storage.foldername(name))[1] 
      AND organization_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Allow account-scoped upload on drayage-vault" ON storage.objects;
CREATE POLICY "Allow account-scoped upload on drayage-vault"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'drayage-vault' 
  AND EXISTS (
    SELECT 1 FROM public.accounts 
    WHERE id::text = (storage.foldername(name))[1] 
      AND organization_id = auth.uid()
  )
  -- Also enforce uploaded_by matches auth.uid() if we were tracking it in storage, 
  -- but we track it in the documents table. 
);

-- 3. Trigger uploader identity safety
-- Re-create the trigger function to forcibly set uploaded_by to auth.uid() if not system
CREATE OR REPLACE FUNCTION public.sync_document_checklist_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_key TEXT;
  remaining_count INTEGER;
  safe_uploader TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    target_key := COALESCE(NEW.checklist_item_key, public.document_type_to_checklist_item(NEW.type));
    
    -- Ensure uploader is bound to the actual auth user if present
    safe_uploader := COALESCE(auth.uid()::TEXT, 'System');

    IF target_key IS NOT NULL THEN
      IF target_key NOT IN ('filesUploaded', 'creditApp', 'contract') THEN
        RAISE EXCEPTION 'Unsupported checklist item key: %', target_key;
      END IF;

      INSERT INTO public.checklist_document_completions(account_id, checklist_item_key, document_id, uploaded_by, completed_at)
      VALUES (NEW.account_id, target_key, NEW.id, safe_uploader, COALESCE(NEW.uploaded_at, NOW()))
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
