#!/bin/bash
# azure-setup.sh
# Provisioning script for DrayageOnboarding Azure Migration

RESOURCE_GROUP="rg-drayage-onboarding"
LOCATION="eastus"
DB_SERVER_NAME="psql-drayage-server-$RANDOM"
DB_NAME="drayage_db"
DB_ADMIN_USER="drayageadmin"
DB_ADMIN_PASSWORD="SuperSecurePassword123!" # Change before running in prod
STORAGE_ACCOUNT="stdrayagevault$RANDOM"
STORAGE_CONTAINER="drayage-vault"
PUBSUB_NAME="pubsub-drayage-sync-$RANDOM"

echo "🚀 Starting Azure Infrastructure Provisioning..."

# 1. Create Resource Group
echo "📦 Creating Resource Group: $RESOURCE_GROUP"
az group create --name $RESOURCE_GROUP --location $LOCATION

# 2. Provision Azure Database for PostgreSQL (Flexible Server)
echo "🗄️ Provisioning Azure Database for PostgreSQL..."
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --location $LOCATION \
  --admin-user $DB_ADMIN_USER \
  --admin-password $DB_ADMIN_PASSWORD \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --public-access 0.0.0.0 \
  --database-name $DB_NAME

# 3. Provision Azure Storage Account for the Document Vault
echo "📂 Provisioning Azure Storage Account..."
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --allow-blob-public-access false

# Get Storage Account Key
STORAGE_KEY=$(az storage account keys list -g $RESOURCE_GROUP -n $STORAGE_ACCOUNT --query "[0].value" -o tsv)

# Create Blob Container
echo "🔒 Creating Private Blob Container: $STORAGE_CONTAINER"
az storage container create \
  --name $STORAGE_CONTAINER \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY \
  --public-access off

# 4. Provision Azure Web PubSub for Real-Time Synchronization
echo "⚡ Provisioning Azure Web PubSub Service..."
az webpubsub create \
  --name $PUBSUB_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Free_F1

# Get PubSub Connection String
PUBSUB_CONN_STRING=$(az webpubsub key show --name $PUBSUB_NAME --resource-group $RESOURCE_GROUP --query primaryConnectionString -o tsv)

echo "✅ Azure Infrastructure Provisioning Complete!"
echo "------------------------------------------------------"
echo "POSTGRES_SERVER: $DB_SERVER_NAME.postgres.database.azure.com"
echo "POSTGRES_DB: $DB_NAME"
echo "STORAGE_ACCOUNT: $STORAGE_ACCOUNT"
echo "PUBSUB_NAME: $PUBSUB_NAME"
echo "------------------------------------------------------"
echo "Next Steps: Run 'dab start' to boot the Data API builder locally connecting to this Postgres instance."
