# Supabase Backend Plan (NxteVia)

## Frontend Contract (what exists today)
- Roles: `admin`, `company`, `seeker` (a.k.a. student). Auth gates currently rely on localStorage flags `eaas_authed`, `eaas_role`, and `eaas_admin_authed`.
- Opportunity lifecycle: Companies post/edit jobs; Admins review/approve/deny/resubmit; Companies and Admins can export job data; job history is shown on admin/company review pages (`AdminJobReview`, `CompanyJobReview`).
- Applications: Seekers apply (`ApplyForm`), track applied jobs (`SeekerDashboard`); companies/administrators view applicants (`AdminJobApplicants`, `CompanyJobApplicants`) and start chats.
- Company requirements: Per-company preferences for what applicants must submit (`CompanyRequirements`), consumed by `ApplyForm` (resume, LinkedIn, cover letter, availability, custom question, etc.).
- Messaging: Three-way chat (admin/company/seeker) with conversation/job context, unread counts, attachments (`lib/messaging`, chat list/window pages per role).
- Hires & tenure: Companies track hired applicants and tenure/certificates/flags; admins have a parallel hired/interview table on review screens.
- Profiles & verification: Seeker profiles with resume upload, student proof, email/LinkedIn verification flags; company profiles with contact, industry, size, location, website, verification flags; profiles viewable by admin/company/seeker.
- Tickets: Cross-role support tickets with admin resolution flow (`AdminTickets`, `TicketModal`).
- Analytics (placeholder): Admin dashboard shows DAU, bounce, conversions, top viewed/applied jobs.
- Badges/certificates: Seekers can view completed opportunities and credential links (`SeekerBadges`).

## Supabase Data Model
### Core auth/profile
- `auth.users` (Supabase managed).
- `profiles` (uuid PK, user_id FK -> auth.users, role enum `seeker|company|admin`, display_name, avatar_url, country, last_seen, onboarding flags).
- `seeker_profiles` (user_id PK/FK -> profiles, about, skills text[], resume_file_id, contact_email, telephone, student_flag, student_proof_file_id, career_stage enum, email_verified, linkedin_verified).
- `company_profiles` (user_id PK/FK -> profiles, name, about, contact_email, telephone, industry, size_range, base_location, website, reasons_for_joining text[], project_types text[], project_types_other, hiring_goal, email_verified, linkedin_verified).
- `admin_accounts` (user_id PK/FK -> profiles, permissions JSONB for future scoping).

### Opportunities & requirements
- `job_posts` (uuid PK, company_id FK -> profiles, title, modality enum `remote|hybrid|on-site`, country/state/city/postal_code, duration_weeks, hours_per_week, stipend enum `none|micro|modest`, skills text[], summary, scope, outcomes, status enum `draft|pending|approved|denied|resubmitted`, posted_at, created_at, updated_at).
- `job_status_history` (id, job_id FK, actor_id FK, actor_role, action enum, comment, at).
- `job_requirements` (job_id PK/FK -> job_posts, inherit_defaults bool, require_resume bool, require_linkedin bool, require_cover_letter bool, require_portfolio bool, require_availability bool, require_contact bool, custom_question text, preferred_messaging_method, additional_json JSONB).
- `company_requirement_defaults` (company_id PK/FK -> profiles, same fields as job_requirements).
- `job_assets` (id, job_id, type enum `logo|attachment`, storage_object, created_at).

### Applications & hiring
- `applications` (uuid PK, job_id FK -> job_posts, seeker_id FK -> profiles, status enum `submitted|reviewing|interview|offer|hired|withdrawn|rejected`, submitted_at, updated_at, withdrawn_at, withdrawn_reason).
- `application_answers` (id, application_id FK, question_key, value text).
- `application_files` (id, application_id FK, type enum `resume|portfolio|other`, storage_object, size, mime, created_at).
- `interviews` (id, application_id FK, round, schedule timestamptz, interviewer, notes, outcome enum `pending|pass|fail`, created_at).
- `offers` (id, application_id FK, terms JSONB, offered_at, accepted_at, declined_at, decline_reason).
- `hire_records` (id, application_id FK, start_date, end_date, role_title, status enum `in_progress|completed|terminated`, feedback text, flagged bool, flag_reason text, certificate_file_id, badge_url, created_at).
- `employee_notes` (id, hire_id FK, author_id FK, note, created_at).

