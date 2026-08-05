/**
 * File: documentChecklistMapping.ts
 * Purpose: Defines canonical domain mapping from onboarding document types to checklist completion fields.
 * Dependencies: Shared OnboardingDocument and ChecklistState types.
 * Maintainer note: Keep this mapping aligned with Supabase document metadata and database constraints.
 */
import { ChecklistState, OnboardingDocument } from './types';

export type ChecklistMappedDocumentType = Extract<OnboardingDocument['type'], 'SOP Document' | 'Credit Application' | 'Liability Agreement'>;

/** Maps uploaded document types to the checklist fields they automatically complete. */
export const DOCUMENT_CHECKLIST_ITEM_BY_TYPE = {
  'SOP Document': 'filesUploaded',
  'Credit Application': 'creditApp',
  'Liability Agreement': 'contract'
} as const satisfies Record<ChecklistMappedDocumentType, keyof ChecklistState>;
