# EduTrack — Web Application + Progressive Web App (PWA)
## Final Year Project (FYP) Living Specification (Version 2.0)

**Project Type**: Multi-academy education and academy-management platform for Pakistan  
**Specification Baseline**: October 29, 2026  
**Primary Target**: Progressive Web App (PWA) + Responsive Web Application  

---

### 1. Project Overview & Vision
EduTrack is a responsive web application and Progressive Web App designed specifically for tuition academies, coaching centres, and educational institutes in Pakistan. It manages students, teachers, classes, sections, attendance, tests and marks, fee plans, payment proofs (JazzCash, Easypaisa, Bank), leave requests, teacher workload/attendance, owner-only teacher payments, and white-label academy branding.

#### Core Principles
- **One Shared Platform**: Multi-tenant architecture serving multiple academies (e.g. Bright Star Academy, Zainab Academy) with strict isolation.
- **Enforced Security**: Permissions and data access are enforced server-side and at the database level via Row Level Security (RLS) — not merely by hiding UI buttons.
- **PWA Experience**: Installable on Windows, Android, iPhone/iPad, with responsive design, service worker caching, and explicit offline status indicators.

---

### 2. User Roles & Access Hierarchy

| Role | Scope | Key Responsibilities |
|---|---|---|
| **EduTrack Platform Admin** | Platform-wide | Approve/reject/suspend academies; manage platform health; audit global access. |
| **Academy Owner / Principal** | Own Academy Only | Full day-to-day operations: classes, sections, teachers, students, fees, attendance, marks, leave, removal approvals, branding. |
| **Teacher** | Assigned Classes & Allowed Data | Mark attendance, enter test marks for permitted classes, submit student removal requests. Cannot view owner finances. Fee visibility toggleable by principal. |
| **Student** | Own Account & Records | View attendance, test results, fee dues/history; submit leave requests; upload JazzCash/Easypaisa payment proofs. |

---

### 3. Authentication & Onboarding Workflow

#### Single Entry Login
- Unified login endpoint (`/login`).
- Post-authentication server-side check resolves user status, academy membership, and active role.
- Redirection to role-specific dashboards:
  - Platform Admin -> `/admin`
  - Academy Owner -> `/owner`
  - Teacher -> `/teacher`
  - Student -> `/student`
- **Zero Public Role Selection**: No user can elevate privileges through form inputs.

#### Academy Registration & Approval
1. Prospective owner submits registration request via `/register-academy`.
2. Request lands in Platform Admin pending queue.
3. Admin reviews and approves/rejects the request.
4. On approval, system provisions the academy, generates a unique 10-character code (`BTA-XXXXXX`), and sends secure owner onboarding instructions.

#### Student Identity Linking & Registration
1. Student accesses registration portal with Academy Code and CNIC.
2. Server privately verifies if an eligible record exists without exposing student data publicly.
3. Verification link or code is sent to student's verified email.
4. Student sets a password and links to their profile.
5. If student email was not pre-recorded by the academy, registration remains **Pending** until Principal confirms identity.

#### Teacher Onboarding
1. Principal creates teacher record and generates a single-use, time-limited invitation.
2. Teacher accepts invitation, verifies email, and sets credentials.
3. Teacher gains access strictly to their assigned classes and subjects.

---

### 4. Core Academy Management Workflows

#### Attendance & Leave Management
- Daily registers per class and section.
- Explicit attendance states: `Present`, `Absent`, `Informed / Leave Reported`.
- Every correction records actor, timestamp, previous value, and new value in the audit trail.
- Student leave requests require dates and reasons (with optional medical/supporting proof) and principal approval.

#### Tests, Marks & Performance Reports
- Test records capture test title, subject, total marks, obtained marks, test date, and remarks.
- Percentage calculations enforced; obtained marks capped at total marks.
- Published results visible only to respective students.
- Academy-wide and class-wise analytics for the principal.

#### Fees & External Payment Proofs
- Custom fee plans (monthly amounts, due dates, discounts/adjustments).
- States: `Unpaid`, `Partial`, `Paid`, `Overdue`, `Pending Verification`.
- Manual verification for external payments (JazzCash / Easypaisa):
  1. Student/Parent submits transaction reference and screenshot.
  2. Status set to `Pending Verification`.
  3. Principal verifies funds in real account and confirms/rejects.
  4. System updates the fee ledger with verifier identity and timestamp.

#### Student Removal Request Workflow
1. Teacher identifies issue and submits student removal request with justification.
2. Request appears on Principal's **Student Removal Requests** queue.
3. Student retains normal access while request is `Pending`.
4. If approved by Principal, student is deactivated from active rosters; historical attendance and financial ledgers remain preserved.
5. Re-enrolment reactivates existing identity rather than generating duplicate records.

#### Teacher Workload & Owner-Only Payments
- Track daily teacher attendance and scheduled vs. completed lectures.
- Teacher payment records are strictly restricted to Academy Owners and Platform Admins.

#### White-Label Academy Branding
- Customizable academy name, logo, primary/secondary colors, address, and WhatsApp contact.
- Themes adapt dynamically while maintaining WCAG AA contrast standards.

---

### 5. PWA & Reliability Requirements
- Installable Web App Manifest (`manifest.json`) and Service Worker caching app shell and static assets.
- Clear online/offline visual indicators.
- Safe offline degradation: sensitive financial, identity, and administrative actions require active server validation.
