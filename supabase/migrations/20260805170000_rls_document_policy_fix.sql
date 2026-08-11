-- File: 20260805170000_rls_document_policy_fix.sql
-- Purpose: Unblocks document processing in Supabase backend by enabling appropriate insert policies on documents table.
-- Dependencies: public.documents table, auth.uid(), and anon/authenticated Supabase roles.

BEGIN;

-- Allow authenticated users to insert document metadata
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.documents;
CREATE POLICY "Enable insert for authenticated users" 
ON public.documents 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- If demo mode uses anon role:
DROP POLICY IF EXISTS "Enable insert for anon users in demo" ON public.documents;
CREATE POLICY "Enable insert for anon users in demo" 
ON public.documents 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Ensure select policies for documents in demo and authenticated sessions
DROP POLICY IF EXISTS "Enable select for anon users in demo" ON public.documents;
CREATE POLICY "Enable select for anon users in demo" 
ON public.documents 
FOR SELECT 
TO anon 
USING (true);

-- Enable storage upload for demo anon users on drayage-vault bucket if needed
DROP POLICY IF EXISTS "Allow anon upload on drayage-vault" ON storage.objects;
CREATE POLICY "Allow anon upload on drayage-vault"
ON storage.objects FOR INSERT 
TO anon
WITH CHECK (bucket_id = 'drayage-vault');

DROP POLICY IF EXISTS "Allow anon read on drayage-vault" ON storage.objects;
CREATE POLICY "Allow anon read on drayage-vault"
ON storage.objects FOR SELECT 
TO anon
USING (bucket_id = 'drayage-vault');

COMMIT;
