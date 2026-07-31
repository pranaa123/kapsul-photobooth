create or replace function public.can_upload_reserved_photo(p_storage_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.photos
    where storage_path = p_storage_path
      and status = 'reserved'
  );
$$;

revoke all on function public.can_upload_reserved_photo(text) from public;
grant execute on function public.can_upload_reserved_photo(text) to anon, authenticated;

drop policy if exists "reserved guest uploads" on storage.objects;
create policy "reserved guest uploads"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'event-photos'
  and public.can_upload_reserved_photo(name)
);
