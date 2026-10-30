# EduTrack — Changelog

All notable changes to the EduTrack architecture and codebase are documented here.

---

## [Version 2.0.0-web-pwa] - 2026-10-29

### Phase 12: Progressive Web App (PWA) & Final System Verification
- **Web App Manifest & Full Icon Suite (`public/manifest.json`, `public/icons/`)**: Completed PWA specification including high-resolution 192x192, 512x512 maskable PNGs, and scalable SVG vector icons. Configured standalone display mode, orientation, brand theme colors (`#1565C0`), and metadata.
- **Service Worker & App Shell Caching (`public/sw.js`)**: Network-first strategy with cache fallback for navigation and static assets. Pre-caches core application shell (`/`, `/manifest.json`, `/favicon.ico`, and icon suite). Strictly bypasses and protects remote database mutations and Supabase auth calls.
- **Non-Intrusive Installation Workflow (`PWAInstallPrompt.tsx`)**: Global install prompt capturing the browser's `beforeinstallprompt` event with single-click installation on mobile (Android/iOS) and desktop (Chrome/Edge), with persistent dismissal caching.
- **Network Connectivity & Safe Offline Degradation (`OfflineIndicator.tsx`)**: Real-time connection status listener displaying clear warnings upon connectivity drop and sync banners upon reconnection. Enforces safe offline degradation where sensitive transactions require active server validation.
- **Automated PWA & Reliability Test Suite (`tests/workflows/pwaAndReliability.test.mjs`)**: Verified manifest structure, icon disk existence, service worker mutation isolation, safe offline degradation invariants, and input resilience across boundary conditions (105 passing tests across 16 test suites).
- **Full End-to-End Regression Verification**: 100% test pass rate (105/105 tests passing) and all 37 Next.js production routes compiling cleanly.

### Phase 11: Teacher Workload, Confidential Compensation & Operational Reports
- **Teacher Attendance & Scheduled vs. Completed Lectures (`src/lib/teachers/actions.ts`, `/owner/teachers/attendance`)**: Principals can log daily teacher attendance statuses (`present`, `absent`, `late`, `leave`), monitor scheduled vs. delivered lecture counts, and record workload notes via `TeacherWorkloadManager.tsx`.
- **Faculty Personal Workload Portal (`/teacher/workload`)**: Dedicated view via `TeacherPersonalWorkloadView.tsx` allowing faculty to inspect personal monthly attendance logs, lecture completion percentages, and days present/late/absent. Strictly self-scoped to prevent snooping on other faculty.
- **Confidential Faculty Compensation Ledger (`/owner/teachers/payments`)**: Principal management portal via `TeacherPaymentManager.tsx` to disburse and record faculty salaries, stipends, and lecture remuneration with disbursement dates, billing months (`YYYY-MM`), methods (Cash, Bank Transfer, JazzCash, Easypaisa, Cheque), and references.
- **Strict Confidentiality Invariant**: Enforced via `assertTeacherPaymentAccess` at server action and database RLS levels (`011_teacher_workload_and_reports.sql`). Teachers and students attempting to view compensation ledgers are blocked (`TEACHER_PAYMENTS_CONFIDENTIAL`).
- **Comprehensive Academy Analytics & Reports (`/owner/reports`)**: Principal analytics hub via `AcademyReportsView.tsx` providing real-time multi-tenant rollups: overall student attendance %, academic average test score %, Pakistani grade distributions (`A*` through `F`), tuition financial reconciliation (invoiced vs collected vs outstanding), and batch-level operational rosters.
- **Automated Workflow Test Suite (`tests/workflows/teacherWorkloadAndReports.test.mjs`)**: Verified teacher attendance validation, positive lecture counts, payment rules, owner-only payment isolation, cross-academy blocking, teacher payment confidentiality, personal workload metrics, and report mathematical calculations (99 passing tests across 15 test suites).

### Phase 10: Student Removal Workflows & Auditing
- **Teacher Removal Application Engine (`src/lib/students/removalActions.ts`, `/teacher/students`)**: Teachers can submit formal student removal applications with required justification for disciplinary, non-attendance, or academic grounds via `TeacherRemovalManager.tsx`.
- **Pending Removal Access Protection Invariant**: A pending removal application strictly does NOT revoke student dashboard access. The student retains normal portal privileges until the Principal renders an explicit determination.
- **Principal Removal Queue & Determination (`/owner/students/removal-requests`)**: Dedicated Principal management dashboard via `RemovalApprovalQueue.tsx` to audit requests, filter by pending or all records, and approve or reject applications with Principal audit decision notes.
- **Access Revocation & Historical Record Retention Invariant**: Approved removals mark student enrollment as `inactive`, instantly revoking access while permanently retaining all historical attendance, test marks, and fee payment ledgers. Zero cascade deletions.
- **Profile Reuse & Reactivation Workflow**: Principal can reactivate previously removed students with a single click, instantly transitioning the account back to `active` and reusing the existing student profile without creating duplicate database rows or student IDs.
- **Automated Workflow Test Suite (`tests/workflows/removalRules.test.mjs`)**: Verified pending removal login maintenance, principal approval access revocation, principal rejection access preservation, profile reactivation without duplicates, and historical data retention invariants (89 passing tests across 14 test suites).

