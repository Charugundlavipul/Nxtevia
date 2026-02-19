-- Supabase schema for core auth-linked profiles
-- Run with: supabase db push (or psql) after setting SUPABASE_URL/KEY

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'user_role' and n.nspname = 'public'
  ) then
    create type public.user_role as enum ('seeker', 'company', 'admin');
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'opportunity_modality' and n.nspname = 'public'
  ) then
    create type public.opportunity_modality as enum ('remote', 'hybrid', 'on-site');
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'opportunity_stipend' and n.nspname = 'public'
  ) then
    create type public.opportunity_stipend as enum ('unpaid', 'stipend', 'paid');
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  role public.user_role not null,
  display_name text not null,
  country text,
  last_seen timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create unique index if not exists profiles_user_id_idx on public.profiles (user_id);

create table if not exists public.seeker_profiles (
  user_id uuid primary key references auth.users on delete cascade,
  about text,
  skills text[] default '{}',
  contact_email text,
  telephone text,
  student_flag boolean default false,
  career_stage text,
  resume_url text,
  opportunities jsonb,
  country text,
  state text,
  preferred_location text,
  portfolio jsonb,
  experiences jsonb,
  student_proof_name text,
  student_proof_url text,
  resume_name text,
  email_verified boolean default false,
  linkedin_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.company_profiles (
  user_id uuid primary key references auth.users on delete cascade,
  name text,
  about text,
  contact_email text,
  telephone text,
  industry text,
  size_range text,
  base_location text,
  website text,
  reasons_for_joining text[] default '{}',
  project_types text[] default '{}',
  project_types_other text,
  hiring_goal text,
  email_verified boolean default false,
  linkedin_verified boolean default false,
  status text not null default 'active' check (status in ('active', 'banned')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.company_requirements (
  user_id uuid primary key references auth.users on delete cascade,
  require_resume boolean default true,
  require_linkedin boolean default false,
  require_cover_letter boolean default false,
  require_portfolio boolean default false,
  require_availability boolean default false,
  require_contact boolean default false,
  preferred_messaging_method text default 'messaging',
  custom_questions jsonb default '[]',
  updated_at timestamptz default now()
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  problem text not null,
  desired_outcome text,
  scope text not null,
  modality public.opportunity_modality not null,
  duration text not null check (duration in ('0-3m', '4-6m', '7-9m', '10-12m', '>12m')),
  hours text not null,
  stipend public.opportunity_stipend not null,
  skills text[] not null default '{}',
  status text not null default 'pending',
  requirements jsonb default '[]',
  history jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists opportunities_user_id_idx on public.opportunities(user_id);
create index if not exists opportunities_status_idx on public.opportunities(status);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities on delete cascade,
  applicant_id uuid not null references auth.users on delete cascade,
  status text default 'submitted',
  answers jsonb default '[]',
  resume_url text,
  cover_letter_url text,
  portfolio_url text,
  linkedin_url text,
  availability text,
  contact text,
  applicant_snapshot jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create unique index if not exists applications_unique_applicant on public.applications (opportunity_id, applicant_id);

-- Track interviewing/hired records linked to opportunities/applicants
create table if not exists public.employee_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references auth.users on delete cascade,
  opportunity_id uuid not null references public.opportunities on delete cascade,
  applicant_id uuid not null references auth.users on delete cascade,
  status text not null default 'interviewing', -- interviewing | hired
  round text,
  schedule timestamptz,
  interviewer text,
  notes text,
  role text,
  start_date date,
  end_date date,
  -- feedback text, -- removed
  tenure_status text default 'in_progress',
  tenure_notes text,
  certificate_url text,
  flagged boolean default false,
  flag_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users on delete cascade,
  creator_role text not null check (creator_role in ('student', 'company', 'admin')),
  creator_name text not null,
  category text not null check (category in ('general', 'bug', 'feature_request', 'billing', 'technical_support', 'other')),
  title text not null,
  description text not null,
  status text not null default 'pending' check (status in ('pending', 'resolved')),
  notes text,
  resolved_at timestamptz,
  resolved_by uuid references auth.users on delete set null,
  resolved_by_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists tickets_status_idx on public.tickets (status);
create index if not exists tickets_creator_id_idx on public.tickets (creator_id);
create index if not exists employee_records_company_idx on public.employee_records (company_id);
create index if not exists employee_records_opportunity_idx on public.employee_records (opportunity_id);
create index if not exists employee_records_applicant_idx on public.employee_records (applicant_id);

-- Ensure new columns exist even if table was created earlier
alter table public.seeker_profiles
  add column if not exists country text,
  add column if not exists state text,
  add column if not exists preferred_location text,
  add column if not exists portfolio jsonb,
  add column if not exists experiences jsonb,
  add column if not exists opportunities jsonb,
  add column if not exists student_proof_name text,
  add column if not exists student_proof_url text,
  add column if not exists resume_name text,
  add column if not exists email_verified boolean default false,
  add column if not exists linkedin_verified boolean default false,
  add column if not exists status text not null default 'active' check (status in ('active', 'banned')),
  add column if not exists dob date,
  add column if not exists is_minor boolean default false;

alter table public.company_profiles
  add column if not exists reasons_for_joining text[] default '{}',
  add column if not exists project_types text[] default '{}',
  add column if not exists project_types_other text,
  add column if not exists hiring_goal text,
  add column if not exists status text not null default 'active' check (status in ('active', 'banned'));

alter table public.company_requirements
  add column if not exists require_resume boolean default true,
  add column if not exists require_linkedin boolean default false,
  add column if not exists require_cover_letter boolean default false,
  add column if not exists require_portfolio boolean default false,
  add column if not exists require_availability boolean default false,
  add column if not exists require_contact boolean default false,
  add column if not exists preferred_messaging_method text default 'messaging',
  add column if not exists custom_questions jsonb default '[]',
  add column if not exists updated_at timestamptz default now();


-- Helper to check if user is banned
create or replace function public.check_if_banned()
returns boolean as $$
begin
  if exists (select 1 from public.company_profiles where user_id = auth.uid() and status = 'banned') then
    return true;
  end if;
  return false;
end;
$$ language plpgsql security definer;

-- Secure helper to check if user is admin (avoids user_metadata)
create or replace function public.is_admin()
returns boolean as $$
begin
  return (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
    OR exists (
      select 1 from public.profiles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );
end;
$$ language plpgsql security definer;

alter table public.opportunities
  add column if not exists title text,
  add column if not exists problem text,
  add column if not exists desired_outcome text,
  add column if not exists scope text,
  add column if not exists modality text,
  add column if not exists duration text,
  add column if not exists hours text,
  add column if not exists stipend text,
  add column if not exists pay_amount numeric,
  add column if not exists currency text default 'USD',
  add column if not exists pay_type text default 'hourly',
  add column if not exists skills text[] default '{}',
  add column if not exists status text default 'pending',
  add column if not exists requirements jsonb default '[]',
  add column if not exists history jsonb default '[]',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.applications
  add column if not exists status text default 'submitted',
  add column if not exists answers jsonb default '[]',
  add column if not exists resume_url text,
  add column if not exists cover_letter_url text,
  add column if not exists portfolio_url text,
  add column if not exists linkedin_url text,
  add column if not exists availability text,
  add column if not exists contact text,
  add column if not exists applicant_snapshot jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.profiles enable row level security;
alter table public.seeker_profiles enable row level security;
alter table public.company_profiles enable row level security;
alter table public.company_requirements enable row level security;
alter table public.opportunities enable row level security;
alter table public.applications enable row level security;
alter table public.employee_records enable row level security;
alter table public.tickets enable row level security;

-- Owners can read/update their records. Service role bypasses for admin/server tasks.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = user_id AND NOT public.check_if_banned());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = user_id AND NOT public.check_if_banned());

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update using (public.is_admin());

-- Allow authenticated users to view profiles (needed for search)
drop policy if exists profiles_view_authenticated on public.profiles;
create policy profiles_view_authenticated on public.profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists seeker_select_own on public.seeker_profiles;
create policy seeker_select_own on public.seeker_profiles
  for select using (auth.uid() = user_id);

drop policy if exists seeker_insert_own on public.seeker_profiles;
create policy seeker_insert_own on public.seeker_profiles
  for insert with check (auth.uid() = user_id AND NOT public.check_if_banned());

drop policy if exists seeker_update_own on public.seeker_profiles;
create policy seeker_update_own on public.seeker_profiles
  for update using (auth.uid() = user_id AND NOT public.check_if_banned());

drop policy if exists seeker_update_admin on public.seeker_profiles;
create policy seeker_update_admin on public.seeker_profiles
  for update using (public.is_admin());

-- Allow authenticated users to view seeker profiles
drop policy if exists seeker_view_authenticated on public.seeker_profiles;
create policy seeker_view_authenticated on public.seeker_profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists company_select_own on public.company_profiles;
create policy company_select_own on public.company_profiles
  for select using (auth.uid() = user_id);

drop policy if exists company_insert_own on public.company_profiles;
create policy company_insert_own on public.company_profiles
  for insert with check (auth.uid() = user_id AND NOT public.check_if_banned());

drop policy if exists company_update_own on public.company_profiles;
create policy company_update_own on public.company_profiles
  for update using (auth.uid() = user_id AND NOT public.check_if_banned());

drop policy if exists company_update_admin on public.company_profiles;
create policy company_update_admin on public.company_profiles
  for update using (public.is_admin());

-- Allow authenticated users to view company profiles
drop policy if exists company_view_authenticated on public.company_profiles;
create policy company_view_authenticated on public.company_profiles
  for select using (auth.role() = 'authenticated');

-- Admins can read company profiles
drop policy if exists company_admin_select on public.company_profiles;
create policy company_admin_select on public.company_profiles
  for select using (public.is_admin());

drop policy if exists company_requirements_select_own on public.company_requirements;
create policy company_requirements_select_own on public.company_requirements
  for select using (auth.uid() = user_id);

drop policy if exists company_requirements_upsert_own on public.company_requirements;
create policy company_requirements_upsert_own on public.company_requirements
  for insert with check (auth.uid() = user_id);

drop policy if exists company_requirements_update_own on public.company_requirements;
create policy company_requirements_update_own on public.company_requirements
  for update using (auth.uid() = user_id);

drop policy if exists opportunities_select_own on public.opportunities;
create policy opportunities_select_own on public.opportunities
  for select using (auth.uid() = user_id);

drop policy if exists opportunities_insert_own on public.opportunities;
create policy opportunities_insert_own on public.opportunities
  for insert with check (auth.uid() = user_id AND NOT public.check_if_banned());

drop policy if exists opportunities_update_own on public.opportunities;
create policy opportunities_update_own on public.opportunities
  for update using (auth.uid() = user_id AND NOT public.check_if_banned());

drop policy if exists opportunities_admin_select on public.opportunities;
create policy opportunities_admin_select on public.opportunities
  for select using (public.is_admin());

drop policy if exists opportunities_admin_update on public.opportunities;
create policy opportunities_admin_update on public.opportunities
  for update using (public.is_admin());

-- Public/seekers can view active (approved) opportunities
drop policy if exists opportunities_public_active_select on public.opportunities;
create policy opportunities_public_active_select on public.opportunities
  for select using (status = 'approved');

-- Applications policies
drop policy if exists applications_insert_own on public.applications;
create policy applications_insert_own on public.applications
  for insert with check (auth.uid() = applicant_id AND NOT public.check_if_banned());

drop policy if exists applications_select_own on public.applications;
create policy applications_select_own on public.applications
  for select using (auth.uid() = applicant_id);

drop policy if exists applications_company_select on public.applications;
create policy applications_company_select on public.applications
  for select using (
    exists (
      select 1 from public.opportunities o
      where o.id = applications.opportunity_id
      and o.user_id = auth.uid()
    )
  );

drop policy if exists applications_admin_select on public.applications;
create policy applications_admin_select on public.applications
  for select using (public.is_admin());

drop policy if exists applications_status_update on public.applications;
create policy applications_status_update on public.applications
  for update using (
    exists (
      select 1 from public.opportunities o
      where o.id = applications.opportunity_id
      and o.user_id = auth.uid()
    )
    or public.is_admin()
  )
  with check (NOT public.check_if_banned());

drop policy if exists applications_update_own on public.applications;
create policy applications_update_own on public.applications
  for update using (auth.uid() = applicant_id AND NOT public.check_if_banned());

drop policy if exists applications_delete_own on public.applications;
create policy applications_delete_own on public.applications
  for delete using (auth.uid() = applicant_id AND NOT public.check_if_banned());

-- Employee record policies
drop policy if exists employee_records_company_select on public.employee_records;
create policy employee_records_company_select on public.employee_records
  for select using (auth.uid() = company_id);

drop policy if exists employee_records_company_insert on public.employee_records;
create policy employee_records_company_insert on public.employee_records
  for insert with check (auth.uid() = company_id AND NOT public.check_if_banned());

drop policy if exists employee_records_admin_insert on public.employee_records;
create policy employee_records_admin_insert on public.employee_records
  for insert with check (public.is_admin());

drop policy if exists employee_records_company_update on public.employee_records;
create policy employee_records_company_update on public.employee_records
  for update using (auth.uid() = company_id AND NOT public.check_if_banned());

drop policy if exists employee_records_company_delete on public.employee_records;
create policy employee_records_company_delete on public.employee_records
  for delete using (auth.uid() = company_id AND NOT public.check_if_banned());

drop policy if exists employee_records_admin_select on public.employee_records;
create policy employee_records_admin_select on public.employee_records
  for select using (public.is_admin());

drop policy if exists employee_records_admin_update on public.employee_records;
create policy employee_records_admin_update on public.employee_records
  for update using (public.is_admin());

drop policy if exists employee_records_admin_delete on public.employee_records;
create policy employee_records_admin_delete on public.employee_records
  for delete using (public.is_admin());

drop policy if exists tickets_creator_insert on public.tickets;
create policy tickets_creator_insert on public.tickets
  for insert with check (auth.uid() = creator_id);

drop policy if exists tickets_creator_select on public.tickets;
create policy tickets_creator_select on public.tickets
  for select using (auth.uid() = creator_id);

drop policy if exists tickets_admin_select on public.tickets;
create policy tickets_admin_select on public.tickets
  for select using (public.is_admin());

drop policy if exists tickets_admin_update on public.tickets;
create policy tickets_admin_update on public.tickets
  for update using (public.is_admin());
drop policy if exists employee_records_applicant_select on public.employee_records;
create policy employee_records_applicant_select on public.employee_records
  for select using (auth.uid() = applicant_id);

-- Storage object policies are managed separately (see storage-policies.sql) and must be run as an owner role (supabase_admin/postgres).
-- Messaging System Schema

-- Conversations table
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  title text,
  job_id uuid references public.opportunities(id) on delete set null,
  job_title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Participants table (many-to-many relationship between users and conversations)
create table if not exists public.conversation_participants (
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role public.user_role not null,
  joined_at timestamptz default now(),
  last_read_at timestamptz default now(),
  primary key (conversation_id, user_id)
);

-- Messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete cascade,
  content text not null,
  attachments jsonb default '[]',
  created_at timestamptz default now(),
  read_at timestamptz
);

-- Indexes
create index if not exists idx_conversation_participants_user on public.conversation_participants(user_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_messages_sender on public.messages(sender_id);

-- Enable RLS
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

-- Policies

-- Add created_by column if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'conversations' and column_name = 'created_by') then
    alter table public.conversations add column created_by uuid references auth.users(id) default auth.uid();
  end if;
end $$;

-- Conversations:
-- Select: Users can see conversations they are part of OR created.
drop policy if exists "Users can view their own conversations" on public.conversations;
create policy "Users can view their own conversations"
  on public.conversations for select
  using (
    auth.uid() = created_by OR
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = id
      and cp.user_id = auth.uid()
    )
  );

-- Insert: Only Admin and Company can create conversations (implicitly via application logic, but enforced here if needed).
-- Actually, anyone can create a conversation row, but they must also insert themselves as a participant.
-- For simplicity, we'll allow authenticated users to create, but the application logic will restrict Seekers.
drop policy if exists "Companies and Admins can create conversations" on public.conversations;
drop policy if exists "Authenticated users can create conversations" on public.conversations;
create policy "Authenticated users can create conversations"
  on public.conversations for insert
  with check (auth.role() = 'authenticated' AND NOT public.check_if_banned());

-- Update: Users can update conversations they are part of (e.g. updating updated_at)
drop policy if exists "Users can update their own conversations" on public.conversations;
create policy "Users can update their own conversations"
  on public.conversations for update
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = id
      and cp.user_id = auth.uid()
    )
  );
