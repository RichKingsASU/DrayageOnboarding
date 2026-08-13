/**
 * File: azureClient.ts
 * Purpose: Provides Azure Data API Builder and Blob Storage connectivity.
 * Note: Currently stubbed pending Azure provisioning and configuration.
 */

export const isAzureConfigured = false; // Stub

// This will eventually hold the Web PubSub connection client
export const azurePubSub = null;

export const normalizeAccount = (row: any) => ({
  id: row.id,
  organizationId: row.organization_id,
  legalName: row.legal_name,
  dbaName: row.dba_name,
  mcNumber: row.mc_number,
  dotNumber: row.dot_number,
  billingAddress: row.billing_address,
  stage: row.stage,
  billToCode: row.bill_to_code || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const normalizeSOP = (row: any) => ({
  id: row.id,
  accountId: row.account_id,
  chassisFee: row.chassis_fee,
  prePullFee: row.pre_pull_fee,
  storageFee: row.storage_fee,
  emptyStorageFee: row.empty_storage_fee,
  detentionRate: row.detention_rate,
  detentionFreeTime: row.detention_free_time,
  chassisSplitFee: row.chassis_split_fee,
  cleanTruckFee: row.clean_truck_fee,
  appointmentType: row.appointment_type,
  requiredStatusUpdates: row.required_status_updates || [],
  hasYardHostler: row.has_yard_hostler,
  peelPilesPermitted: row.peel_piles_permitted,
  privateChassisPermitted: row.private_chassis_permitted,
  freeTimeDays: row.free_time_days,
  deliveryRules: row.delivery_rules || '',
});

export const accountUpdatePayload = (acc: any) => ({
  legal_name: acc.legalName,
  dba_name: acc.dbaName,
  mc_number: acc.mcNumber,
  dot_number: acc.dotNumber,
  billing_address: acc.billingAddress,
  stage: acc.stage,
  bill_to_code: acc.billToCode || null,
  updated_at: new Date().toISOString(),
});

export async function uploadDocumentToAzure(
  accountId: string,
  file: File,
  docType: string,
  notes?: string,
  uploadedBy?: string
) {
  console.log('Upload to Azure Blob Storage not yet implemented. Stubbed for:', file.name);
  return { data: { id: 'stub_id', path: 'stub/path' }, error: null };
}

export async function deleteDocumentFromAzure(doc: any) {
  console.log('Delete from Azure Blob Storage not yet implemented. Stubbed for:', doc.name);
  return { error: null };
}

export function getDocumentUrl(storagePath: string) {
  return '#stub_url';
}

export const DOCUMENT_ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg'];
export const DOCUMENT_MAX_BYTES = 15 * 1024 * 1024; // 15MB

export function validateDocumentFile(file: File) {
  if (file.size > DOCUMENT_MAX_BYTES) {
    throw new Error(`File ${file.name} exceeds 15MB limit.`);
  }
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!DOCUMENT_ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`File type ${ext} not allowed.`);
  }
}

