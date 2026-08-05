-- File: onboarding_rls_verification.sql
-- Purpose: Provides a manual/local pgTAP-style verification script for account-scoped RLS behavior.
-- Dependencies: Supabase local database, pgTAP plan/assertions, auth.uid() override, and migrated onboarding tables.
-- Maintainer note: Intended for local verification after `supabase db reset`, not application runtime.

-- Manual/local Supabase verification for account-scoped RLS.
-- Run after `supabase db reset`

BEGIN;
SELECT plan(19);

-- Setup testing roles
CREATE ROLE test_user_a NOLOGIN;
CREATE ROLE test_user_b NOLOGIN;

-- Use a known organization/user UUID for testing
-- We will use the role name mapped to a UUID, or just gen_random_uuid()
DO $$
DECLARE
  uid_a UUID := '11111111-1111-1111-1111-111111111111'::UUID;
  uid_b UUID := '22222222-2222-2222-2222-222222222222'::UUID;
  act_a UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;
  act_b UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID;
  doc_a UUID := 'dddddddd-aaaa-aaaa-aaaa-dddddddddddd'::UUID;
  doc_b UUID := 'dddddddd-bbbb-bbbb-bbbb-dddddddddddd'::UUID;
BEGIN
  -- Insert dummy test accounts circumventing RLS by using postgres superuser
  INSERT INTO public.accounts (id, legal_name, organization_id) VALUES (act_a, 'Account A', uid_a);
  INSERT INTO public.accounts (id, legal_name, organization_id) VALUES (act_b, 'Account B', uid_b);
  
  -- Insert dummy test docs
  INSERT INTO public.documents (id, account_id, type, storage_path, name) VALUES (doc_a, act_a, 'Other', 'url1', 'doc_a.pdf');
  INSERT INTO public.documents (id, account_id, type, storage_path, name) VALUES (doc_b, act_b, 'Other', 'url2', 'doc_b.pdf');
END $$;

-- 1. Anonymous Access Tests
SET ROLE anon;

SELECT throws_ok(
  'SELECT id FROM public.accounts',
  'permission denied for table accounts',
  'anon should not be able to read accounts'
);
SELECT throws_ok(
  'SELECT id FROM public.documents',
  'permission denied for table documents',
  'anon should not be able to read documents'
);
SELECT throws_ok(
  'INSERT INTO public.accounts (legal_name, organization_id) VALUES (''Hacked'', ''33333333-3333-3333-3333-333333333333'')',
  'permission denied for table accounts',
  'anon should not be able to insert accounts'
);

-- 2. Authenticated Access Tests
RESET ROLE;

-- Authenticate as User A
-- We simulate auth.uid() by setting the request.jwt.claims
SELECT set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111"}', true);
SET ROLE authenticated;

SELECT results_eq(
  'SELECT id FROM public.accounts',
  $$VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID)$$,
  'User A should only see their own accounts'
);

SELECT results_eq(
  'SELECT id FROM public.documents',
  $$VALUES ('dddddddd-aaaa-aaaa-aaaa-dddddddddddd'::UUID)$$,
  'User A should only see their own documents'
);

SELECT lives_ok(
  'INSERT INTO public.accounts (id, legal_name, organization_id) VALUES (''cccccccc-cccc-cccc-cccc-cccccccccccc'', ''User A new'', ''11111111-1111-1111-1111-111111111111'')',
  'User A can insert account if organization_id matches uid'
);

SELECT throws_ok(
  'INSERT INTO public.accounts (id, legal_name, organization_id) VALUES (''eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'', ''User A hack'', ''22222222-2222-2222-2222-222222222222'')',
  'new row violates row-level security policy for table "accounts"',
  'User A cannot insert account for User B'
);

SELECT throws_ok(
  'INSERT INTO public.documents (account_id, type, storage_path, name) VALUES (''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'', ''Other'', ''u'', ''n'')',
  'new row violates row-level security policy for table "documents"',
  'User A cannot insert document for User B account'
);

-- Check storage policies for User A
-- Insert dummy storage object as superuser first
RESET ROLE;
INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('drayage-vault', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/Other/foo.pdf', '11111111-1111-1111-1111-111111111111');
INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('drayage-vault', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/Other/bar.pdf', '22222222-2222-2222-2222-222222222222');

SELECT set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111"}', true);
SET ROLE authenticated;

SELECT results_eq(
  'SELECT name FROM storage.objects WHERE bucket_id = ''drayage-vault''',
  $$VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/Other/foo.pdf')$$,
  'User A should only see objects in their account folder'
);

SELECT lives_ok(
  'INSERT INTO storage.objects (bucket_id, name, owner) VALUES (''drayage-vault'', ''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/Other/baz.pdf'', ''11111111-1111-1111-1111-111111111111'')',
  'User A can upload to their account folder'
);

SELECT throws_ok(
  'INSERT INTO storage.objects (bucket_id, name, owner) VALUES (''drayage-vault'', ''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/Other/hacked.pdf'', ''11111111-1111-1111-1111-111111111111'')',
  'new row violates row-level security policy for table "objects"',
  'User A cannot upload to User B account folder'
);

-- 3. Storage tests for Anon
RESET ROLE;
SELECT set_config('request.jwt.claims', NULL, true);
SET ROLE anon;

SELECT is_empty(
  'SELECT name FROM storage.objects WHERE bucket_id = ''drayage-vault''',
  'anon should not see any storage objects'
);

SELECT throws_ok(
  'INSERT INTO storage.objects (bucket_id, name) VALUES (''drayage-vault'', ''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/Other/anon.pdf'')',
  'new row violates row-level security policy for table "objects"',
  'anon cannot upload storage objects'
);

SELECT throws_ok(
  'DELETE FROM storage.objects WHERE bucket_id = ''drayage-vault'' AND name = ''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/Other/foo.pdf''',
  'Direct deletion from storage tables is not allowed. Use the Storage API instead.',
  'anon cannot delete storage objects'
);

-- 4. ensure_demo_workspace RPC tests
SELECT throws_ok(
  'SELECT public.ensure_demo_workspace()',
  'Not authenticated. ensure_demo_workspace requires a valid Supabase session.',
  'anon cannot execute ensure_demo_workspace without an authenticated session'
);

RESET ROLE;
SELECT set_config('request.jwt.claims', '{"sub": "99999999-9999-9999-9999-999999999999"}', true);
SET ROLE authenticated;

SELECT lives_ok(
  'SELECT public.ensure_demo_workspace()',
  'Authenticated new user can provision demo workspace'
);

SELECT results_eq(
  'SELECT legal_name FROM public.accounts WHERE organization_id = ''99999999-9999-9999-9999-999999999999''',
  $$VALUES ('OnDray Demo Customer')$$,
  'Demo workspace correctly provisions account'
);

SELECT lives_ok(
  'SELECT public.ensure_demo_workspace()',
  'ensure_demo_workspace is idempotent and can be called repeatedly safely'
);


-- Finish tests and rollback transaction
SELECT * FROM finish();
ROLLBACK;
