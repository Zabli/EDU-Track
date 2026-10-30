# EduTrack — Acceptance & Testing Checklist

This checklist defines the manual and automated acceptance criteria based on Section 24 of the FYP Specification. Every phase must pass its corresponding criteria before proceeding.

---

## 1. Authentication & Registration

- [x] **Public Privilege Protection**: A user cannot select a privileged role (`admin`, `owner`, `teacher`) on a public registration form to elevate permissions.
- [x] **Unapproved Academy Protection**: An owner whose academy request is still `pending`, `rejected`, or `suspended` cannot access protected owner dashboard routes.
- [x] **Academy Registration & Approval Workflow**:
  - [x] Public request submission via `/register-academy` does not grant immediate owner access.
  - [x] Pending requests appear in Platform Admin queue (`/admin/academies`).
  - [x] Platform Admin can approve application, automatically generating unique 10-character code (`BTA-XXXXXX`).
  - [x] Platform Admin can reject application with recorded feedback.
  - [x] Platform Admin can suspend academy, immediately blocking protected operations while keeping data intact.
- [x] **Teacher Invitations**:
  - [x] Tied strictly to the intended academy and teacher profile.
  - [x] Time-limited (7 days) and single-use; invalid after acceptance.
  - [x] Cannot be hijacked by modifying URL query parameters.
- [x] **Student Identity Linking**:
  - [x] Entering an academy code and CNIC does not reveal whether a CNIC exists in that academy to arbitrary visitors.
  - [x] Students without pre-verified emails must have registration reviewed by the Principal before protected data access is granted.
  - [x] Passwords meet complexity standards (8+ chars).
- [x] **Safe Password Recovery**: Password reset flows do not leak registered email addresses.
- [x] **Duplicate Account Avoidance**: Existing users accepting a new academy invitation do not create separate duplicate logins.
- [x] **Student Claim Approval Queue**: Principal can audit, approve, or reject unverified student registrations (`/owner/students/pending`).

---

## 2. Permissions & Data Separation (Multi-Tenancy)

- [x] **Cross-Academy Isolation**:
  - [x] An Owner of Academy A cannot query or mutate records of Academy B via modified URL parameters, API payloads, or direct PostgREST calls.
  - [x] Database RLS strictly filters by `academy_id`.
- [x] **Teacher Scope Isolation**:
  - [x] Teachers cannot view unassigned classes or other teachers' private workloads.
  - [x] Teachers cannot view other teachers' salaries or owner payment registers.
  - [x] If the principal disables teacher fee visibility, fee data is completely blocked at the backend/database level.
- [x] **Student Scope Isolation**:
  - [x] Students can view only their own attendance, results, fees, and leave requests.
  - [x] Students cannot modify official marks, attendance registers, or fee ledgers.
- [x] **Platform Admin Scope**:
  - [x] Only Platform Admin accounts have platform-wide academy management access.
  - [x] Academy owners cannot access platform admin functions or provision other platform admins.
- [x] **Suspended Account Access**: Deactivated or suspended accounts immediately lose access to protected academy resources.

---

## 3. Core Operational Workflows

- [x] **Core Academy Setup & Rosters**:
  - [x] Principal can create and configure batches/classes with assigned subjects and schedules.
  - [x] Principal can directly enroll students with CNIC validation and roll number uniqueness.
  - [x] Principal can toggle student active/inactive status without destroying academic history.
  - [x] Principal can configure academy branding, receipt notes, and toggle the teacher fee visibility policy.
- [x] **Attendance & Audit Trail**:
  - [x] Teachers can record attendance for assigned sessions.
  - [x] Any attendance correction retains actor ID, timestamp, previous status, and new status in the audit history.
- [x] **Tests & Marks Evaluations**:
  - [x] Teachers and Principals can schedule class tests with positive maximum marks.
  - [x] Marks obtained cannot be negative or exceed the maximum test marks.
  - [x] Draft test results are strictly hidden from students until explicitly published.
  - [x] Students can access only their own published test results.
- [x] **Student Removal Requests**:
  - [x] Teachers can submit removal requests with a justification.
  - [x] Pending removal requests appear on the Principal dashboard.
  - [x] A pending request does not disrupt the student's normal access until the Principal explicitly approves it.
  - [x] An approved removal revokes active academy access while preserving historical attendance and marks records.
  - [x] Re-enrolling a removed student reactivates the existing profile rather than duplicating the student.
- [x] **Fees & External Payment Proofs**:
  - [x] Student submits transaction reference and optional screenshot for JazzCash / Easypaisa.
  - [x] Payment is marked `Pending Verification` (never automatically marked `Paid`).
  - [x] Principal verifies and confirms the transaction.
  - [x] Fee ledger and invoice status update with verifier ID and timestamp.
- [x] **Leave Requests**:
  - [x] Student submits leave request with date range and reason.
  - [x] Principal can review and approve or reject the leave.
  - [x] Approved leave does not delete historical records or falsely mark future dates.
- [x] **Teacher Payments**:
  - [x] Recorded by Principal with payment date, billing month, and method.
  - [x] Strictly hidden from teachers and visible only to authorized owners and platform admins.

---

## 4. PWA & Reliability

- [x] **Installability**: PWA manifest loads correctly and browsers prompt for installation on desktop and mobile.
- [x] **App Shell Caching**: Service worker caches static assets; application shell renders gracefully when offline.
- [x] **Offline Indicator**: App displays a clear banner when the device loses network connectivity.
- [x] **Safe Offline Degradation**: Sensitive mutations (marking attendance, making payments, updating permissions) show informative messaging that network connectivity is required, without falsely claiming data was saved.
- [x] **Input Resilience**: Empty data, malformed inputs, network timeouts, and expired sessions do not crash the application.
