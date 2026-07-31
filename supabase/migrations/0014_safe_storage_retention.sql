alter table public.photos
  add column if not exists storage_delete_after timestamptz,
  add column if not exists storage_deleted_at timestamptz;

create index if not exists photos_storage_cleanup_idx
on public.photos(storage_delete_after)
where storage_deleted_at is null
  and drive_file_id is not null
  and thumbnail_path is not null;

-- Existing photos are only scheduled when both a verified Drive file and a
-- separate thumbnail are present. Older master-only photos remain untouched.
update public.photos
set storage_delete_after = coalesce(drive_synced_at, now()) + interval '7 days'
where drive_file_id is not null
  and thumbnail_path is not null
  and storage_deleted_at is null
  and storage_delete_after is null;

