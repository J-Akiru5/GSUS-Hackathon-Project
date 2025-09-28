# GSUS — Product Requirements Document (PRD)

## Executive summary

GSUS is a web application to automate the General Service Office (GSO) service request process for Iloilo Province. It replaces paper/manual processes with a digital system for submitting, triaging, assigning, tracking, approving, and reporting service requests across departments. The system focuses on usability for on-the-ground staff and managers, real-time visibility, auditability, and compliance with local privacy/security needs. It will support Filipino and English, and be mobile-friendly.

## Problem statement

The GSO currently handles facility and service requests using manual, time-consuming processes that cause:
- slow response/turnaround,
- lost/duplicated requests,
- poor visibility for requesters and managers,
- manual reporting and limited analytics.

The system must reduce turnaround time, eliminate tracking friction, and provide clear accountability.

## Objectives (SMART)

- Reduce average request resolution time by 40% within 6 months after launch.
- Increase first-response acknowledgement rate to 95% for all requests within 24 hours.
- Replace paper-based forms for ≥ 80% of incoming GSO requests within 3 months.
- Provide accurate daily/weekly dashboards for managers and automated monthly reports.

### Success metrics

- Mean time to acknowledge (MTTA) and mean time to resolve (MTTR).
- Percentage of requests updated within 24 hours.
- Number of active users (requesters and staff).
- System uptime and average API latency.

## Stakeholders

- Primary: GSO staff (request receivers, technicians), requesters (local gov employees/public), department managers.
- Secondary: Provincial IT team, security/privacy officers, analytics/reporting team.

## Users & personas

- Requester (department staff or public): Needs a simple form, attachment support, status updates.
- GSO Triage Officer: Needs to view incoming requests, change status, add notes, assign to technicians.
- Technician/Assignee: Needs assigned task list, attachments, comments, mark complete.
- Manager: Needs dashboards, filters, exportable reports, SLA monitoring.
- Admin: User management, Departments, roles, settings, integrations.

## Key user journeys

1. Submit request (form with category, priority, location, attachments, contact).
2. Acknowledge and triage (GSO staff adds category, assigns, sets SLA).
3. Work & update (technician adds progress, uploads photos, marks complete).
4. Approval & close (manager validates, closes; requester gives feedback).
5. Reporting & analytics (manager views KPI dashboards and exports data).

## Core features (MVP)

- Request submission form (web/mobile): category, description, urgency, location, optional attachments, contact info.
- Request tracking and status: New → Acknowledged → In Progress → Pending Approval → Completed → Closed.
- Role-based access (guest/requester, gso-staff, technician, manager, admin).
- Assignment workflow with notifications (email/in-app).
- Real-time updates via Firestore listeners for request status and activity feed.
- Dashboard: list, filters (status, department, date range), summary cards (counts, MTTR).
- Request detail page: activity log, attachments, comments, SLA/timestamps.
- Basic analytics: requests per category, per department, average response times.
- Localized UI (English + Filipino).
- Attachments stored securely (Firebase Storage) with metadata in Firestore.
- Audit log for request changes.

### Nice-to-have (post-MVP)

- SMS notifications.
- Multi-department routing rules.
- Approval flows with multi-level sign-off.
- Offline-capable form (PWA) with sync.
- Bulk import/export of requests (CSV).
- Integration with provincial asset/inventory systems.

## Functional requirements (detailed)

### Authentication & Authorization

- Users authenticate via Firebase Auth; support for SSO later.
- Role-based rules enforce access (Firestore security rules).
- Admin can invite users, set role & department.

### Requests

- Create: request data + optional attachments, timestamp, submitter id.
- Read: requesters see their requests; staff see assigned/department requests; managers see all.
- Update: status, assignee, notes, attachments. All updates create an activity log entry.
- Delete: soft-delete only; history retained.
- List: server-side / Firestore queries that support pagination, filters, sort.

### Notifications

- In-app real-time notifications.
- Email notifications for key events (new assignment, status change).
- Optional push/SMS integration.

### Attachments

- Attach images/pdf via Firebase Storage.
- Virus/mimetype validation client-side; metadata stored in Firestore.

### Audit & Logging

- Each change persisted to an `activities` subcollection with actor, timestamp, change type, before/after where applicable.

### Reporting & Analytics

- Aggregations for counts, average times, top categories — stored periodically (Cloud Function cron) for efficiency or computed via queries for small datasets.

### Security & privacy

- All traffic over HTTPS.
- Firestore security rules enforce minimal privilege and data partitioning.
- Sensitive fields encrypted at rest via cloud provider (Firestore already encrypted).
- Rate-limiting or abuse mitigation for public request submission endpoints.
- Data retention policy and export/delete workflow per provincial policy.

### Localization & Accessibility

