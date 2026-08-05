import { createClient } from '@supabase/supabase-js';
import { Account, AccessorialSOP, ChecklistState, OnboardingDocument } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase Environment Variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const DOCUMENT_MAX_BYTES = 15 * 1024 * 1024;
export const DOCUMENT_ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'] as const;
export const DOCUMENT_CHECKLIST_ITEM_BY_TYPE: Partial<Record<OnboardingDocument['type'], keyof ChecklistState>> = {
  'SOP Document': 'filesUploaded',
  'Credit Application': 'creditApp',
  'Liability Agreement': 'contract'
};

export function validateDocumentFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!DOCUMENT_ALLOWED_EXTENSIONS.includes(extension as any)) {
    throw new Error(`Unsupported file type. Allowed types: ${DOCUMENT_ALLOWED_EXTENSIONS.join(', ')}.`);
  }
  if (file.size > DOCUMENT_MAX_BYTES) {
    throw new Error('File is too large. Maximum supported upload size is 15MB.');
  }
}

export function normalizeDocument(row: any): OnboardingDocument {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    uploadedAt: row.uploaded_at,
    size: row.size_bytes ? `${(Number(row.size_bytes) / (1024 * 1024)).toFixed(2)} MB` : '0 MB',
    contentKey: row.storage_path,
    storagePath: row.storage_path,
    uploadedBy: row.uploaded_by || 'System',
    checklistItemKey: row.checklist_item_key || DOCUMENT_CHECKLIST_ITEM_BY_TYPE[row.type as OnboardingDocument['type']],
    description: row.description || ''
  };
}

export function normalizeSOP(row: any): AccessorialSOP {
  return {
    id: row.id,
    accountId: row.account_id,
    chassisFee: Number(row.chassis_fee || 0),
    prePullFee: Number(row.pre_pull_fee || 0),
    storageFee: Number(row.storage_fee || 0),
    emptyStorageFee: Number(row.empty_storage_fee || 0),
    detentionRate: Number(row.detention_rate || 0),
    detentionFreeTime: Number(row.detention_free_time || 0),
    chassisSplitFee: Number(row.chassis_split_fee || 0),
    cleanTruckFee: Number(row.clean_truck_fee || 0),
    appointmentType: row.appointment_type === 'Drop and Hook' || row.appointment_type === 'Both' ? row.appointment_type : 'Live Unload',
    requiredStatusUpdates: row.required_status_updates || [],
    hasYardHostler: !!row.has_yard_hostler,
    peelPilesPermitted: !!row.peel_piles_permitted,
    privateChassisPermitted: !!row.private_chassis_permitted,
    freeTimeDays: Number(row.free_time_days || 0),
    deliveryRules: row.delivery_rules || ''
  };
}

export function normalizeAccount(row: any): Account {
  const docs = (row.documents || []).map(normalizeDocument);
  return {
    id: row.id,
    name: row.legal_name || row.name || '',
    billToCode: row.bill_to_code || '',
    creditTerms: row.credit_terms || '',
    invoiceDocsRequired: row.invoice_docs_required || [],
    acceptSequenceBills: !!row.accept_sequence_bills,
    commodity: row.commodity || '',
    equipmentType: row.equipment_type || '',
    loadType: row.load_type || '',
    expectedWeight: row.expected_weight || '',
    isBonded: !!row.is_bonded,
    hazmatClass: row.hazmat_class || '',
    cargoValue: Number(row.cargo_value || 0),
    prefCommMethod: row.pref_comm_method || '',
    needsApiEdi: !!row.needs_api_edi,
    stage: row.stage || 'CustomerInquiry',
    alerts: row.alerts || [],
    documents: docs,
    billToCodeCreated: !!row.bill_to_code_created,
    auditChecklistCompleted: !!row.audit_checklist_completed,
    checklistState: row.checklist_state || undefined,
  };
}

export function accountUpdatePayload(account: Account) {
  return {
    legal_name: account.name,
    bill_to_code: account.billToCode?.trim() || null,
    credit_terms: account.creditTerms || null,
    invoice_docs_required: account.invoiceDocsRequired || [],
    accept_sequence_bills: account.acceptSequenceBills,
    commodity: account.commodity || null,
    equipment_type: account.equipmentType || null,
    load_type: account.loadType || null,
    expected_weight: account.expectedWeight || null,
    is_bonded: account.isBonded,
    hazmat_class: account.hazmatClass || null,
    cargo_value: account.cargoValue || 0,
    pref_comm_method: account.prefCommMethod || null,
    needs_api_edi: account.needsApiEdi,
    stage: account.stage,
    bill_to_code_created: !!account.billToCodeCreated,
    audit_checklist_completed: !!account.auditChecklistCompleted,
    checklist_state: account.checklistState || null,
    updated_at: new Date().toISOString()
  };
}

export async function uploadDocumentToSupabase(
  accountId: string,
  file: File,
  docType: OnboardingDocument['type'],
  description = ''
) {
  validateDocumentFile(file);
  const checklistItemKey = DOCUMENT_CHECKLIST_ITEM_BY_TYPE[docType] || null;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${accountId}/${docType}/${Date.now()}_${safeName}`;

  // 1. Upload to Supabase Storage
  const { data: storageData, error: storageError } = await supabase.storage
    .from('drayage-vault')
    .upload(filePath, file);

  if (storageError) throw storageError;

  // 2. Insert record in documents table
  const { data: docRecord, error: dbError } = await supabase
    .from('documents')
    .insert({
      account_id: accountId,
      name: file.name,
      type: docType,
      size_bytes: file.size,
      storage_path: storageData.path,
      checklist_item_key: checklistItemKey,
      description: description.trim() || null,
    })
    .select()
    .single();

  if (dbError) throw dbError;

  return docRecord;
}

export async function deleteDocumentFromSupabase(document: OnboardingDocument) {
  if (document.storagePath || document.contentKey) {
    const storagePath = document.storagePath || document.contentKey;
    if (storagePath && !storagePath.trim().startsWith('{')) {
      const { error: storageError } = await supabase.storage.from('drayage-vault').remove([storagePath]);
      if (storageError) throw storageError;
    }
  }

  const { error: dbError } = await supabase.from('documents').delete().eq('id', document.id);
  if (dbError) throw dbError;
}
