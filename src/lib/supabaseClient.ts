import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase Environment Variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadDocumentToSupabase(
  accountId: string,
  file: File,
  docType: string
) {
  const filePath = `${accountId}/${docType}/${Date.now()}_${file.name}`;

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
    })
    .select()
    .single();

  if (dbError) throw dbError;

  return docRecord;
}
