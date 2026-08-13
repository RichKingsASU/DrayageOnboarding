# Forrest OS Handoff

Target architecture:
- Frontend: React + Webpack + Babel + Bootstrap 5.3.x
- Backend: Django 5.x + PostgreSQL + FileSystemStorage (Dev)
- Authentication: Django Session Auth, RBAC
- Enterprise Integration: SQL Server Read-Only

Implemented domains: Account, Contact, Lane, AccessorialSOP, ChecklistState, CustomerAlert, OnboardingDocument.

Dev Box validation passed. Legacy technologies (Supabase, Vite, Next, Netlify, Vercel, Tailwind) removed.

Deferred production items:
- Entra production configuration
- Production PostgreSQL provisioning
- Production storage selection
- Supabase data/file migration
- Live SQL Server connectivity approval
