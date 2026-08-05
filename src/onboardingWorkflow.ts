/**
 * File: onboardingWorkflow.ts
 * Purpose: Builds blank onboarding accounts and reconciles uploaded documents with checklist completion state.
 * Dependencies: Shared domain types plus onboarding rule helpers.
 * Maintainer note: Document type mappings must stay consistent with database checklist constraints.
 */
import { Account, ChecklistState, OnboardingDocument } from './types';
import { computeAccountStage, initializeChecklist } from './onboardingRules';

/** Maps upload document types to the checklist fields they automatically complete. */
export const DOCUMENT_CHECKLIST_ITEM_BY_TYPE: Partial<Record<OnboardingDocument['type'], keyof ChecklistState>> = {
  'SOP Document': 'filesUploaded',
  'Credit Application': 'creditApp',
  'Liability Agreement': 'contract'
};

/**
 * Creates a new customer-inquiry account with blank onboarding fields and an optional manually entered Bill-to Code.
 */
export function createBlankOnboardingAccount(id: string, name: string, manuallyEnteredBillToCode = ''): Account {
  return {
    id,
    name,
    billToCode: manuallyEnteredBillToCode.trim(),
    creditTerms: '',
    invoiceDocsRequired: [],
    acceptSequenceBills: false,
    commodity: '',
    equipmentType: '',
    loadType: '',
    expectedWeight: '',
    isBonded: false,
    hazmatClass: '',
    cargoValue: 0,
    prefCommMethod: '',
    needsApiEdi: false,
    stage: 'CustomerInquiry',
    alerts: [],
    documents: [],
    billToCodeCreated: false,
    isNewProspect: true
  };
}

/**
 * Synchronizes checklist completion flags with uploaded document types, then recalculates the account's pipeline stage.
 */
export function reconcileDocumentChecklist(account: Account): Account {
  const checklist = { ...initializeChecklist(account) };
  Object.entries(DOCUMENT_CHECKLIST_ITEM_BY_TYPE).forEach(([docType, checklistKey]) => {
    if (checklistKey) {
      checklist[checklistKey] = account.documents.some((doc) => doc.type === docType) as never;
    }
  });

  const updated = { ...account, checklistState: checklist };
  updated.stage = computeAccountStage(updated);
  return updated;
}
