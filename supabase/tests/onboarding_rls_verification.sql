-- Manual/local Supabase verification for account-scoped RLS.
-- Run after `supabase db reset` with authenticated JWTs whose sub claims match the UUIDs below.
-- Expected: owner can access their account/document/storage object; another authenticated user cannot.

BEGIN;

SELECT plan(6);

SELECT is(
  (SELECT COUNT(*) FROM public.accounts WHERE organization_id <> auth.uid()),
  0::bigint,
  'authenticated users cannot select accounts outside their organization_id'
);

SELECT is(
  (SELECT COUNT(*)
   FROM public.documents d
   JOIN public.accounts a ON a.id = d.account_id
   WHERE a.organization_id <> auth.uid()),
  0::bigint,
  'authenticated users cannot select documents for unauthorized accounts'
);

SELECT is(
  (SELECT COUNT(*)
   FROM public.accessorial_sops s
   JOIN public.accounts a ON a.id = s.account_id
   WHERE a.organization_id <> auth.uid()),
  0::bigint,
  'authenticated users cannot select SOP rows for unauthorized accounts'
);

SELECT is(
  (SELECT COUNT(*)
   FROM public.checklist_document_completions c
   JOIN public.accounts a ON a.id = c.account_id
   WHERE a.organization_id <> auth.uid()),
  0::bigint,
  'authenticated users cannot select checklist completion rows for unauthorized accounts'
);

SELECT throws_ok(
  $$INSERT INTO public.documents(account_id, name, type, storage_path, checklist_item_key)
    SELECT id, 'forged.pdf', 'Other'::public.doc_type_enum, id::text || '/Other/forged.pdf', 'notARealKey'
    FROM public.accounts
    WHERE organization_id = auth.uid()
    LIMIT 1$$,
  '23514',
  NULL,
  'documents rejects arbitrary checklist keys'
);

SELECT is(
  (SELECT COUNT(*)
   FROM storage.objects o
   WHERE o.bucket_id = 'drayage-vault'
     AND NOT EXISTS (
       SELECT 1 FROM public.accounts a
       WHERE a.id::text = (storage.foldername(o.name))[1]
         AND a.organization_id = auth.uid()
     )),
  0::bigint,
  'storage objects visible to an authenticated user are scoped to accessible account path prefixes'
);

SELECT * FROM finish();
ROLLBACK;