-- Better approach: Check role from metadata or profiles if possible, or just allow auth users and rely on participant policy.
-- Let's stick to "Authenticated users can create" for the conversation parent, but we'll restrict participant insertion.

-- Helper function to avoid infinite recursion in policies
drop function if exists public.is_conversation_participant(uuid) cascade;
create or replace function public.is_conversation_participant(_conversation_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.conversation_participants
    where conversation_id = _conversation_id
    and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Conversation Participants:
-- Select: Users can see participants of conversations they are in.
drop policy if exists "Users can view participants of their conversations" on public.conversation_participants;
create policy "Users can view participants of their conversations"
  on public.conversation_participants for select
  using (
    user_id = auth.uid() OR
    public.is_conversation_participant(conversation_id)
  );

-- Insert: 
-- 1. Users can add themselves (if allowed).
-- 2. Companies/Admins can add others.
-- We need a policy that allows creating the initial participant rows when a conversation is created.
drop policy if exists "Users can insert participants" on public.conversation_participants;
create policy "Users can insert participants"
  on public.conversation_participants for insert
  with check (
    -- Allow if user is adding themselves OR if user is Company/Admin adding someone else
    (auth.uid() = user_id AND NOT public.check_if_banned())
    OR 
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('company', 'admin')
    OR
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
      and p.role in ('company', 'admin')
      and NOT public.check_if_banned()
    )
  );

