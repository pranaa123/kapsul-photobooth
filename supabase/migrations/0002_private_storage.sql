insert into public.packages (
  name, price, max_devices, max_photos,
  max_photos_per_device, active_hours, retention_days
)
values
  ('Intimate',299000,50,500,10,24,30),
  ('Celebration',599000,150,1500,10,72,60),
  ('Festival',1200000,500,5000,10,168,90)
on conflict (name) do update set
  price = excluded.price,
  max_devices = excluded.max_devices,
  max_photos = excluded.max_photos,
  max_photos_per_device = excluded.max_photos_per_device,
  active_hours = excluded.active_hours,
  retention_days = excluded.retention_days;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-photos',
  'event-photos',
  false,
  15728640,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage paths must start with the event UUID:
-- event-photos/{event_id}/{photo_id}.jpg
create policy "owners read objects from own events"
on storage.objects for select
to authenticated
using (
  bucket_id = 'event-photos'
  and exists (
    select 1
    from public.events e
    where e.id::text = (storage.foldername(name))[1]
      and e.user_id = auth.uid()
  )
);

create policy "owners delete objects from own events"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'event-photos'
  and exists (
    select 1
    from public.events e
    where e.id::text = (storage.foldername(name))[1]
      and e.user_id = auth.uid()
  )
);