- All UI strings via i18next with `en` and `fil` locales; language switch in settings.
- WCAG 2.1 AA accessibility baseline (labels, keyboard nav, contrast, ARIA attributes).
- Mobile-first responsive UI; components optimized for low-bandwidth.

### Performance & Scalability

- Firestore for realtime small-to-medium scale needs; index common queries.
- Page load ≤ 2s on typical mobile network.
- Support eventual horizontal scaling for APIs/CLOUD Functions.

## Data model (Firestore recommended collections)

- `users/{userId}`
  - name, email, role, deptId, avatarUrl, phone, createdAt
- `departments/{departmentId}`
  - name, code, contact
- `serviceRequests/{requestId}`
  - title, description, category, priority, location, status, submitterId, assigneeId, departmentId, slaDue, createdAt, updatedAt, closedAt
  - attachments: array of {storagePath, url, name, mime, uploadedBy}
- `serviceRequests/{requestId}/activities/{activityId}`
  - actorId, type (created, updated, comment, status_change, assignment), payload, timestamp
- `comments/{commentId}` or `serviceRequests/{id}/comments/{commentId}`
  - authorId, text, attachments, createdAt
- `analytics/daily_summary/{YYYY-MM-DD}`
  - computed metrics for reporting

### Security rules (high level)

- Requester can create request; can read own requests.
- Staff can read requests for their department.
- Manager/Admin can read all; only Admin can mutate departments/users.
- Attachments read only by users who have permission to read request.

## Firestore/Cloud Functions patterns

- Cloud Func for:
  - Sending emails on status change.
  - Generating daily analytics snapshot.
  - Sanitizing and moving uploaded attachments metadata (if needed).
- Use Firestore security rules with role checks stored in `users` doc.

## UX/UI guidelines

- Mobile-first, simple stepper form for submission.
- Status badges and color-coded priority.
- Progress/activity feed on request detail with timestamps and thumbnails for attachments.
- Quick actions for staff: assign, escalate, add note, change status.
- Manager dashboard with export (CSV/PDF).

## Acceptance criteria (MVP)

- A user can submit a request with attachments and receive confirmation.
- Staff can view, assign, and update request status; activity entries are logged.
- Requester can view real-time updates on their request.
- Dashboard shows counts and basic charts; manager can filter by date/department.
- Role-based access is enforced; unauthorized access returns 403.
- App supports Filipino translations for all visible UI strings.
- Attachment upload/download works and is secured by Firestore security rules.

## Implementation roadmap & milestones (suggested)

### Sprint 0 — Setup (1 week)

- Repo structure, CI, dev/staging/prod Firebase projects, Firestore rules scaffolding, i18n bootstrapping.

### MVP — Core workflows (4–6 sprints, 2 weeks each)

- Sprint 1: Request submission UI, Firestore create, basic auth.
- Sprint 2: Staff triage, assignment flow, activities.
- Sprint 3: Request detail page, attachments, in-app notifications.
- Sprint 4: Manager dashboard and basic analytics, CSV export.
- Sprint 5: Polish, localization, accessibility fixes, end-to-end QA.

### Post-MVP (months)

- Integrations (email/SMS), offline support, advanced reporting, multi-level approvals.

## Risks & mitigations

- Data privacy/regulatory issues — involve provincial legal/compliance early.
- Public spam submissions — add CAPTCHA, rate-limiting, and email validation.
- Attachment misuse — restrict types and file sizes; validate MIME types and scan if possible.
- Change management/resistance — provide training and staged rollout; keep a fallback manual process.

## QA & testing

- Unit tests for client components and Firestore interactions.
- Integration tests for Cloud Functions.
- E2E tests (Cypress) for major user flows: submission → assignment → completion.
- Accessibility audit and automated checks (axe).

## Operational & maintenance

- Monitoring: uptime (Sentry), Firestore usage/cost alerts, function errors.
- Backups: export Firestore nightly snapshots.
- Support: in-app feedback / contact form; assignment to IT admin.

## Appendix — sample user stories

- As a Requester, I want to submit a service request with a photo so the GSO can understand the issue.
- As a Triage Officer, I want to assign requests to technicians so work gets done.
- As a Manager, I want to filter requests by department and export them to CSV for reporting.
- As an Admin, I want to create user accounts and assign roles.

## Next concrete steps

1. Convert this PRD into GitHub issues and milestones (MVP backlog).
2. Create wireframes for three screens: Submit Request, Request Detail (activity feed), Manager Dashboard.
3. Implement Sprint 0: set up Firebase projects, security rules, CI, and basic skeleton React app with i18n wiring and firestoreService stubs.
4. Prepare acceptance test checklist and invite stakeholders for review.


---

*Document generated and added to repository by automation.*
