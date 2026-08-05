-- File: onboarding_rls_verification.sql
-- Purpose: Provides a manual/local pgTAP-style verification script for account-scoped RLS behavior.
-- Dependencies: Supabase local database, pgTAP plan/assertions, auth.uid() override, and migrated onboarding tables.
-- Maintainer note: Intended for local verification after `supabase db reset`, not application runtime.

-- Manual/local Supabase verification for account-scoped RLS.
-- Run after `supabase db reset`

BEGIN;

SELECT plan(22);

-- Set up two test users
-- User A
\set user_a_id '11111111-1111-1111-1111-111111111111'
-- User B
\set user_b_id '22222222-2222-2222-2222-222222222222'

-- Mock auth.uid() function for testing RLS if not running via postgrest
-- pgTAP testing locally often relies on set_config or mocking. We'll use role switching
-- But since we don't have user roles easily set up in pgTAP without assuming a lot,
-- we'll just test the policies by temporarily overriding auth.uid().
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
  SELECT current_setting('request.jwt.claim.sub', true)::uuid;
$$ LANGUAGE sql;

-- Switch to postgres to insert base data
SET ROLE postgres;

-- Insert accounts for User A
INSERT INTO public.accounts (id, organization_id, legal_name, stage)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', :'user_a_id', 'User A Corp', 'CustomerInquiry');

-- Insert accounts for User B
INSERT INTO public.accounts (id, organization_id, legal_name, stage)
VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', :'user_b_id', 'User B Inc', 'CustomerInquiry');

-- Insert SOP for User A
INSERT INTO public.accessorial_sops (account_id) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
-- Insert SOP for User B
INSERT INTO public.accessorial_sops (account_id) VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');


-- Simulate User A Request
SET ROLE authenticated;
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

SELECT is(
  (SELECT COUNT(*) FROM public.accounts),
  1::bigint,
  'User A can only see their own account'
);

SELECT is(
  (SELECT COUNT(*) FROM public.accounts WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  0::bigint,
  'User A cannot select User B account'
);

-- Try to insert a document for User B
SELECT throws_ok(
  $$INSERT INTO public.documents(account_id, name, type, storage_path) VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'test.pdf', 'Other', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/test.pdf')$$,
  'new row violates row-level security policy for table "documents"',
  'User A cannot insert document for User B account'
);

-- User A inserts document for User A
SELECT lives_ok(
  $$INSERT INTO public.documents(id, account_id, name, type, storage_path) VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'test.pdf', 'Other', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/test.pdf')$$,
  'User A can insert document for User A account'
);

-- Try to update User B's account
SELECT is(
  (WITH updated AS (UPDATE public.accounts SET legal_name = 'Hacked' WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' RETURNING 1) SELECT count(*) FROM updated),
  0::bigint,
  'User A cannot update User B account'
);

-- Try to delete User B's account
SELECT is(
  (WITH deleted AS (DELETE FROM public.accounts WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' RETURNING 1) SELECT count(*) FROM deleted),
  0::bigint,
  'User A cannot delete User B account'
);

-- Simulate User B Request
SET ROLE authenticated;
SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

SELECT is(
  (SELECT COUNT(*) FROM public.accounts),
  1::bigint,
  'User B can only see their own account'
);

-- User B cannot see User A's document
SELECT is(
  (SELECT COUNT(*) FROM public.documents WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  0::bigint,
  'User B cannot select User A document'
);

-- User B cannot delete User A's document
SELECT is(
  (WITH deleted AS (DELETE FROM public.documents WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' RETURNING 1) SELECT count(*) FROM deleted),
  0::bigint,
  'User B cannot delete User A document'
);

-- Simulate unsupported checklist key constraint
SET ROLE authenticated;
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

SELECT throws_ok(
  $$INSERT INTO public.documents(account_id, name, type, storage_path, checklist_item_key)
    VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'forged.pdf', 'Other', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/Other/forged.pdf', 'notARealKey')$$,
  '23514',
  NULL,
  'documents rejects arbitrary checklist keys'
);

-- Test Storage Policies
SET ROLE postgres;
INSERT INTO storage.objects (id, bucket_id, name, owner)
VALUES
  ('objA', 'drayage-vault', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/Other/doc.pdf', '11111111-1111-1111-1111-111111111111'),
  ('objB', 'drayage-vault', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/Other/doc.pdf', '22222222-2222-2222-2222-222222222222');

SET ROLE authenticated;
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

SELECT is(
  (SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'drayage-vault'),
  1::bigint,
  'User A can only see storage objects for their account prefix'
);

SELECT is(
  (SELECT id FROM storage.objects WHERE bucket_id = 'drayage-vault'),
  'objA'::uuid,
  'User A sees objA'
);

SELECT throws_ok(
  $$INSERT INTO storage.objects (id, bucket_id, name, owner) VALUES ('objHack', 'drayage-vault', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/Other/hack.pdf', '11111111-1111-1111-1111-111111111111')$$,
  'new row violates row-level security policy for table "objects"',
  'User A cannot upload to User B path'
);

SELECT lives_ok(
  $$INSERT INTO storage.objects (id, bucket_id, name, owner) VALUES ('objA2', 'drayage-vault', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/Other/doc2.pdf', '11111111-1111-1111-1111-111111111111')$$,
  'User A can upload to User A path'
);

-- Delete tests
SELECT is(
  (WITH deleted AS (DELETE FROM storage.objects WHERE id = 'objB' RETURNING 1) SELECT count(*) FROM deleted),
  0::bigint,
  'User A cannot delete User B storage object'
);

SELECT is(
  (WITH deleted AS (DELETE FROM storage.objects WHERE id = 'objA' RETURNING 1) SELECT count(*) FROM deleted),
  1::bigint,
  'User A can delete User A storage object'
);

-- Trigger logic: verify checklist sync
SET ROLE postgres;
DELETE FROM public.documents;
DELETE FROM public.checklist_document_completions;

SET ROLE authenticated;
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

INSERT INTO public.documents (id, account_id, name, type, storage_path)
VALUES ('d1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sop.pdf', 'SOP Document', 'path');

SELECT is(
  (SELECT count(*) FROM public.checklist_document_completions WHERE account_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' AND checklist_item_key = 'filesUploaded'),
  1::bigint,
  'Inserting SOP document creates checklist completion row'
);

SELECT is(
  (SELECT checklist_state->>'filesUploaded' FROM public.accounts WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'true',
  'Inserting SOP document sets checklist_state'
);

-- Inserting second SOP document
INSERT INTO public.documents (id, account_id, name, type, storage_path)
VALUES ('d2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sop2.pdf', 'SOP Document', 'path2');

-- Delete one
DELETE FROM public.documents WHERE id = 'd1111111-1111-1111-1111-111111111111';

SELECT is(
  (SELECT checklist_state->>'filesUploaded' FROM public.accounts WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'true',
  'Deleting one of multiple SOP documents keeps checklist_state true'
);

-- Delete the other
DELETE FROM public.documents WHERE id = 'd2222222-2222-2222-2222-222222222222';

SELECT is(
  (SELECT checklist_state->>'filesUploaded' FROM public.accounts WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'false',
  'Deleting final SOP document sets checklist_state false'
);


SELECT * FROM finish();
ROLLBACK;
