# EduTrack 🎓

> **Multi-Academy Education & Coaching Centre Management Platform (Web + PWA)**  
> Built for Pakistan academies with Next.js, React, TypeScript, Tailwind CSS, and Supabase PostgreSQL.

---

## 🚀 Overview

EduTrack is a multi-tenant web application and Progressive Web App (PWA) designed to manage educational coaching institutes, tuition centres, and academies across Pakistan. It combines white-label dynamic theming with strict multi-tenant Row Level Security (RLS).

### Core Capabilities
- **Platform Admin Governance**: System-wide approval, suspension, and auditing of registered academies.
- **Academy Owner Operations**: Complete academic operations (classes, sections, fee plans, teacher management, attendance registers, marks, branding).
- **Teacher Tools**: Daily attendance marking, test evaluation, and student removal requests for assigned classes only.
- **Student Portal**: Attendance history, test ranks & percentages, fee ledger, JazzCash / Easypaisa external payment proof uploads, and leave requests.
- **PWA Ready**: Installable app experience across Android, iOS, and Desktop with offline app-shell caching.

---

## 🏗️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14+ (App Router) + React 18+ |
| **Language** | TypeScript (Strict Mode) |
| **Styling & UI** | Tailwind CSS + Lucide Icons |
| **Backend & DB** | Supabase (PostgreSQL 15, PostgREST, Supabase Auth) |
| **Security** | Database Row-Level Security (RLS) + Server Action checks |
| **PWA** | Web App Manifest + Service Worker (`sw.js`) |
| **Testing** | Automated Unit & Permission Tests (Node Test Runner / Vitest) |
| **Localization** | `Asia/Karachi` time zone + PKR (`₨`) currency formatting |

---

## 📁 Repository Structure

```
EduTrack/
├── docs/                     # Living product specifications & architecture rules
├── database/                 # PostgreSQL migrations, security policies, and seed data
│   ├── migrations/           # 001 through 006 SQL migration files
│   └── seed-data/            # Safe demo seed records
├── src/
│   ├── app/                  # Next.js App Router (role-based pages & server actions)
│   ├── components/           # Reusable UI widgets, branding, and modals
│   ├── lib/                  # Supabase clients, auth helpers, formatting utilities
│   └── styles/               # Global CSS & Tailwind configuration
├── public/                   # Manifest, icons, and service worker
├── tests/                    # Permission boundary & business logic test suites
└── scripts/                  # Administrator bootstrap and schema verification scripts
```

For complete details, see [`docs/FOLDER_GUIDE.md`](file:///E:/EDU-Track/docs/FOLDER_GUIDE.md).

---

## ⚡ Quickstart & Local Setup

### 1. Prerequisites
- Node.js LTS (v20.x or higher)
- Access to Supabase project

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the template and set your credentials:
```bash
cp .env.example .env.local
```

### 4. Database Setup
Execute the SQL migrations located in `database/migrations/` sequentially in your Supabase SQL Editor:
1. `001_initial_schema.sql` — Initial schema and relational structure
2. `002_rls_policies.sql` — Row Level Security foundational policies
3. `003_multi_academy_upgrade.sql` — Multi-academy isolation upgrade
4. `004_fix_rls_recursion.sql` — RLS recursion protection
5. `005_owner_teacher_password_management.sql` — Secure credential resets
6. `006_edutrack_v2_features.sql` — Requests, removals, leaves, and workload
7. `007_teacher_invitations.sql` — Single-use teacher invitation tokens
8. `008_attendance_audit_and_status.sql` — Attendance statuses & immutable audit trail
9. `009_tests_and_marks.sql` — Tests, grading windows & publication lifecycle
10. `010_fees_and_payment_proofs.sql` — Invoices, proof verification & ledger
11. `011_teacher_workload_and_reports.sql` — Teacher attendance, confidential payroll & reports

### 5. Run Automated Tests
```bash
npm test
```
*(Runs all 16 test suites covering 105 automated test assertions)*

### 6. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Platform Administrator Bootstrap

To securely provision the permanent Platform Super Admin account without exposing credentials:
```bash
node scripts/bootstrap_admin.mjs
```
*(Requires `PLATFORM_ADMIN_BOOTSTRAP_SECRET` set in `.env.local`)*

---

## 📖 Key Specifications & Guides
- **Product Specification**: [`docs/PROJECT_SPECIFICATION.md`](file:///E:/EDU-Track/docs/PROJECT_SPECIFICATION.md)
- **Roles & Permissions Matrix**: [`docs/USER_ROLES_AND_PERMISSIONS.md`](file:///E:/EDU-Track/docs/USER_ROLES_AND_PERMISSIONS.md)
- **Database Schema**: [`docs/DATABASE_STRUCTURE.md`](file:///E:/EDU-Track/docs/DATABASE_STRUCTURE.md)
- **Acceptance Checklist**: [`docs/TESTING_CHECKLIST.md`](file:///E:/EDU-Track/docs/TESTING_CHECKLIST.md)
