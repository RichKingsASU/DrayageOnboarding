/**
 * File: onboardingRules.ts
 * Purpose: Encapsulates checklist initialization and pipeline-stage derivation rules for onboarding accounts.
 * Dependencies: Shared Account, ChecklistState, and PipelineStage types.
 * Maintainer note: Business-rule changes here can affect Kanban placement and dashboard completion status.
 */
import { Account, ChecklistState, PipelineStage } from './types';

/**
 * Returns the persisted checklist state when available, otherwise derives the default checklist for a prospect or existing account.
 */
export interface ChecklistDefaultsInput {
  account: Account;
  completedBy?: string;
  completedDate?: string;
  internalMeetingDate?: string;
  externalMeetingDate?: string;
  rateAgreement?: string;
  fuelAgreement?: boolean;
  accessorialAgreement?: boolean;
  notes?: string;
}

/**
 * Builds a generic checklist default from account state plus optional persisted or fixture-supplied metadata.
 */
export function buildDefaultChecklist({
  account,
  completedBy = '',
  completedDate = '',
  internalMeetingDate = '',
  externalMeetingDate = '',
  rateAgreement,
  fuelAgreement,
  accessorialAgreement,
  notes,
}: ChecklistDefaultsInput): ChecklistState {
  const isExistingAccount = !account.isNewProspect;
  return {
    creditApp: isExistingAccount && account.creditTerms !== 'Prepaid',
    db: isExistingAccount && account.creditTerms !== 'Prepaid',
    contract: isExistingAccount && account.stage !== 'CustomerInquiry',
    rateAgreement: rateAgreement || 'Contract',
    fuelAgreement: fuelAgreement ?? (isExistingAccount && account.prefCommMethod === 'EDI'),
    accessorialAgreement: accessorialAgreement ?? false,
    folderCreated: isExistingAccount,
    filesUploaded: account.documents.some((document) => document.type === 'SOP Document'),
    internalMeetingDate,
    externalMeetingDate,
    summaryEmailSent: isExistingAccount && (account.stage === 'OngoingSupport' || account.stage === 'OperationalKickoff'),
    auditCompleted: !!account.auditChecklistCompleted,
    workOrderReceived: isExistingAccount && account.stage === 'OngoingSupport',
    onboardingCallCompleted: isExistingAccount && (account.stage === 'OngoingSupport' || account.stage === 'OperationalKickoff'),
    notes: notes ?? (isExistingAccount
      ? `Review process completed. Account is currently on stage: ${account.stage}. Credit terms approved at ${account.creditTerms}.`
      : ''),
    completedBy,
    completedDate
  };
}

/**
 * Returns the persisted checklist state when available, otherwise derives generic defaults for a prospect or existing account.
 */
export function initializeChecklist(account: Account): ChecklistState {
  return account.checklistState || buildDefaultChecklist({ account });
}
/**
 * Computes the workflow pipeline stage implied by agreement, setup, document, kickoff, and work-order checklist state.
 */
export function computeAccountStage(account: Account): PipelineStage {
  const checklist = initializeChecklist(account);

  const isAuditCompleted = !!account.auditChecklistCompleted || !!checklist.auditCompleted;
  const isBillToCreated = !!account.billToCodeCreated;

  let targetStage: PipelineStage = account.stage;

  // Step 1: Agreement Stage
  // If not even Agreement toggles are checked, it falls back to Inquiry
  if (!(checklist.creditApp && checklist.db && checklist.contract)) {
    targetStage = 'CustomerInquiry';
  } else {
    // Stage must be at least Agreement
    if (targetStage === 'CustomerInquiry') {
      targetStage = 'Agreement';
    }

    // Step 2: AccountSetup Stage
    // Move to AccountSetup if Bill To Code is Created and Audit Checklist is marked as Completed,
    // or if the agreements (fuel & accessorial) are set.
    const setupMet = (isBillToCreated && isAuditCompleted) || (checklist.fuelAgreement && checklist.accessorialAgreement);
    if (setupMet) {
      if (targetStage === 'Agreement') {
        targetStage = 'AccountSetup';
      }
    }
  }

  // Final OVERRIDE from User:
  // "once all toggles on the Customer Onboarding checklist are checked and all the Onboarding documents audit checklist and uploaded and toggles are completed, the customer will move to the operational kickoff tab on the onboarding pipeline"
  
  // 1. All remaining toggles on Customer Onboarding checklist checked.
  // Note: 'folderCreated', 'filesUploaded', and 'summaryEmailSent' have been removed from the checklist
  const allOnboardingTogglesChecked = 
    checklist.creditApp &&
    checklist.db &&
    checklist.contract &&
    checklist.fuelAgreement &&
    checklist.accessorialAgreement &&
    isAuditCompleted;

  // 2. All Onboarding documents uploaded (the 4 types)
  const allDocTypesUploaded = ['Credit Application', 'Liability Agreement', 'SOP Document', 'Other'].every(type =>
    account.documents.some(d => d.type === type)
  );

  // 3. Document toggles completed (Bill To CodeCreated & Audit Checklist Completed)
  const documentTogglesCompleted = isBillToCreated && isAuditCompleted;

  if (allOnboardingTogglesChecked && allDocTypesUploaded && documentTogglesCompleted) {
    targetStage = 'OperationalKickoff';
  }

  // Under the Customer onboarding checklist add a "customer Onboarding call" check box, 
  // once this toggle is activated the customer profile should move into the "operational kickoff" tab.
  if (checklist.onboardingCallCompleted) {
    targetStage = 'OperationalKickoff';
  }

  // Edit 2: Once the "work order received" toggle check box is clicked, 
  // the customer profile should move to the "active and ongoing support" (OngoingSupport) tab.
  if (checklist.workOrderReceived) {
    targetStage = 'OngoingSupport';
  }

  return targetStage;
}