-- Messages:
-- Select: Participants can view messages.
drop policy if exists "Participants can view messages" on public.messages;
create policy "Participants can view messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id
      and cp.user_id = auth.uid()
    )
  );

-- Insert: Participants can send messages.
drop policy if exists "Participants can send messages" on public.messages;
create policy "Participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and NOT public.check_if_banned()
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id
      and cp.user_id = auth.uid()
    )
  );

-- Allow senders to update their own messages within 30 minutes
drop policy if exists "Senders can update own messages" on public.messages;
create policy "Senders can update own messages"
  on public.messages
  for update
  using (
    auth.uid() = sender_id
    and NOT public.check_if_banned()
    and created_at > (now() - interval '30 minutes')
  );

-- Allow senders to delete their own messages within 30 minutes
drop policy if exists "Senders can delete own messages" on public.messages;
create policy "Senders can delete own messages"
  on public.messages
  for delete
  using (
    auth.uid() = sender_id
    and NOT public.check_if_banned()
    and created_at > (now() - interval '30 minutes')
  );

-- Enable REPLICA IDENTITY FULL for messages to support filtering DELETE events by non-PK columns
alter table public.messages replica identity full;

-- Update: Users can update their own read status (via last_read_at in participants, or read_at in messages if we track per message).
-- We have read_at in messages (usually for "when was this message read by the recipient?").
-- But in a group chat or even 1:1, "read_at" on the message usually implies "read by everyone" or "read by the other person".
-- Simpler: update `last_read_at` on `conversation_participants`.
drop policy if exists "Users can update their own participant record" on public.conversation_participants;
create policy "Users can update their own participant record"
  on public.conversation_participants for update
  using (auth.uid() = user_id);