### Phase 9: Fees and Payment Proof
- **Tuition Fee Invoicing & Ledger (`src/lib/fees/actions.ts`, `/owner/fees`)**: Principals can generate batch-wide and student-specific monthly tuition fee invoices with billing months (`YYYY-MM`), due dates, custom fee plan rates, and overdue balance tracking via `FeeManager.tsx`.
- **Student Payment Proof Submission (`/student/fees`)**: Dedicated student portal via `StudentFeePortal.tsx` to inspect invoices, current arrears, and submit external payment proofs (JazzCash, Easypaisa, Bank Transfer, Cash) with transaction TID references and screenshot proof URLs.
- **Critical Status Workflow Invariant**: Submitting payment proof sets invoice status strictly to `pending_verification`. It is NEVER automatically marked as `paid`. Cross-student submissions are prevented (`CROSS_STUDENT_ACCESS_DENIED`).
- **Principal Verification Queue (`/owner/fees`)**: Principal audit workflow to verify submitted transactions against academy financial accounts. Verification confirms payment, updates student ledger balance, and marks invoice as `paid` or `partial`. Rejection reverts invoice to `unpaid` or `overdue` with principal notes.
- **Database Schema Migration (`010_fees_and_payment_proofs.sql`)**: Extended `fee_invoices` status constraint to include `'pending_verification'`, added screenshot proof and verification columns to `payments`, and established student and owner Row Level Security policies.
- **Automated Workflow Test Suite (`tests/workflows/feesAndPayments.test.mjs`)**: Verified invoice generation with fee plans, duplicate prevention, pending verification state enforcement, cross-student blocking, and principal settlement/rejection outcomes (87 passing tests across 14 test suites).

### Phase 8: Tests and Marks
- **Test Creation & Scheduling (`src/lib/tests/actions.ts`, `/teacher/tests`, `/owner/tests`)**: Teachers and Principals can create class tests with title, subject, test date, maximum marks (> 0 validation), and publication status (`draft` | `published`) via `TestManager.tsx`.
- **Marks Entry Register (`/teacher/tests/[id]`, `/owner/tests/[id]`)**: Interactive grading sheet via `TestMarkingRegister.tsx`. Enforces strict validation that marks obtained cannot be negative or exceed maximum marks. Live computation of student percentages, grades (`A*`, `A`, `B`, `C`, `D`, `F`), class averages, and highest scores.
- **Publication Lifecycle & Draft Privacy**: Results for tests in `draft` status remain strictly inaccessible to students (`DRAFT_TEST_HIDDEN`). One-click toggling publishes results immediately to enrolled students.
- **Student Results Portal (`/student/results`)**: Dedicated portal for students to inspect their evaluated tests, overall grade, average percentage, highest mark, and teacher feedback notes via `StudentResultsView.tsx`. Cross-student queries are prevented (`CROSS_STUDENT_ACCESS_DENIED`).
- **Database Schema Migration (`009_tests_and_marks.sql`)**: Added `status` column with check constraint (`'draft'`, `'published'`) on `tests` table, along with student-scoped Row Level Security policies on `tests` and `test_results`.
- **Automated Workflow Test Suite (`tests/workflows/testsAndMarks.test.mjs`)**: Verified test creation rules, positive max marks enforcement, teacher class scoping, score validation boundaries, grade calculations, draft hiding, and student isolation (80 passing tests across 13 test suites).