### Messaging
- `conversations` (uuid PK, job_id FK nullable, title, created_at, updated_at).
- `conversation_participants` (conversation_id FK, user_id FK, role enum, last_read_at, joined_at, PK (conversation_id, user_id)).
- `messages` (uuid PK, conversation_id FK, sender_id FK, sender_role enum, content text, created_at, edited_at, read_by JSONB[] optional aggregate).
- `message_attachments` (id, message_id FK, storage_object, type enum `image|document|audio|video`, size, mime, created_at).

### Support & moderation
- `tickets` (uuid PK, creator_id FK, creator_role enum, category enum `general|bug|feature_request|billing|technical_support|other`, title, description, status enum `pending|resolved`, resolved_at, resolved_by FK, notes).
- `notifications` (id, user_id FK, type, payload JSONB, read_at, created_at).
- `audit_log` (id, actor_id FK, actor_role, action, entity_type, entity_id, diff JSONB, created_at).

### Analytics/events
- `events` (id, user_id FK nullable, event_type text, created_at, metadata JSONB) for view_job, start_application, submit_application, message_sent, login, etc.
- Materialized views for admin dashboard: DAU, conversion, response_rate, top viewed/applied jobs, posting frequency.

### Storage buckets
- Buckets: `resumes`, `certificates`, `message_attachments`, `company_assets`, `job_assets` (logo). Use signed URLs; enforce type/size on upload.

## Access Control (RLS/permissions)
- `profiles` readable by self and admins; update-only by self (limited fields); admins can update role/flags via service key.
- `seeker_profiles` and related resumes/files: owner read/write; companies can view limited fields for applicants to their jobs; admins unrestricted.
- `company_profiles`: owner read/write; admins read/write; seekers read public fields (name, website, industry, size, location).
- `job_posts`: public read only when `status = 'approved'`; company owner read/write own posts; company can set draft/pending/resubmitted; only admin can set `approved|denied`; RLS blocks others.
- `job_status_history`: insert by admin/company actors for their job; readable by company, admin; seekers read via join for approved jobs only.
- `job_requirements` and `company_requirement_defaults`: owner read/write; admins read/write.
- `applications`: seeker can create for approved jobs; seeker read/update only own (withdrawal); company can read for its jobs; admin can read all; status transitions constrained via RPC.
- `application_files`: owner + company (for the job) + admin read; write by owner; signed URL downloads.
- `interviews/offers/hire_records/employee_notes`: company for its job/applications; admin read; seeker read own interview/offer/hire rows; updates via guarded RPC.
- `conversations/messages`: participant-only RLS; creation allowed for participants; job-scoped conversations allowed between company and seeker; admin can join any conversation (service key) for moderation.
- `tickets`: creator read/write (close/withdraw), admin read/write (resolve); others denied.
- `notifications`/`audit_log`: recipient-only read (notifications); audit_log admin-only read.
- `events`: insert-only public (with rate limiting); admin read.
- Storage policies mirror table access (owner/company/admin), using JWT claims.

