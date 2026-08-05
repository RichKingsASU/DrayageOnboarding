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
