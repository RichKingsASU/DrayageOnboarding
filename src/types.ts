/**
 * File: types.ts
 * Purpose: Defines shared domain types for accounts, contacts, onboarding documents, SOPs, and workflow state.
 * Dependencies: Consumed throughout the React UI, Supabase mapping layer, workflow rules, and tests.
 * Maintainer note: Keep these types aligned with Supabase enum/table definitions in migrations.
 */
export type CreditTerms = 'Prepaid' | 'Net 15' | 'Net 30' | 'Special (Net 45)' | 'Special (Net 60)' | '';
export type EquipmentType = 'Dry' | 'Reefer' | '';
export type LoadType = 'Palletized' | 'Floor Loaded' | 'Both' | '';
export type PreferredComm = 'Email' | 'Phone' | 'SMS' | 'EDI' | 'Customer Portal' | '';
export type PipelineStage = 'CustomerInquiry' | 'Agreement' | 'AccountSetup' | 'OperationalKickoff' | 'OngoingSupport';

export interface CustomerAlert {
  id: string;
  type: 'danger' | 'warning' | 'info';
  message: string;
}

export interface OnboardingDocument {
  id: string;
  name: string;
  type: 'Credit Application' | 'Liability Agreement' | 'SOP Document' | 'Other';
  uploadedAt: string;
  size: string;
  contentKey?: string;
  storagePath?: string;
  uploadedBy?: string;
  checklistItemKey?: keyof ChecklistState;
  description?: string;
}


export interface Account {
  id: string;
  name: string;
  billToCode: string;
  creditTerms: CreditTerms;
  invoiceDocsRequired: string[]; // e.g. POD, Interchange Receipt, Custom Voucher
  acceptSequenceBills: boolean;
  
  // Cargo Profile
  commodity: string;
  equipmentType: EquipmentType;
  loadType: LoadType;
  expectedWeight: string; // e.g. "43,000 lbs max"
  isBonded: boolean;
  hazmatClass: string; // e.g. "Class 3", "N/A"
  cargoValue: number; // in USD
  
  // Communication
  prefCommMethod: PreferredComm;
  needsApiEdi: boolean;
  
  // Pipeline
  stage: PipelineStage;
  
  // Custom Red Flag SOP Alerts
  alerts: CustomerAlert[];
  
  // Embedded Document records
  documents: OnboardingDocument[];
  billToCodeCreated?: boolean;
  auditChecklistCompleted?: boolean;
  isNewProspect?: boolean;
  checklistState?: ChecklistState;
}

export interface ChecklistState {
  creditApp: boolean;
  db: boolean;
  contract: boolean;
  rateAgreement: string;
  fuelAgreement: boolean;
  accessorialAgreement: boolean;
  folderCreated: boolean;
  filesUploaded: boolean;
  internalMeetingDate: string;
  externalMeetingDate: string;
  summaryEmailSent: boolean;
  auditCompleted?: boolean;
  workOrderReceived?: boolean;
  onboardingCallCompleted?: boolean;
  notes: string;
  completedBy: string;
  completedDate: string;
}

export type ContactRole = 'Operations' | 'After-hours/Escalation' | 'Billing' | 'Warehouse/Receiving' | 'Claims/Dispute Resolution';

export interface Contact {
  id: string;
  accountId: string;
  name: string;
  title?: string;
  email: string;
  phone: string;
  role: ContactRole;
  notes?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  title: string;
}

export type MovementType = 'Import' | 'Export' | 'Street Turn';
export type EquipmentSize = '20\'' | '40\'' | '40\'HC' | '45\'';
export type BillingType = 'Base + Fuel' | 'All-in';

export interface Lane {
  id: string;
  accountId: string;
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  miles: number;
  movementType: MovementType;
  equipmentSize: EquipmentSize;
  linehaulRate: number; // Customer Published Rate (USD)
  billingType: BillingType;
  carrierTargetPay: number; // Locked Internal Target (USD)
  effectiveDate: string;
  terminationDate: string;
  reviewDate: string;
}

export type AppointmentType = 'Drop and Hook' | 'Live Unload' | 'Both';
export type StatusUpdateCheck = 'LFD' | 'Container Outgate' | 'In Transit' | 'On Site' | 'POD Sent' | 'Empty Return';

export interface AccessorialSOP {
  id: string;
  accountId: string;
  chassisFee: number; // USD per day
  prePullFee: number; // USD flat
  storageFee: number; // USD per day
  emptyStorageFee: number; // USD per day
  detentionRate: number; // USD per hour
  detentionFreeTime: number; // Hours free
  chassisSplitFee: number; // USD flat
  cleanTruckFee: number; // USD flat
  
  // Facility / Delivery Rules
  appointmentType: AppointmentType;
  requiredStatusUpdates: StatusUpdateCheck[];
  hasYardHostler: boolean;
  peelPilesPermitted: boolean;
  privateChassisPermitted: boolean;
  freeTimeDays: number; // Standard demurrages free-time line
  deliveryRules: string; // e.g. SOP custom instructions
}
