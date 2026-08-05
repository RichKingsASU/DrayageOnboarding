# Azure Migration DevOps Handoff

This document outlines the resources and architectural strategy for migrating the Drayage Customer Onboarding CRM from Supabase to a native Microsoft Azure stack.

## Architecture Blueprint

The frontend is a React/Vite application currently relying on Supabase for database APIs, authentication, and WebSocket real-time syncing. To migrate to Azure without writing a custom backend, the target architecture is:
- **Database**: Azure Database for PostgreSQL (Flexible Server)
- **Object Storage**: Azure Blob Storage (replaces `drayage-vault` Supabase storage)
- **API Layer**: Data API builder (DAB) for Azure (provides out-of-the-box REST/GraphQL endpoints for Postgres)
- **Real-Time Sync**: Azure Web PubSub (replaces Supabase Postgres WebSockets)

## Included Artifacts

The following scripts have been generated in the project root to accelerate the transition:

### 1. `azure-setup.sh`
An Azure CLI bash script that automates the provisioning of:
- The resource group.
- The PostgreSQL Flexible Server instance.
- The Storage Account and private `drayage-vault` container.
- The Azure Web PubSub instance.

**Action**: Run this script to spin up the cloud infrastructure.

### 2. `dab-config.json`
The configuration file for Microsoft's **Data API builder**. It maps the Postgres tables (`accounts`, `contacts`, `accessorial_sops`, `documents`) to REST endpoints (`/api/Account`, etc.) with basic Role-Based Access Control configured.

**Action**: Deploy a DAB container in Azure App Service or use Azure Static Web Apps' built-in Database Connections feature with this config.

### 3. `20260804000000_initial_schema.sql` (in `/supabase/migrations/`)
The raw Postgres schema definitions, custom enum types (`pipeline_stage`, `equipment_type`, etc.), and table structures.

**Action**: Execute this script directly against the new Azure PostgreSQL database to recreate the exact schema used by the application.

## Frontend Refactoring Requirements

Once the Azure infrastructure is provisioned, the React codebase will need the following updates to detach from Supabase:

1. **`src/hooks/useAccounts.ts`**:
   - Swap the `supabase.from('accounts').select(...)` call to a standard `fetch('/api/Account')` hitting the DAB endpoint.
   - Replace the `supabase.channel('accounts_realtime')` listener with the Azure Web PubSub WebSocket client to maintain real-time Kanban board syncing.

2. **`src/App.tsx` (Mutations)**:
   - Update `handleUpdateAccountStage` to issue a `PATCH` request to the DAB endpoint instead of `supabase.from('accounts').update(...)`.

3. **`src/components/SecureDocumentUploader.tsx`**:
   - Replace the `uploadDocumentToSupabase` import with an Azure-equivalent function.
   - You will need to implement a mechanism to fetch short-lived **Shared Access Signature (SAS) tokens** from the backend to allow the frontend to upload PDFs directly to Azure Blob Storage securely.

## Security remediation update (2026-08-05)

`azure-setup.sh` no longer contains a sample database password and no longer opens PostgreSQL Flexible Server to `0.0.0.0`. Automation must provide `DB_ADMIN_PASSWORD`, `POSTGRES_ALLOWED_START_IP`, and `POSTGRES_ALLOWED_END_IP` from approved secret/configuration sources before running the script. The public IP range is a migration-safe interim control; production should use private endpoint/VNet integration after DevOps confirms the Azure network architecture.