### Phase 7: Attendance and Leave Workflows
- **Daily Attendance Register (`src/lib/attendance/actions.ts`, `/teacher/attendance`)**: Teachers can record daily attendance for assigned classes with statuses (`present`, `absent`, `late`, `leave`, `excused`), fast bulk marking actions, and real-time attendance rollups via `AttendanceRegister.tsx`.
- **Attendance Correction Audit Trail**: Every status adjustment automatically logs an immutable entry to `attendance_audit_logs` capturing `attendance_id`, `student_id`, `batch_id`, `previous_status`, `new_status`, `changed_by` (actor ID), reason, and timestamp.
- **Teacher Class Access Scoping**: Strict enforcement prevents teachers from accessing or altering registers for unassigned batches (`UNASSIGNED_BATCH_ACCESS_DENIED`), while Academy Owners retain supervisory access.
- **Student Leave Requests (`/student/leave`)**: Students can apply for leave specifying date range, justification, and optional proof/medical slip URL. Cross-student submissions are strictly blocked (`CROSS_STUDENT_ACCESS_DENIED`).
- **Principal Leave Queue & Attendance Sync (`/owner/leave`)**: Principals review pending leave requests with approval or rejection notes. Approved leaves automatically synchronize student attendance registers across all enrolled batches to `leave` status, preserving audit histories.
- **Student Attendance History Portal (`/student/attendance`)**: Students can inspect personal attendance summaries (total sessions, present, absent, late, leave, percentage) and filter history by status.
- **Database Schema Migration (`008_attendance_audit_and_status.sql`)**: Extended attendance status check constraint, added RLS policy for students to inspect their own attendance, and established `attendance_audit_logs` table with role-scoped RLS policies.
- **Automated Workflow Test Suite (`tests/workflows/attendanceAndLeave.test.mjs`)**: Verified batch scoping, valid status validation, correction audit logging, date boundary checks, student self-scoping, and principal leave approval sync (72 passing tests across 12 test suites).

### Phase 6: Core Academy Setup (Classes, Students, Branding)
- **Batch & Class Administration (`src/lib/academy/coreActions.ts`, `/owner/classes`)**: Principal and owners can create batches/classes, assign subjects, schedules, and monitor student counts per class via `BatchManager.tsx`.
- **Direct Student Enrollment & Roster (`/owner/students`)**: Principal can enroll students directly with full name, Pakistani CNIC (13-digit format validation), roll number, parent phone, batch selection, and active/inactive status toggling via `StudentRosterManager.tsx`.
- **Academy Branding & Fee Visibility Controls (`/owner/branding`)**: Principal can configure academy contact details, address, logo, custom receipt footer note, and toggle teacher fee visibility policy (`teacher_fee_visibility_enabled`) via `BrandingEditor.tsx`.
- **Owner Dashboard Hub (`/owner`)**: Enhanced with quick navigation cards for Classes, Student Roster, Branding Settings, Faculty Invites, and Pending Student Claims.
- **Automated Workflow Test Suite (`tests/workflows/coreAcademySetup.test.mjs`)**: Verified batch creation invariants, CNIC format validation, roll number uniqueness per academy, student active/inactive status toggling, branding persistence, and teacher fee visibility enforcement (62 passing tests across 11 test suites).

### Phase 5: Invitations and Account Linking
- **Teacher Invitation Engine (`src/lib/onboarding/actions.ts`)**: Academy Owners generate single-use, time-limited (7-day) invitation tokens tied strictly to intended faculty. Zero public teacher sign-ups.
- **Teacher Onboarding Portal (`/teacher/invite`)**: Secure landing page validating token, expiry, and pre-assigned subjects. Single-use invariant permanently expires used tokens.
- **Multi-Academy Membership Sharing**: Existing teachers accepting invitations to another academy are linked via `academy_memberships` without creating duplicate accounts or logins.
- **Pending Student Claims Queue (`/owner/students/pending`)**: Dedicated Principal dashboard to audit and approve or reject unverified student registrations, preventing CNIC impersonation.
- **Automated Tests (`teacherInvitationsAndLinking.test.mjs`)**: Verified single-use token invalidation, expiry rejection, multi-academy membership deduplication, and principal approval/rejection states (56 passing tests, 100% pass rate).

### Phase 4: Role and Data Isolation Enforcement
- **Backend Role-Based Access Control (RBAC) Module (`src/lib/auth/rbac.ts`)**: Built assertions ensuring zero privilege escalation (`assertPlatformAdmin`, `assertAcademyAccess`, `assertTeacherClassAccess`, `assertFeeAccess`, `assertTeacherPaymentAccess`, `assertStudentSelfAccess`).
- **Cross-Academy Isolation Hardening**: Server actions and database RLS enforce multi-tenant separation. Owners cannot read or mutate data from other academies regardless of parameter modifications.
- **Teacher Scope Isolation**: Teachers are restricted to assigned batches and prohibited from accessing private owner ledgers or colleague payment histories.
- **Dynamic Fee Visibility Gating**: Student fee data is blocked for teachers if the principal policy disables teacher fee visibility.
- **Student Record Isolation**: Students can access only their own academic ledgers and cannot modify official registers.
- **Penetration Test Suite (`tests/permissions/crossTenantPenetration.test.mjs`)**: Verified 8 penetration scenarios covering cross-tenant breaches, teacher snooping, student tampering, and suspended account blocking (49 passing tests, 100% pass rate).

