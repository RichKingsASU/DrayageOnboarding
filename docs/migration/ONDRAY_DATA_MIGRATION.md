# OnDray Data Migration

## Overview
This document outlines the data migration from the legacy Supabase source to the Django target foundation.

## Export Format
A versioned JSON export of the legacy schema serves as the migration fixture. Current version is `ondray-supabase-export-v1`. No real production sensitive data is checked into source control; the `mockData.ts` seed data is used for validation.

## Running the Migration
The `migrate_legacy_ondray` command parses the JSON input and deterministically maps it to the Django models.

```bash
# Dry run without making persistent writes
python manage.py migrate_legacy_ondray --source ondray/fixtures/legacy_export_v1.json --dry-run

# Execute migration
python manage.py migrate_legacy_ondray --source ondray/fixtures/legacy_export_v1.json
```

## Idempotency
The migration command relies on the `legacy_record_id` field to prevent duplicate inserts on successive runs. Unresolved dependencies are rejected cleanly.
