-- Relax RLS for the public demo to allow anonymous access
BEGIN;

-- Drop strict accounts policies
DROP POLICY IF EXISTS "Allow account owners to read accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow account owners to insert accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow account owners to update accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow admins to delete accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow authenticated team members to read accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow authenticated team members to insert accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow authenticated team members to update accounts" ON public.accounts;

CREATE POLICY "Allow demo access to accounts" ON public.accounts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Drop strict accessorial_sops policies
DROP POLICY IF EXISTS "Manage accessorial_sops via account access" ON public.accessorial_sops;
CREATE POLICY "Allow demo access to accessorial_sops" ON public.accessorial_sops FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Drop strict contacts policies
DROP POLICY IF EXISTS "Manage contacts via account access" ON public.contacts;
CREATE POLICY "Allow demo access to contacts" ON public.contacts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Drop strict documents policies
DROP POLICY IF EXISTS "Manage documents via account access" ON public.documents;
CREATE POLICY "Allow demo access to documents" ON public.documents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Drop strict alerts policies
DROP POLICY IF EXISTS "Manage alerts via account access" ON public.customer_alerts;
CREATE POLICY "Allow demo access to alerts" ON public.customer_alerts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Drop strict checklist completions policies
DROP POLICY IF EXISTS "Manage checklist document completions via account access" ON public.checklist_document_completions;
CREATE POLICY "Allow demo access to checklist completions" ON public.checklist_document_completions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Drop strict storage policies
DROP POLICY IF EXISTS "Allow account-scoped read on drayage-vault" ON storage.objects;
DROP POLICY IF EXISTS "Allow account-scoped upload on drayage-vault" ON storage.objects;
DROP POLICY IF EXISTS "Allow account-scoped delete on drayage-vault" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read on drayage-vault" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload on drayage-vault" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete on drayage-vault" ON storage.objects;

CREATE POLICY "Allow demo read on drayage-vault" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'drayage-vault');
CREATE POLICY "Allow demo upload on drayage-vault" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'drayage-vault');
CREATE POLICY "Allow demo delete on drayage-vault" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'drayage-vault');
CREATE POLICY "Allow demo update on drayage-vault" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'drayage-vault');

COMMIT;
