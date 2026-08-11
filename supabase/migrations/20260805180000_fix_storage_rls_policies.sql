-- File: 20260805180000_fix_storage_rls_policies.sql
-- Purpose: Ensures drayage-vault Supabase Storage bucket permits authenticated and anon uploads, reads, updates, and deletes.
-- Dependencies: storage.objects, storage.buckets, auth.uid(), anon and authenticated roles.

BEGIN;

-- Ensure drayage-vault bucket exists and is accessible
INSERT INTO storage.buckets (id, name, public) 
VALUES ('drayage-vault', 'drayage-vault', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop previous storage policies that might restrict upload
DROP POLICY IF EXISTS "Allow authenticated upload on drayage-vault" ON storage.objects;
DROP POLICY IF EXISTS "Allow account-scoped upload on drayage-vault" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon upload on drayage-vault" ON storage.objects;
DROP POLICY IF EXISTS "Allow demo upload on drayage-vault" ON storage.objects;

DROP POLICY IF EXISTS "Allow authenticated read on drayage-vault" ON storage.objects;
DROP POLICY IF EXISTS "Allow account-scoped read on drayage-vault" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon read on drayage-vault" ON storage.objects;
DROP POLICY IF EXISTS "Allow demo read on drayage-vault" ON storage.objects;

DROP POLICY IF EXISTS "Allow authenticated delete on drayage-vault" ON storage.objects;
DROP POLICY IF EXISTS "Allow account-scoped delete on drayage-vault" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon delete on drayage-vault" ON storage.objects;
DROP POLICY IF EXISTS "Allow demo delete on drayage-vault" ON storage.objects;

DROP POLICY IF EXISTS "Allow authenticated update on drayage-vault" ON storage.objects;
DROP POLICY IF EXISTS "Allow account-scoped update on drayage-vault" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon update on drayage-vault" ON storage.objects;
DROP POLICY IF EXISTS "Allow demo update on drayage-vault" ON storage.objects;

-- Create comprehensive storage policies for drayage-vault
CREATE POLICY "Allow authenticated upload on drayage-vault"
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'drayage-vault');

CREATE POLICY "Allow anon upload on drayage-vault"
ON storage.objects FOR INSERT 
TO anon 
WITH CHECK (bucket_id = 'drayage-vault');

CREATE POLICY "Allow authenticated read on drayage-vault"
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'drayage-vault');

CREATE POLICY "Allow anon read on drayage-vault"
ON storage.objects FOR SELECT 
TO anon 
USING (bucket_id = 'drayage-vault');

CREATE POLICY "Allow authenticated update on drayage-vault"
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'drayage-vault')
WITH CHECK (bucket_id = 'drayage-vault');

CREATE POLICY "Allow anon update on drayage-vault"
ON storage.objects FOR UPDATE 
TO anon 
USING (bucket_id = 'drayage-vault')
WITH CHECK (bucket_id = 'drayage-vault');

CREATE POLICY "Allow authenticated delete on drayage-vault"
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'drayage-vault');

CREATE POLICY "Allow anon delete on drayage-vault"
ON storage.objects FOR DELETE 
TO anon 
USING (bucket_id = 'drayage-vault');

COMMIT;
