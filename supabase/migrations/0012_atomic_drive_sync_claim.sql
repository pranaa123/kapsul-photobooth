alter table public.photos add column if not exists drive_sync_started_at timestamptz;

create or replace function public.claim_drive_sync_photos(
  p_event_id uuid,
  p_limit integer default 6
)
returns table(
  id uuid,
  storage_path text,
  mime_type text,
  created_at timestamptz,
  drive_sync_attempts integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- A crashed worker may leave a row in syncing. Release that lease after 10 minutes.
  update public.photos
  set drive_sync_status = 'failed',
      drive_sync_error = 'Sinkronisasi sebelumnya terputus; dijadwalkan ulang'
  where event_id = p_event_id
    and drive_sync_status = 'syncing'
    and drive_file_id is null
    and drive_sync_started_at < now() - interval '10 minutes';

  return query
  with claimed as (
    select p.id
    from public.photos p
    where p.event_id = p_event_id
      and p.status = 'uploaded'
      and p.drive_file_id is null
      and p.drive_sync_status in ('pending','failed')
    order by p.created_at asc
    for update skip locked
    limit greatest(1, least(p_limit, 10))
  ), updated as (
    update public.photos p
    set drive_sync_status = 'syncing',
        drive_sync_attempts = p.drive_sync_attempts + 1,
        drive_sync_started_at = now(),
        drive_sync_error = null
    from claimed
    where p.id = claimed.id
    returning p.id,p.storage_path,p.mime_type,p.created_at,p.drive_sync_attempts
  )
  select * from updated;
end;
$$;

revoke all on function public.claim_drive_sync_photos(uuid,integer) from public;
