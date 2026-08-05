# Azure Migration Plan

This plan details the strategy for migrating the Drayage Customer Onboarding CRM from its current Supabase backend to a fully native **Microsoft Azure** architecture. 

## Goal Description
Migrate the existing PostgreSQL database, real-time WebSocket subscriptions, file storage, and serverless API integration from Supabase to Azure-native equivalents while maintaining the same frontend UI experience and data security.

## Azure Architecture Mapping

| Supabase Feature | Azure Equivalent | Description |
| :--- | :--- | :--- |
| **PostgreSQL Database** | Azure Database for PostgreSQL (Flexible Server) | Fully managed Postgres instances with high availability and automated backups. |
| **Supabase Storage** | Azure Blob Storage | Secure object storage for the document vault (`drayage-vault`), handling large PDFs. |
| **PostgREST API** | Data API builder for Azure Databases (DAB) | Provides instant REST and GraphQL endpoints for the Azure Postgres database without writing custom backend routing, mimicking Supabase's direct-client database access. |
| **Realtime WebSockets** | Azure Web PubSub / Azure SignalR Service | Managed WebSockets to broadcast database changes (like Kanban drag-and-drops) instantly to all connected clients. |
| **Row Level Security (RLS)** | Database-level RLS + Microsoft Entra ID (B2C) | Authenticate users via Azure AD B2C, pass the identity tokens to DAB, and enforce standard Postgres RLS policies based on the session token. |
| **Frontend Hosting** | Azure Static Web Apps | Global CDN hosting for the Vite/React frontend, with integrated routing for the backend API. |

## Proposed Changes

---

### 1. Database & Infrastructure Provisioning
- Provision an **Azure Database for PostgreSQL (Flexible Server)** instance.
- Run the existing `20260804000000_initial_schema.sql` migration script directly on the Azure Postgres database to recreate the `accounts`, `contacts`, `accessorial_sops`, and `documents` tables and enums.
- Provision an **Azure Storage Account** with a private Blob container named `drayage-vault`.

### 2. API Layer & Real-Time Sync
- Deploy the **Data API builder (DAB) for Azure Databases**. Configure the `dab-config.json` to expose the Postgres tables to the frontend via REST endpoints.
- Configure **Azure Web PubSub** to listen for Postgres trigger events (e.g., when a pipeline stage changes) and broadcast the updates to the React frontend to preserve the "multiplayer" live-sync experience.

### 3. Frontend Re-wiring (`src/App.tsx`, `src/hooks/useAccounts.ts`)
#### [MODIFY] `src/hooks/useAccounts.ts`
- Replace `@supabase/supabase-js` database fetches with standard `fetch()` calls pointing to the new Azure Data API builder endpoints.
- Replace the Supabase `channel('accounts_realtime')` listener with the Azure Web PubSub WebSocket client.

#### [MODIFY] `src/lib/supabaseClient.ts` -> `src/lib/azureClient.ts`
- Rename and replace the client SDK implementation.
- Implement the `uploadDocumentToAzure` function using the `@azure/storage-blob` npm package. 
- Obtain temporary Shared Access Signature (SAS) tokens to allow secure, direct-from-browser uploads into Azure Blob Storage.

## User Review Required

> [!WARNING]
> **Authentication Pivot:** Supabase currently uses its built-in GoTrue Auth system for Row-Level Security (RLS). To replicate this securely in Azure, we will need to implement Microsoft Entra ID (formerly Azure AD) or Azure AD B2C. 

> [!IMPORTANT]
> **API Layer:** Supabase provides an API out-of-the-box. Azure requires running the Data API Builder (DAB) as an app service container, or writing a custom Node.js/C# backend function to handle database queries. I strongly recommend Data API Builder as it requires zero custom backend code and operates exactly like Supabase.

## Open Questions

1. Do you want to use **Microsoft Entra ID (Azure AD)** for user logins, or a different identity provider?
2. Shall I use the **Data API builder** to keep the backend serverless, or would you prefer a custom Express/Node API hosted on Azure App Service?
3. Would you like to provision these Azure resources via Azure CLI scripts, or Terraform?

## Provisioning security note (2026-08-05)

The draft Azure provisioning script requires an externally supplied database administrator password and an explicit PostgreSQL firewall allow-list range. Do not use unrestricted public access. Treat private endpoint/VNet integration as the recommended production target once subscription, VNet, DNS, and CI runner egress decisions are finalized.
