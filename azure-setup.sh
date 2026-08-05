#!/usr/bin/env bash
#
# File: azure-setup.sh
# Purpose: Provisions draft Azure resources for the DrayageOnboarding migration path.
# Dependencies: Azure CLI, PostgreSQL Flexible Server, Blob Storage, and Azure Web PubSub.
# Maintainer note: Requires caller-supplied secrets and network allow-list inputs; it does not print secrets.

set -euo pipefail

RESOURCE_GROUP="${RESOURCE_GROUP:-rg-drayage-onboarding}"
LOCATION="${LOCATION:-eastus}"
DB_SERVER_NAME="${DB_SERVER_NAME:-psql-drayage-server-$RANDOM}"
DB_NAME="${DB_NAME:-drayage_db}"
DB_ADMIN_USER="${DB_ADMIN_USER:-drayageadmin}"
STORAGE_ACCOUNT="${STORAGE_ACCOUNT:-stdrayagevault$RANDOM}"
STORAGE_CONTAINER="${STORAGE_CONTAINER:-drayage-vault}"
PUBSUB_NAME="${PUBSUB_NAME:-pubsub-drayage-sync-$RANDOM}"

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    printf 'Missing required environment variable: %s\n' "$name" >&2
    exit 1
  fi
}

validate_ipv4() {
  local name="$1"
  local value="${!name:-}"
  if [[ ! "$value" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
    printf 'Invalid IPv4 address in %s. Azure PostgreSQL public-access rules require start and end IPv4 addresses.\n' "$name" >&2
    exit 1
  fi
}

require_env DB_ADMIN_PASSWORD
require_env POSTGRES_ALLOWED_START_IP
require_env POSTGRES_ALLOWED_END_IP
validate_ipv4 POSTGRES_ALLOWED_START_IP
validate_ipv4 POSTGRES_ALLOWED_END_IP

printf 'Starting Azure infrastructure provisioning.\n'
printf 'Using resource group: %s\n' "$RESOURCE_GROUP"

printf 'Creating or updating resource group.\n'
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none

printf 'Provisioning Azure Database for PostgreSQL Flexible Server.\n'
printf 'PostgreSQL public access is restricted to the caller-supplied allow-list range; unrestricted 0.0.0.0 access is prohibited.\n'
az postgres flexible-server create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$DB_SERVER_NAME" \
  --location "$LOCATION" \
  --admin-user "$DB_ADMIN_USER" \
  --admin-password "$DB_ADMIN_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --public-access "$POSTGRES_ALLOWED_START_IP-$POSTGRES_ALLOWED_END_IP" \
  --database-name "$DB_NAME" \
  --output none

printf 'Provisioning Azure Storage Account.\n'
az storage account create \
  --name "$STORAGE_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku Standard_LRS \
  --allow-blob-public-access false \
  --output none

STORAGE_KEY="$(az storage account keys list -g "$RESOURCE_GROUP" -n "$STORAGE_ACCOUNT" --query '[0].value' -o tsv)"

printf 'Creating private Blob container.\n'
az storage container create \
  --name "$STORAGE_CONTAINER" \
  --account-name "$STORAGE_ACCOUNT" \
  --account-key "$STORAGE_KEY" \
  --public-access off \
  --output none >/dev/null

printf 'Provisioning Azure Web PubSub Service.\n'
az webpubsub create \
  --name "$PUBSUB_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku Free_F1 \
  --output none

printf 'Azure infrastructure provisioning complete.\n'
printf 'POSTGRES_SERVER: %s.postgres.database.azure.com\n' "$DB_SERVER_NAME"
printf 'POSTGRES_DB: %s\n' "$DB_NAME"
printf 'STORAGE_ACCOUNT: %s\n' "$STORAGE_ACCOUNT"
printf 'STORAGE_CONTAINER: %s\n' "$STORAGE_CONTAINER"
printf 'PUBSUB_NAME: %s\n' "$PUBSUB_NAME"
printf 'Next step: configure Data API Builder with secret-managed connection strings.\n'
