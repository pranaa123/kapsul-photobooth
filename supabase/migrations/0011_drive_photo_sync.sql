alter table public.photos
  add column if not exists drive_file_id text,
  add column if not exists drive_synced_at timestamptz,
  add column if not exists drive_sync_status text not null default 'pending'
    check (drive_sync_status in ('pending','syncing','synced','failed')),
  add column if not exists drive_sync_attempts integer not null default 0,
  add column if not exists drive_sync_error text;

create index if not exists photos_drive_sync_queue_idx
on public.photos(event_id, drive_sync_status, created_at)
where status = 'uploaded' and drive_file_id is null;

