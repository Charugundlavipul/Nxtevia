-- Add ai_screening_enabled column to company_profiles
alter table public.company_profiles
  add column if not exists ai_screening_enabled boolean default false;
