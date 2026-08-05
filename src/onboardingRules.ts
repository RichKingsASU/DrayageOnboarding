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
export function initializeChecklist(account: Account): ChecklistState {
  if (account.checklistState) {
    return account.checklistState;
  }

  if (account.isNewProspect) {
    return {
      creditApp: false,
      db: false,
      contract: false,
      rateAgreement: 'Contract',
      fuelAgreement: false,
      accessorialAgreement: false,
      folderCreated: false,
      filesUploaded: false,
      internalMeetingDate: '',
      externalMeetingDate: '',
      summaryEmailSent: false,
      auditCompleted: !!account.auditChecklistCompleted,
      workOrderReceived: false,
      onboardingCallCompleted: false,
      notes: '',
      completedBy: 'Tanya Wahl',
      completedDate: '2026-06-19'
    };
  } else {
    return {
      creditApp: account.creditTerms !== 'Prepaid',
      db: account.creditTerms !== 'Prepaid',
      contract: account.stage !== 'CustomerInquiry',
      rateAgreement: account.id === 'act_amazon' ? 'Tariff' : 'Contract',
      fuelAgreement: account.prefCommMethod === 'EDI' || account.id === 'act_amazon' || account.id === 'act_1',
      accessorialAgreement: account.id === 'act_1' || account.id === 'act_2' || account.id === 'act_amazon',
      folderCreated: true,
      filesUploaded: account.documents.some(d => d.type === 'SOP Document'),
      internalMeetingDate: '2026-06-19T09:30',
      externalMeetingDate: '2026-06-19T11:00',
      summaryEmailSent: account.stage === 'OngoingSupport' || account.stage === 'OperationalKickoff',
      auditCompleted: !!account.auditChecklistCompleted,
      workOrderReceived: account.stage === 'OngoingSupport',
      onboardingCallCompleted: account.stage === 'OngoingSupport' || account.stage === 'OperationalKickoff',
      notes: `Review process completed. Account is currently on stage: ${account.stage}. Credit terms approved at ${account.creditTerms}.`,
      completedBy: 'Tanya Wahl',
      completedDate: '2026-06-19'
    };
  }
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
