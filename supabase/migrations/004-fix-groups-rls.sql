-- Allow creator to read group they just created (before they're added to group_members)
create policy "Groups viewable by creator" on public.groups for select to authenticated
  using (created_by in (select id from public.members where user_id = auth.uid()));
