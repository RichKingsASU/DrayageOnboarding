# PostgreSQL 17 Blocked Work

This document tracks all tasks that cannot be completed until PostgreSQL 17 is installed.

| Task | Affected Feature | Expected Validation | Dependencies | Current Implementation Status |
|---|---|---|---|---|
| Database Creation | Core Infrastructure | Local database `ondray_db` exists | PostgreSQL 17 | BLOCKED — POSTGRESQL |
| Apply Migrations | All Models | `python manage.py migrate` succeeds | PostgreSQL 17 | BLOCKED — POSTGRESQL |
| Seed Reference Data | Initial App State | Reference data present in DB | PostgreSQL 17 | BLOCKED — POSTGRESQL |
| Replace Mock Services | Data Persistence | Services use Django ORM instead of mocks | PostgreSQL 17 | BLOCKED — POSTGRESQL |
| CRUD Regression Testing | All Workflows | Data persists across server restarts | PostgreSQL 17 | BLOCKED — POSTGRESQL |
