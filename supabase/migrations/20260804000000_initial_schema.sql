-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Enum Types for Strict Stage & Role Typing
CREATE TYPE pipeline_stage AS ENUM (
  'CustomerInquiry',
  'Agreement',
  'AccountSetup',
  'OperationalKickoff',
  'OngoingSupport'
);

CREATE TYPE appointment_type_enum AS ENUM (
  'Strict Appointment',
  'Open Window',
  'First Come First Served'
);

CREATE TYPE doc_type_enum AS ENUM (
  'Credit Application',
  'Liability Agreement',
  'SOP Document',
  'Other'
);

CREATE TYPE doc_status_enum AS ENUM (
  'Compliant',
  'Pending Audit',
  'Action Needed'
);

CREATE TYPE alert_severity_enum AS ENUM ('low', 'medium', 'high');

-- ============================================================================
-- 1. ACCOUNTS TABLE
-- ============================================================================
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL DEFAULT auth.uid(), -- Multi-tenant boundary
  legal_name TEXT NOT NULL,
  dba_name TEXT,
  mc_number TEXT,
  dot_number TEXT,
  billing_address TEXT,
  credit_terms TEXT DEFAULT 'NET 30',
  credit_limit NUMERIC(12, 2) DEFAULT 0.00,
  accept_sequence_bills BOOLEAN DEFAULT false,
  invoice_docs_required TEXT[] DEFAULT '{}',
  commodity TEXT,
  equipment_type TEXT DEFAULT 'Standard',
  load_type TEXT DEFAULT 'General',
  expected_weight TEXT,
  hazmat_class TEXT DEFAULT 'N/A',
  is_bonded BOOLEAN DEFAULT false,
  cargo_value NUMERIC(12, 2) DEFAULT 0.00,
  pref_comm_method TEXT DEFAULT 'Email',
  needs_api_edi BOOLEAN DEFAULT false,
  stage pipeline_stage NOT NULL DEFAULT 'CustomerInquiry',
  days_in_stage NUMERIC(5, 1) DEFAULT 0.0,
  bill_to_code_created BOOLEAN DEFAULT false,
  audit_checklist_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for stage queries & performance
CREATE INDEX idx_accounts_stage ON public.accounts(stage);
CREATE INDEX idx_accounts_org ON public.accounts(organization_id);

-- ============================================================================
-- 2. ACCESSORIAL SOPS TABLE (1-to-1 WITH ACCOUNTS)
-- ============================================================================
CREATE TABLE public.accessorial_sops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID UNIQUE NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  chassis_fee NUMERIC(8, 2) DEFAULT 45.00,
  pre_pull_fee NUMERIC(8, 2) DEFAULT 125.00,
  storage_fee NUMERIC(8, 2) DEFAULT 150.00,
  empty_storage_fee NUMERIC(8, 2) DEFAULT 50.00,
  chassis_split_fee NUMERIC(8, 2) DEFAULT 85.00,
  clean_truck_fee NUMERIC(8, 2) DEFAULT 25.00,
  detention_rate NUMERIC(8, 2) DEFAULT 95.00,
  detention_free_time NUMERIC(4, 1) DEFAULT 2.0,
  appointment_type appointment_type_enum DEFAULT 'Strict Appointment',
  free_time_days INTEGER DEFAULT 2,
  has_yard_hostler BOOLEAN DEFAULT false,
  peel_piles_permitted BOOLEAN DEFAULT false,
  private_chassis_permitted BOOLEAN DEFAULT false,
  required_status_updates TEXT[] DEFAULT '{"LFD", "Container Outgate", "POD Sent", "Empty Return"}',
  delivery_rules TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. CONTACTS TABLE (1-to-Many WITH ACCOUNTS)
-- ============================================================================
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_account_id ON public.contacts(account_id);

-- ============================================================================
-- 4. DOCUMENTS TABLE (1-to-Many METADATA LINKED TO SUPABASE STORAGE)
-- ============================================================================
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type doc_type_enum NOT NULL DEFAULT 'Other',
  status doc_status_enum NOT NULL DEFAULT 'Pending Audit',
  size_bytes BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL, -- Direct path inside Supabase Storage bucket
  uploaded_by TEXT DEFAULT 'System',
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_account_id ON public.documents(account_id);

-- ============================================================================
-- 5. RED FLAG SOP ALERTS TABLE
-- ============================================================================
CREATE TABLE public.customer_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  severity alert_severity_enum NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_account_id ON public.customer_alerts(account_id);


-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on all tables
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessorial_sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_alerts ENABLE ROW LEVEL SECURITY;

-- Read: Authenticated team members can read account records
CREATE POLICY "Allow authenticated team members to read accounts" 
ON public.accounts FOR SELECT 
TO authenticated 
USING (auth.uid() IS NOT NULL);

-- Insert: Authenticated users can create accounts
CREATE POLICY "Allow authenticated team members to insert accounts" 
ON public.accounts FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

-- Update: Authenticated users can update accounts
CREATE POLICY "Allow authenticated team members to update accounts" 
ON public.accounts FOR UPDATE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

-- Delete: Only administrators can delete accounts
CREATE POLICY "Allow admins to delete accounts" 
ON public.accounts FOR DELETE 
TO authenticated 
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- CASCADE SECURITY VIA PARENT ACCOUNT
CREATE POLICY "Manage accessorial_sops via account access" 
ON public.accessorial_sops FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.accounts WHERE id = accessorial_sops.account_id));

CREATE POLICY "Manage contacts via account access" 
ON public.contacts FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.accounts WHERE id = contacts.account_id));

CREATE POLICY "Manage documents via account access" 
ON public.documents FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.accounts WHERE id = documents.account_id));

CREATE POLICY "Manage alerts via account access" 
ON public.customer_alerts FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.accounts WHERE id = customer_alerts.account_id));

-- ============================================================================
-- 7. STORAGE BUCKET (drayage-vault)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('drayage-vault', 'drayage-vault', false) 
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow authenticated read on drayage-vault" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'drayage-vault');

CREATE POLICY "Allow authenticated upload on drayage-vault" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'drayage-vault');

CREATE POLICY "Allow authenticated delete on drayage-vault" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'drayage-vault');
