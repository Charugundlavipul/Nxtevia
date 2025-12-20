-- Allow public reads
drop policy if exists "profile-files public read" on storage.objects;
create policy "profile-files public read"
on storage.objects
for select
using (bucket_id = 'profile-files');

-- Allow authenticated users to upload
drop policy if exists "profile-files auth upload" on storage.objects;
create policy "profile-files auth upload"
on storage.objects
for insert
with check (
  bucket_id = 'profile-files'
  and auth.role() = 'authenticated'
);


-- Allow owners to update their own profile-files objects
drop policy if exists "profile-files user update" on storage.objects;
create policy "profile-files user update" on storage.objects
  for update
  using (
    bucket_id = 'profile-files'
    and auth.uid() = owner
  );

-- Allow owners to delete their own profile-files objects
drop policy if exists "profile-files user delete" on storage.objects;
create policy "profile-files user delete" on storage.objects
  for delete
  using (
    bucket_id = 'profile-files'
    and auth.uid() = owner
  );

-- Chat Attachments Bucket
insert into storage.buckets (id, name, public)
values ('attached-documents', 'attached-documents', false)
on conflict (id) do nothing;

-- Allow authenticated users to upload to attached-documents
drop policy if exists "attached-documents auth upload" on storage.objects;
create policy "attached-documents auth upload"
on storage.objects
for insert
with check (
  bucket_id = 'attached-documents'
  and auth.role() = 'authenticated'
  -- Optional: Enforce path structure compliance if possible, but basic auth is good start
);

-- Allow participants to view files in their conversations
-- Path structure MUST be: conversation_id/filename
drop policy if exists "attached-documents participant read" on storage.objects;
create policy "attached-documents participant read"
on storage.objects
for select
using (
  bucket_id = 'attached-documents'
  and auth.role() = 'authenticated'
  and (
    -- Check if user is a participant in the conversation defined by the first folder in the path
    exists (
      select 1 
      from public.conversation_participants cp
      where cp.user_id = auth.uid()
      and cp.conversation_id::text = (storage.foldername(name))[1]
    )
  )
);

-- Allow senders to delete their own files within 30 minutes
drop policy if exists "attached-documents sender delete" on storage.objects;
create policy "attached-documents sender delete"
on storage.objects
for delete
using (
  bucket_id = 'attached-documents'
  and auth.uid() = owner
  and created_at > (now() - interval '30 minutes')
);