-- Realtime
-- Realtime
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'conversations') then
    alter publication supabase_realtime add table public.conversations;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'conversation_participants') then
    alter publication supabase_realtime add table public.conversation_participants;
  end if;
end;
$$;

-- Allow authenticated users to view seeker profiles
drop policy if exists seeker_view_authenticated on public.seeker_profiles;
create policy seeker_view_authenticated on public.seeker_profiles
  for select using (auth.role() = 'authenticated');

-- Allow authenticated users to view company profiles
drop policy if exists company_view_authenticated on public.company_profiles;
create policy company_view_authenticated on public.company_profiles
  for select using (auth.role() = 'authenticated');

-- Allow anonymous/public users to view company names (for home page opportunities)
drop policy if exists company_public_read on public.company_profiles;
create policy company_public_read on public.company_profiles
  for select using (true);

-- Legal Attestations for things like ESA Student Exemptions
create table if not exists public.legal_attestations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references auth.users on delete cascade,
  job_id uuid not null references public.opportunities on delete cascade,
  attestation_type text not null, -- e.g. "ESA_STUDENT_EXEMPTION"
  version text not null,
  ip_address text,
  user_agent text,
  timestamp timestamptz default now()
);

alter table public.legal_attestations enable row level security;

-- Only the creator (company) can insert their own attestations
drop policy if exists attestations_insert_own on public.legal_attestations;
create policy attestations_insert_own on public.legal_attestations
  for insert with check (auth.uid() = company_id);

