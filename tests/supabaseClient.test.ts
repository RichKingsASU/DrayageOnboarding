/**
 * File: supabaseClient.test.ts
 * Purpose: Verifies Supabase payload mapping and document file validation behavior.
 * Dependencies: Node's built-in test runner/assertions plus runtime env placeholders for Supabase client creation.
 * Maintainer note: Environment variables are set before dynamically importing the Supabase client module.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

process.env.VITE_SUPABASE_URL = 'http://localhost:54321';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

const { accountUpdatePayload, validateDocumentFile } = await import('../src/lib/supabaseClient');
const { createBlankOnboardingAccount } = await import('../src/onboardingWorkflow');

test('account update payload does not write stale checklist JSON state', () => {
  const account = {
    ...createBlankOnboardingAccount('account-id', 'Payload Customer', 'BILL01'),
    checklistState: { filesUploaded: false },
  } as any;

  const payload = accountUpdatePayload(account);

  assert.equal(Object.hasOwn(payload, 'checklist_state'), false);
  assert.equal(payload.bill_to_code, 'BILL01');
});

test('cleared Bill-to Code persists as null in Supabase payload', () => {
  const account = createBlankOnboardingAccount('account-id', 'Payload Customer', '');
  const payload = accountUpdatePayload(account);
  assert.equal(payload.bill_to_code, null);
});

test('document validation rejects disallowed MIME types even when extension is allowed', () => {
  const file = new File(['<script>alert(1)</script>'], 'fake.pdf', { type: 'text/html' });
  assert.throws(() => validateDocumentFile(file), /Unsupported MIME type/);
});

test('document validation rejects files exceeding 15MB', () => {
  const largeFile = new File([new Uint8Array(16 * 1024 * 1024)], 'large_document.pdf', { type: 'application/pdf' });
  assert.throws(() => validateDocumentFile(largeFile), /File is too large/);
});

test('document validation rejects disallowed extensions like .zip and .exe', () => {
  const zipFile = new File(['content'], 'archive.zip', { type: 'application/zip' });
  assert.throws(() => validateDocumentFile(zipFile), /Unsupported file type/);

  const exeFile = new File(['binary'], 'installer.exe', { type: 'application/x-msdownload' });
  assert.throws(() => validateDocumentFile(exeFile), /Unsupported file type/);
});

test('document validation accepts valid files under 15MB', () => {
  const pdfFile = new File(['valid content'], 'contract.pdf', { type: 'application/pdf' });
  assert.doesNotThrow(() => validateDocumentFile(pdfFile));

  const pngFile = new File(['png data'], 'coi.png', { type: 'image/png' });
  assert.doesNotThrow(() => validateDocumentFile(pngFile));
});

test('normalized document uses canonical checklist mapping and preserves uploaded_by and description', async () => {
  const { normalizeDocument } = await import('../src/lib/supabaseClient');
  const document = normalizeDocument({
    id: 'doc-id',
    name: 'credit.pdf',
    type: 'Credit Application',
    uploaded_at: '2026-08-05',
    uploaded_by: 'Rich Kings (Rk)',
    description: 'Signed agreement from customer AP',
    size_bytes: 1024 * 1024 * 1.5,
    storage_path: 'account/credit.pdf',
  });
  assert.equal(document.checklistItemKey, 'creditApp');
  assert.equal(document.uploadedBy, 'Rich Kings (Rk)');
  assert.equal(document.description, 'Signed agreement from customer AP');
  assert.equal(document.size, '1.50 MB');
});

test('uploadDocumentToSupabase creates local record gracefully for demo account IDs', async () => {
  const { uploadDocumentToSupabase } = await import('../src/lib/supabaseClient');
  const file = new File(['mock content'], 'test_cert.pdf', { type: 'application/pdf' });
  const result = await uploadDocumentToSupabase('act_demo_123', file, 'SOP Document', 'Demo test note', 'Tester (Specialist)');
  
  assert.ok(result.id.startsWith('doc_'));
  assert.equal(result.name, 'test_cert.pdf');
  assert.equal(result.type, 'SOP Document');
  assert.equal(result.checklist_item_key, 'filesUploaded');
  assert.equal(result.uploaded_by, 'Tester (Specialist)');
  assert.equal(result.description, 'Demo test note');
});

test('deleteDocumentFromSupabase completes safely without throwing on demo documents', async () => {
  const { deleteDocumentFromSupabase } = await import('../src/lib/supabaseClient');
  const demoDoc = {
    id: 'doc_12345',
    name: 'test.pdf',
    type: 'Other' as const,
    uploadedAt: '2026-08-11',
    size: '1.2 MB'
  };
  await assert.doesNotReject(async () => {
    await deleteDocumentFromSupabase(demoDoc);
  });
});

