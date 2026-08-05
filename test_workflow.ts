/**
 * File: test_workflow.ts
 * Purpose: Provides a manual, privileged Supabase workflow smoke test for account insertion, storage upload, and document metadata.
 * Dependencies: Supabase JavaScript client, dotenv, Node filesystem/path/crypto modules, and local Supabase env values.
 * Maintainer note: This script is not imported by frontend code. It requires SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS and must never be exposed to browser bundles.
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

function requiredEnv(name: 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY'): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

const supabaseUrl = requiredEnv('SUPABASE_URL');
const supabaseServiceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function runTests() {
  console.log('Starting privileged workflow smoke test...');

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
    console.error('Failed to insert account:', accountError.message);
    process.exit(1);
  }
  console.log(`Successfully inserted account. ID: ${account.id}`);

  console.log('\n--- 2. Testing Storage Upload (drayage-vault) ---');
  const dummyFilePath = path.join(process.cwd(), 'dummy_test.txt');
  fs.writeFileSync(dummyFilePath, 'This is a test document for the drayage vault.');
  const fileBuffer = fs.readFileSync(dummyFilePath);
  const storagePath = `${account.id}/Credit Application/dummy_test.txt`;

  const { data: storageData, error: storageError } = await supabase.storage
    .from('drayage-vault')
    .upload(storagePath, fileBuffer, { contentType: 'text/plain' });

  if (storageError) {
    console.error('Failed to upload document:', storageError.message);
    process.exit(1);
  }
  console.log(`Successfully uploaded document to storage path: ${storageData.path}`);

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
    console.error('Failed to insert document metadata:', docError.message);
    process.exit(1);
  }
  console.log(`Successfully inserted document metadata. ID: ${docRecord.id}`);
  console.log('\nPrivileged workflow smoke test passed.');
  fs.unlinkSync(dummyFilePath);
}

runTests().catch((error) => {
  console.error('Privileged workflow smoke test failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
