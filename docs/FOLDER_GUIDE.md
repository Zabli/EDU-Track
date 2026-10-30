# EduTrack — Project Folder Guide

This guide explains the architectural purpose of each directory and file in the EduTrack codebase, ensuring developers know exactly where to apply changes.

---

## Root Structure

```
EduTrack/
├── README.md                     # Overview, setup, run & deploy instructions
├── .env.example                  # Template for environment variables (safe placeholders only)
├── package.json                  # Node dependencies, scripts, and build pipelines
├── tsconfig.json                 # TypeScript compiler configuration
├── tailwind.config.ts            # Tailwind CSS design system tokens and dynamic branding rules
├── next.config.mjs               # Next.js & PWA runtime configuration
│
├── docs/                         # Project living documentation
│   ├── PROJECT_SPECIFICATION.md  # Core product specification (v2.0)
│   ├── USER_ROLES_AND_PERMISSIONS.md # Access control matrix & boundary rules
│   ├── DATABASE_STRUCTURE.md     # Tables, fields, foreign keys & RLS notes
│   ├── FOLDER_GUIDE.md           # This architecture guide
│   ├── TESTING_CHECKLIST.md      # Acceptance criteria & verification checklist
│   └── CHANGELOG.md              # Version history and evolution
│
├── database/                     # Database schemas, policies, and mock data
│   ├── migrations/               # Versioned PostgreSQL migration files (001 - 006)
│   ├── policies/                 # Row-Level Security (RLS) rules documentation
│   └── seed-data/                # Safe, fake demo records for local development
│
├── src/                          # Application source code
│   ├── app/                      # Next.js App Router pages and server actions
│   │   ├── (auth)/               # Login, register, forgot-password routes
│   │   ├── admin/                # Platform Admin dashboard & academy approvals
│   │   ├── owner/                # Academy Owner / Principal management views
│   │   ├── teacher/              # Teacher registers, mark entry, and removal requests
│   │   ├── student/              # Student portal (attendance, results, fee proof, leave)
│   │   ├── api/                  # API endpoints (health, bootstrap, webhooks)
│   │   ├── layout.tsx            # Global layout with theme and offline provider
│   │   └── page.tsx              # Public home & entry portal
│   │
│   ├── components/               # Reusable UI components
│   │   ├── ui/                   # Atoms: Buttons, inputs, modals, cards, badges
│   │   ├── branding/             # Academy dynamic branding & color provider
│   │   ├── attendance/           # Attendance registers and audit change modals
│   │   ├── fees/                 # Fee cards, payment proof submission dialogs
│   │   ├── layout/               # Navbars, sidebars, role-based header menus
│   │   └── pwa/                  # Offline indicator, service worker registration
│   │
│   ├── lib/                      # Business logic, helpers, and utilities
│   │   ├── supabase/             # Supabase client (browser, server, service-role)
│   │   ├── auth/                 # Role resolution and session helpers
│   │   ├── formatters/           # PKR currency, Karachi date/time helpers
│   │   └── utils/                # Academy code generator, validation utilities
│   │
│   └── styles/                   # Global CSS styles and Tailwind directives
│
├── public/                       # Static public assets
│   ├── icons/                    # PWA icons (192x192, 512x512, apple-touch-icon)
│   ├── manifest.json             # Web App Manifest for PWA installation
│   └── sw.js                     # PWA Service Worker for app shell caching
│
├── tests/                        # Automated unit, integration, and security tests
│   ├── unit/                     # Business logic and formatting tests
│   ├── permissions/              # Role boundary & cross-tenant security tests
│   └── workflows/                # Student removal, fee proof, and leave request tests
│
└── scripts/                      # Safe developer & operational scripts
    ├── bootstrap_admin.mjs       # Interactive CLI to bootstrap Platform Super Admin
    └── verify_schema.mjs         # Schema consistency and table health checks
```

---

## Where to Make Common Changes

| Task | Primary Locations |
|---|---|
| **Change Academy Branding / Colors** | `src/components/branding/`, `src/lib/branding.ts`, `tailwind.config.ts` |
| **Add / Edit Database Columns** | `database/migrations/`, `docs/DATABASE_STRUCTURE.md` |
| **Modify Role Access / RLS** | `database/migrations/`, `src/lib/auth/`, `docs/USER_ROLES_AND_PERMISSIONS.md` |
| **Update Attendance Logic** | `src/components/attendance/`, `src/app/teacher/attendance/` |
| **Update Fee / Payment Proofs** | `src/components/fees/`, `src/app/student/fees/`, `src/app/owner/fees/` |
| **Configure PWA Caching & Manifest** | `public/manifest.json`, `public/sw.js`, `next.config.mjs` |
| **Add New Automated Test Cases** | `tests/unit/`, `tests/permissions/`, `docs/TESTING_CHECKLIST.md` |
