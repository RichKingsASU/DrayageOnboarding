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
  const formData = new FormData();
  formData.append('file', file);
  formData.append('account', accountId);
  formData.append('type', docType);
  if (notes) formData.append('description', notes);

  const res = await fetch('/api/v1/ondray/onboarding-documents/upload/', {
    method: 'POST',
    body: formData,
    // Add auth headers if required, or let cookies handle it
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Upload failed with status ${res.status}`);
  }

  const data = await res.json();
  // Map Django fields to expected fields
  return {
    ...data,
    size_bytes: parseInt(data.size || '0', 10),
    uploaded_at: data.created_at || new Date().toISOString(),
  };
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

