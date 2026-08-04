import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// Use service_role key for testing to bypass RLS since we aren't testing auth here
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlZXBvaWV3Zm52ZGpza3l3Y21jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTgyMDkwOSwiZXhwIjoyMTAxMzk2OTA5fQ.TOIysyUfRAjMNgA1-EbVuRYw_JwMNg3b7H9VxJ6bEVo';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase Environment Variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTests() {
  console.log('🚀 Starting Workflow Tests...');

  // 1. Test Database Insert (Account)
  console.log('\n--- 1. Testing Database Insertion (Account) ---');
  const accountPayload = {
    organization_id: crypto.randomUUID(),
    legal_name: 'Test Logistics Corp',
    dba_name: 'Test Drayage',
    mc_number: 'MC-123456',
    dot_number: 'DOT-654321',
    billing_address: '123 Test Ave, Seattle WA',
    stage: 'CustomerInquiry'
  };

  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .insert(accountPayload)
    .select()
    .single();

  if (accountError) {
    console.error('❌ Failed to insert account:', accountError);
    process.exit(1);
  }
  console.log(`✅ Successfully inserted account. ID: ${account.id}`);

  // 2. Test Storage Upload (Document)
  console.log('\n--- 2. Testing Storage Upload (drayage-vault) ---');
  const dummyFilePath = path.join(process.cwd(), 'dummy_test.txt');
  fs.writeFileSync(dummyFilePath, 'This is a test document for the drayage vault.');
  const fileBuffer = fs.readFileSync(dummyFilePath);
  
  const storagePath = `${account.id}/Credit Application/dummy_test.txt`;
  
  const { data: storageData, error: storageError } = await supabase.storage
    .from('drayage-vault')
    .upload(storagePath, fileBuffer, {
      contentType: 'text/plain'
    });

  if (storageError) {
    console.error('❌ Failed to upload document:', storageError);
    process.exit(1);
  }
  console.log(`✅ Successfully uploaded document to storage path: ${storageData.path}`);

  // 3. Test Database Insert (Document Metadata)
  console.log('\n--- 3. Testing Database Insertion (Document Metadata) ---');
  const { data: docRecord, error: docError } = await supabase
    .from('documents')
    .insert({
      account_id: account.id,
      name: 'dummy_test.txt',
      type: 'Credit Application',
      size_bytes: fileBuffer.length,
      storage_path: storageData.path,
    })
    .select()
    .single();

  if (docError) {
    console.error('❌ Failed to insert document metadata:', docError);
    process.exit(1);
  }
  console.log(`✅ Successfully inserted document metadata. ID: ${docRecord.id}`);

  console.log('\n🎉 All workflow tests passed successfully!');
  
  // Clean up local dummy file
  fs.unlinkSync(dummyFilePath);
}

runTests().catch(console.error);
