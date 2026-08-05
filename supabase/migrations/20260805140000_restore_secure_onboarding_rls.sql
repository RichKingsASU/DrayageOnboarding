-- Restore secure RLS policies that were relaxed for the demo
BEGIN;

-- Drop permissive demo policies
DROP POLICY IF EXISTS "Allow demo access to accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow demo access to accessorial_sops" ON public.accessorial_sops;
DROP POLICY IF EXISTS "Allow demo access to contacts" ON public.contacts;
DROP POLICY IF EXISTS "Allow demo access to documents" ON public.documents;
DROP POLICY IF EXISTS "Allow demo access to alerts" ON public.customer_alerts;
DROP POLICY IF EXISTS "Allow demo access to checklist completions" ON public.checklist_document_completions;

DROP POLICY IF EXISTS "Allow demo read on drayage-vault" ON storage.objects;
DROP POLICY IF EXISTS "Allow demo upload on drayage-vault" ON storage.objects;
DROP POLICY IF EXISTS "Allow demo delete on drayage-vault" ON storage.objects;
DROP POLICY IF EXISTS "Allow demo update on drayage-vault" ON storage.objects;

-- Restore strict accounts policies
CREATE POLICY "Allow account owners to read accounts"
ON public.accounts FOR SELECT TO authenticated
USING (organization_id = auth.uid());

CREATE POLICY "Allow account owners to insert accounts"
ON public.accounts FOR INSERT TO authenticated
WITH CHECK (organization_id = auth.uid());

CREATE POLICY "Allow account owners to update accounts"
ON public.accounts FOR UPDATE TO authenticated
USING (organization_id = auth.uid())
WITH CHECK (organization_id = auth.uid());

-- Restore strict accessorial_sops policies
CREATE POLICY "Manage accessorial_sops via account access"
ON public.accessorial_sops FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.accounts WHERE id = accessorial_sops.account_id AND organization_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.accounts WHERE id = accessorial_sops.account_id AND organization_id = auth.uid()));

-- Restore strict contacts policies
CREATE POLICY "Manage contacts via account access"
ON public.contacts FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.accounts WHERE id = contacts.account_id AND organization_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.accounts WHERE id = contacts.account_id AND organization_id = auth.uid()));

-- Restore strict documents policies
CREATE POLICY "Manage documents via account access"
ON public.documents FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.accounts WHERE id = documents.account_id AND organization_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.accounts WHERE id = documents.account_id AND organization_id = auth.uid()));

-- Restore strict alerts policies
CREATE POLICY "Manage alerts via account access"
ON public.customer_alerts FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.accounts WHERE id = customer_alerts.account_id AND organization_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.accounts WHERE id = customer_alerts.account_id AND organization_id = auth.uid()));

-- Restore strict checklist completions policies
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

-- Restore strict storage policies
CREATE POLICY "Allow account-scoped read on drayage-vault"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'drayage-vault' AND EXISTS (SELECT 1 FROM public.accounts WHERE id::text = (storage.foldername(name))[1] AND organization_id = auth.uid()));

CREATE POLICY "Allow account-scoped upload on drayage-vault"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'drayage-vault' AND EXISTS (SELECT 1 FROM public.accounts WHERE id::text = (storage.foldername(name))[1] AND organization_id = auth.uid()));

CREATE POLICY "Allow account-scoped delete on drayage-vault"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'drayage-vault' AND EXISTS (SELECT 1 FROM public.accounts WHERE id::text = (storage.foldername(name))[1] AND organization_id = auth.uid()));

CREATE POLICY "Allow account-scoped update on drayage-vault"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'drayage-vault' AND EXISTS (SELECT 1 FROM public.accounts WHERE id::text = (storage.foldername(name))[1] AND organization_id = auth.uid()));

COMMIT;
