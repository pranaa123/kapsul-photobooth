-- Mark reserved rows as uploaded when their object really exists.
update public.photos p
set status = 'uploaded'
where p.status = 'reserved'
  and exists (
    select 1 from storage.objects o
    where o.bucket_id = 'event-photos' and o.name = p.storage_path
  );

-- Release old reservations for which no object was ever uploaded.
delete from public.photos p
where p.status = 'reserved'
  and p.created_at < now() - interval '5 minutes'
  and not exists (
    select 1 from storage.objects o
    where o.bucket_id = 'event-photos' and o.name = p.storage_path
  );

-- Recalculate counters after reconciliation.
update public.event_devices d
set photo_count = (
  select count(*) from public.photos p
  where p.event_device_id = d.id and p.status <> 'deleted'
);

update public.events e
set photo_count = (
      select count(*) from public.photos p
      where p.event_id = e.id and p.status <> 'deleted'
    ),
    device_count = (
      select count(*) from public.event_devices d
      where d.event_id = e.id and d.status = 'active'
    );
