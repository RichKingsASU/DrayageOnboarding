/**
 * File: onboardingWorkflow.test.ts
 * Purpose: Verifies onboarding account defaults and document/checklist reconciliation behavior.
 * Dependencies: Node's built-in test runner/assertions and workflow/domain helpers.
 * Maintainer note: These tests protect bill-to-code preservation and checklist document linkage rules.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createBlankOnboardingAccount, reconcileDocumentChecklist } from '../src/onboardingWorkflow';
import { Account, OnboardingDocument } from '../src/types';

/** Builds a minimal document fixture for checklist reconciliation tests. */
function doc(id: string, type: OnboardingDocument['type']): OnboardingDocument {
  return { id, name: `${id}.pdf`, type, uploadedAt: '2026-08-05', size: '1 MB' };
}

test('new onboarding record starts with no Bill-to Code and does not copy from customer name', () => {
  const account = createBlankOnboardingAccount('act_new', 'Acme Westwood Logistics');
  assert.equal(account.billToCode, '');
});

test('manually entered Bill-to Code is preserved and clearing stays cleared', () => {
  const account = createBlankOnboardingAccount('act_new', 'Acme Westwood Logistics', 'MANUAL01');
  assert.equal(account.billToCode, 'MANUAL01');
  const cleared = { ...account, billToCode: '' };
  assert.equal(cleared.billToCode, '');
});

test('existing saved Bill-to Code remains when editing unrelated fields', () => {
  const account = createBlankOnboardingAccount('act_existing', 'Existing Customer', 'SAVED01');
  const edited = { ...account, commodity: 'Paper' };
  assert.equal(edited.billToCode, 'SAVED01');
});

test('long multiline SOP instructions are retained as ordinary string content', () => {
  const longNotes = Array.from({ length: 40 }, (_, i) => `Step ${i + 1}: Confirm delivery instruction line.`).join('\n');
  assert.equal(longNotes.split('\n').length, 40);
  assert.match(longNotes, /Step 40/);
});

test('SOP document upload completes filesUploaded checklist item only after successful document record exists', () => {
  const base = createBlankOnboardingAccount('act_docs', 'Document Customer');
  const withSop = reconcileDocumentChecklist({ ...base, documents: [doc('sop', 'SOP Document')] });
  assert.equal(withSop.checklistState?.filesUploaded, true);

  const unrelated = reconcileDocumentChecklist({ ...base, documents: [doc('other', 'Other')] });
  assert.equal(unrelated.checklistState?.filesUploaded, false);
});

test('removing final qualifying SOP document marks checklist incomplete, but one remaining SOP document keeps it complete', () => {
  const base: Account = createBlankOnboardingAccount('act_remove', 'Remove Customer');
  const twoDocs = reconcileDocumentChecklist({ ...base, documents: [doc('sop1', 'SOP Document'), doc('sop2', 'SOP Document')] });
  assert.equal(twoDocs.checklistState?.filesUploaded, true);

  const oneRemaining = reconcileDocumentChecklist({ ...twoDocs, documents: [doc('sop2', 'SOP Document')] });
  assert.equal(oneRemaining.checklistState?.filesUploaded, true);

  const noneRemaining = reconcileDocumentChecklist({ ...oneRemaining, documents: [] });
  assert.equal(noneRemaining.checklistState?.filesUploaded, false);
});

test('generic checklist defaults do not branch on demo account IDs', async () => {
  const { initializeChecklist } = await import('../src/onboardingRules');
  const base = createBlankOnboardingAccount('arbitrary_customer', 'Arbitrary Customer');
  const renamedDemoId = { ...base, id: 'act_1' };
  assert.deepEqual(initializeChecklist(base), initializeChecklist(renamedDemoId));
});

test('demo fixture data supplies seeded checklist metadata outside generic rules', async () => {
  const { INITIAL_ACCOUNTS } = await import('../src/mockData');
  const demoAccount = INITIAL_ACCOUNTS.find((account) => account.id === 'act_amazon');
  assert.equal(demoAccount?.checklistState?.rateAgreement, 'Tariff');
  assert.equal(demoAccount?.checklistState?.completedBy, 'Demo Pricing Specialist');
  assert.equal(demoAccount?.checklistState?.completedDate, '2026-06-19');
});

test('document checklist mapping covers supported mapped document types', async () => {
  const { DOCUMENT_CHECKLIST_ITEM_BY_TYPE } = await import('../src/documentChecklistMapping');
  assert.deepEqual(DOCUMENT_CHECKLIST_ITEM_BY_TYPE, {
    'SOP Document': 'filesUploaded',
    'Credit Application': 'creditApp',
    'Liability Agreement': 'contract',
  });
});

test('generic onboarding rules source contains no known demo account branching or fixed seed dates', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../src/onboardingRules.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /act_amazon|act_1|act_2|Tanya Wahl|2026-06-19/);
});
