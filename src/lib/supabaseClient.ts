/**
 * File: supabaseClient.ts
 * Purpose: Creates the Supabase client and maps account/document records between UI and database shapes.
 * Dependencies: Supabase JavaScript client, runtime Vite/Node environment variables, and shared domain types.
 * Maintainer note: Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY at runtime.
 */
import { createClient } from '@supabase/supabase-js';
import { Account, AccessorialSOP, OnboardingDocument } from '../types';
import { DOCUMENT_CHECKLIST_ITEM_BY_TYPE } from '../documentChecklistMapping';

const runtimeEnv = (typeof import.meta !== 'undefined' && import.meta.env) || process.env;
const supabaseUrl = runtimeEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = runtimeEnv.VITE_SUPABASE_ANON_KEY || '';

/** True when required env vars are present. Check before rendering protected UI. */
export const isSuabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

const realtimeTransport = typeof WebSocket === 'undefined'
  ? class TestWebSocket {
      constructor() {
        throw new Error('Realtime WebSocket transport is unavailable in this environment.');
      }
    }
  : WebSocket;

/** Shared Supabase client used for database, storage, and realtime calls. */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { transport: realtimeTransport as any }
});

/** Maximum accepted onboarding document upload size in bytes. */
export const DOCUMENT_MAX_BYTES = 15 * 1024 * 1024;
/** File extensions accepted by the onboarding document validator. */
export const DOCUMENT_ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'] as const;
/** MIME types accepted by the onboarding document validator when the browser provides one. */
export const DOCUMENT_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg'
] as const;

/**
 * Validates client-selected onboarding documents against extension, size, and MIME-type rules.
 */
export function validateDocumentFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!DOCUMENT_ALLOWED_EXTENSIONS.includes(extension as any)) {
    throw new Error(`Unsupported file type. Allowed types: ${DOCUMENT_ALLOWED_EXTENSIONS.join(', ')}.`);
  }
  if (file.size > DOCUMENT_MAX_BYTES) {
    throw new Error('File is too large. Maximum supported upload size is 15MB.');
  }
  if (file.type && !DOCUMENT_ALLOWED_MIME_TYPES.includes(file.type as any)) {
    throw new Error('Unsupported MIME type for this document.');
  }
}


/**
 * Converts a Supabase documents row into the OnboardingDocument shape consumed by React components.
 */
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

/**
 * Converts a Supabase accessorial_sops row into the AccessorialSOP domain shape used by the UI.
 */
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

/**
 * Converts a Supabase accounts row and nested relations into the Account domain shape used by the UI.
 */
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

/**
 * Builds the Supabase accounts update payload for editable Account fields without writing derived checklist JSON.
 */
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
    updated_at: new Date().toISOString()
  };
}

/**
 * Uploads a validated onboarding document to Supabase Storage and records its metadata in the documents table.
 */
export async function uploadDocumentToSupabase(
  accountId: string,
  file: File,
  docType: OnboardingDocument['type'],
  description = '',
  uploadedBy = ''
) {
  validateDocumentFile(file);
  const checklistItemKey = DOCUMENT_CHECKLIST_ITEM_BY_TYPE[docType] || null;
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const categorySlug = docType.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const filePath = `${accountId}/${categorySlug}/${crypto.randomUUID()}.${extension}`;

  let effectiveUploadedBy = uploadedBy;
  if (!effectiveUploadedBy) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      effectiveUploadedBy = authData.user?.email || authData.user?.user_metadata?.full_name || 'Tanya Wahl (Specialist)';
    } catch {
      effectiveUploadedBy = 'Tanya Wahl (Specialist)';
    }
  }

  // If local demo account (starts with 'act_') or Supabase is not configured, generate a local document object
  if (accountId.startsWith('act_') || !isSuabaseConfigured) {
    return {
      id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      account_id: accountId,
      name: file.name,
      type: docType,
      size_bytes: file.size,
      storage_path: filePath,
      checklist_item_key: checklistItemKey,
      description: description.trim() || null,
      uploaded_by: effectiveUploadedBy,
      uploaded_at: new Date().toISOString()
    };
  }

  // 1. Upload to Supabase Storage
  const { data: storageData, error: storageError } = await supabase.storage
    .from('drayage-vault')
    .upload(filePath, file);

  if (storageError) {
    console.error('Supabase storage upload error:', storageError);
    throw new Error(storageError.message || 'Storage upload failed. Please check storage permissions.');
  }

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
      uploaded_by: effectiveUploadedBy,
    })
    .select()
    .single();

  if (dbError) {
    await supabase.storage.from('drayage-vault').remove([storageData.path]);
    console.error('Supabase documents insert error:', dbError);
    throw new Error(dbError.message || 'Database insert failed for document record.');
  }

  return docRecord;
}

/**
 * Deletes document metadata and, when present, the matching Supabase Storage object.
 */
export async function deleteDocumentFromSupabase(document: OnboardingDocument) {
  if (document.id.startsWith('doc_') || !isSuabaseConfigured) {
    return;
  }
  if (document.storagePath || document.contentKey) {
    const storagePath = document.storagePath || document.contentKey;
    if (storagePath && !storagePath.trim().startsWith('{')) {
      try {
        await supabase.storage.from('drayage-vault').remove([storagePath]);
      } catch (err) {
        console.warn('Storage cleanup warning:', err);
      }
    }
  }

  const { error: dbError } = await supabase.from('documents').delete().eq('id', document.id);
  if (dbError) throw dbError;
}