-- Companies can view their own attestations
drop policy if exists attestations_select_own on public.legal_attestations;
create policy attestations_select_own on public.legal_attestations
  for select using (auth.uid() = company_id);

-- Admins can view all attestations
drop policy if exists attestations_admin_select on public.legal_attestations;
create policy attestations_admin_select on public.legal_attestations
  for select using (public.is_admin());

-- Bookmarks table
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, opportunity_id)
);

alter table public.bookmarks enable row level security;

-- Policies
drop policy if exists bookmarks_select_own on public.bookmarks;
create policy bookmarks_select_own on public.bookmarks
  for select using (auth.uid() = user_id);

drop policy if exists bookmarks_insert_own on public.bookmarks;
create policy bookmarks_insert_own on public.bookmarks
  for insert with check (auth.uid() = user_id);

drop policy if exists bookmarks_delete_own on public.bookmarks;
create policy bookmarks_delete_own on public.bookmarks
  for delete using (auth.uid() = user_id);

-- Enforce unique hired status per applicant per opportunity
drop index if exists employee_records_one_hire_idx;
create unique index employee_records_one_hire_idx on public.employee_records (opportunity_id, applicant_id) where status = 'hired';

-- Enforce unique interviewing round per applicant per opportunity
drop index if exists employee_records_unique_round_idx;
create unique index employee_records_unique_round_idx on public.employee_records (opportunity_id, applicant_id, round) where status = 'interviewing';