### Phase 3: Academy Registration, Approval & Lifecycle Governance
- **Public Academy Registration Portal (`/register-academy`)**: Prospective academy owners submit institution name, contact, city, and campus details. Requests are set to `pending` without granting premature access.
- **Platform Admin Governance Console (`/admin/academies`)**: Interactive queue displaying pending applications, active institutions, and suspended academies.
- **One-Click Approval & Academy Code Assignment**: Platform admin approval generates collision-free 10-character code (`BTA-XXXXXX`), provisions academy entity, creates owner user in Supabase Auth, and links owner membership.
- **Rejection & Correction Flow**: Rejection records admin notes and updates application status.
- **Academy Suspension Management**: Suspends academy access without deleting historical records; reactivates when cleared.
- **Principal Account Onboarding (`/owner/setup`)**: Secure landing page for newly approved academy owners to initialize passwords and activate operations.
- **Automated Tests**: Added `academyApproval.test.mjs` verifying approval permissions, unique code format validation, rejection reasons, and suspension data retention (40 passing tests, 100% pass rate).

### Phase 2: Authentication & Role-Based Dashboard Routing
- **Unified Single Login Entry (`/login`)**: Single login page with email and password. Zero client-side role dropdowns or privilege inputs.
- **Server-Side Role Resolution**: Authenticated users are verified against `profiles` and `academies` tables, resolving automatically to `/admin`, `/owner`, `/teacher`, or `/student`.
- **Middleware Guard (`src/middleware.ts`)**: Session cookie refresh and multi-tenant route protection. Non-admins cannot access `/admin`; cross-role violations redirect to `/unauthorized`.
- **Student Account Claim Portal (`/student/signup`)**: Identity-linked onboarding via Academy Code + CNIC matching. Unverified student emails are held in `suspended` status awaiting Principal approval to prevent identity theft.
- **Privacy-Preserving Recovery (`/forgot-password`, `/reset-password`)**: Generic responses prevent account enumeration.
- **Platform Admin Bootstrap CLI (`scripts/bootstrap_admin.mjs`)**: Provisions permanent Platform Super Admin via service-role API without public registration exposure.
- **Automated Tests**: Added test suites for auth routing, password policies, and privacy invariants (34 passing tests, 100% pass rate).

### Transition from Android Native to Web/PWA
- **Architecture Shift**: Re-architected project from Android Jetpack Compose native codebase (`TuitionApp`) to a universal Web Application + Progressive Web App (PWA) built with Next.js, React, TypeScript, Tailwind CSS, and Supabase PostgreSQL.
- **PWA Capabilities**: Added Web App Manifest, Service Worker caching for offline app shell, and network connectivity indicators.

### User Roles & Permissions Revisions
- **Primary Student Role**: Introduced dedicated `student` role alongside `owner`, `teacher`, `staff`, and `platform_admin`. Students access their own dedicated portal (`/student`) to view attendance, results, fees, and submit proofs/leaves.
- **Student Identity Linking**: Replaced loose open registration with a secure two-step linking workflow using Academy Code + CNIC matching, verified email, and principal fallback approval for unverified accounts.
- **Teacher Separation**: Removed access to owner-only finances and compensation. Added principal toggle for student fee visibility.
- **Student Removal Workflow**: Implemented teacher removal request queue with Principal approval authority, preserving historical records and student access during pending status.
- **Leave Request Management**: Added structured student leave request submission with date range, reason, optional attachments, and principal review.
- **Teacher Attendance & Workload**: Added tracking for scheduled vs. completed lectures and daily teacher attendance.
- **Owner-Only Teacher Payments**: Added private compensation records accessible exclusively by academy owners and platform administrators.

### Database & Schema Updates
- Added migration `006_edutrack_v2_features.sql` with new tables:
  - `academy_registration_requests`
  - `student_removal_requests`
  - `leave_requests`
  - `teacher_attendance`
  - `teacher_payments`
- Added Row Level Security (RLS) policies for all new tables enforcing strict multi-tenant boundary checks.
- Extended `students` table with `cnic`, `email`, `is_verified`, and `linked_user_id`.

### Foundational Tooling & Documentation
- Established comprehensive documentation repository in `docs/`: `PROJECT_SPECIFICATION.md`, `USER_ROLES_AND_PERMISSIONS.md`, `DATABASE_STRUCTURE.md`, `FOLDER_GUIDE.md`, and `TESTING_CHECKLIST.md`.
- Added automated test suite covering academy code generation, role boundaries, and fee balance logic.