## Server Functions / RPCs (to keep logic server-side)
- `approve_job(job_id, comment)` / `deny_job` / `request_revision` / `resubmit_job` (writes history + status).
- `create_job(company_id, payload)` ensures ownership and initializes history and requirements.
- `create_application(job_id, payload)` validates job status/requirements; records answers/files; emits event.
- `update_application_status(application_id, next_status, notes)` with role-aware transitions (company for interviewing/offer/hired; seeker for withdrawn; admin override).
- `schedule_interview(application_id, round, schedule, interviewer, notes)`.
- `record_offer(application_id, terms)` and `accept_offer(application_id)` / `decline_offer`.
- `create_hire(application_id, payload)`; `update_hire(hire_id, payload)` with flagging.
- `create_conversation_if_missing(participants, job_id?)`; `send_message(conversation_id, content, attachments[])`; `mark_conversation_read(conversation_id)`.
- `create_ticket(category, title, description)`; `resolve_ticket(ticket_id, notes)`.
- `emit_event(event_type, metadata)` for analytics.
- `log_admin_action(entity_type, entity_id, action, diff)` trigger helper.

## Indexing & performance
- Common indexes: `job_posts(status, posted_at)`, `job_posts(company_id)`, GIN on `job_posts.skills` and `events.metadata` if needed; `applications(job_id)`, `applications(seeker_id)`, `messages(conversation_id, created_at)`, `conversation_participants(user_id)`, `tickets(status)`, `events(event_type, created_at)`.
- Materialized views for analytics refreshed on schedule or on-demand by admin.

## API Surface (map to UI routes)
- Auth: sign-up/sign-in, session check, update profile role, onboarding complete.
- Jobs: list/filter approved jobs; get job detail; company CRUD job; admin moderation endpoints; export job JSON.
- Requirements: get company defaults; get job requirements (merged defaults); update defaults; update per-job requirements.
- Applications: create; seeker list own; company/admin list applicants for a job; change status; withdraw; interview CRUD; offer CRUD; hire CRUD; export applicants/hire data.
- Messaging: list conversations with unread counts; create/find conversation; list messages; send message with attachments; mark read.
- Profiles: seeker/company profile CRUD; verification flags (email/LinkedIn); resume upload/download (signed URL).
- Tickets: create; list own; admin list/filter; resolve/reopen with notes.
- Badges/certificates: list completed jobs for seeker; upload certificate; admin/company add badge URL on hire record.
- Analytics: events ingest; admin metrics endpoints backed by materialized views.

## Storage Buckets & Lifecycles
- Buckets: `resumes`, `certificates`, `message_attachments`, `company_assets`, `job_assets`.
- Enforce MIME/size at upload; signed URLs for client access; periodic cleanup for orphaned files via cron job or edge function.

## Security & Safety
- RLS everywhere; JWT role claim; service key used only server-side for admin operations.
- Rate limit: message send, ticket create, auth flows; consider Supabase edge functions + Redis/pg_net for throttling.
- Audit: all admin/job moderation/application status changes logged to `audit_log`.
- Validation: server-side schema (Zod on client + Postgres constraints); file type/size validation before upload.

## Migration & Integration Steps
1) Create Supabase project; enable extensions `pgcrypto`, `uuid-ossp`; create buckets.
2) Apply SQL migrations for tables/enums/RLS/policies/indexes above.
3) Seed minimal data: one admin account, sample company/seeker for dev, sample approved job.
4) Replace `client/lib/*` localStorage mocks with Supabase data-access layer (React Query): jobs, admin review, companies/seekers lists, messaging, tickets, applications, requirements, profiles, hires.
5) Replace auth gates to use Supabase session + role claim instead of `eaas_*` localStorage flags.
6) Wire uploads with Supabase Storage + signed URLs (resume, certificates, message attachments, logos).
7) Implement RPCs in SQL; update frontend calls to use them for state transitions.
8) Add analytics ingestion hook on key actions; render admin analytics from views.
9) Add monitoring: edge function logs, error reporting, and backup/retention plan for storage/db.

## Nice-to-haves / future
- Email notifications via Supabase Functions on status changes/offers/interview schedules.
- Webhooks for external ATS/CRM integration.
- Background jobs to expire stale drafts/withdrawn applications and to recalc metrics.
- Feature flags table to gate beta features.
