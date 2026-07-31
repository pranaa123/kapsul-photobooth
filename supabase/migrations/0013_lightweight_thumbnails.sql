create or replace function public.reserve_guest_uploads(
  p_slug text,
  p_token text,
  p_device_token text,
  p_photos jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_event public.events%rowtype;
  v_device public.event_devices%rowtype;
  v_requested integer := jsonb_array_length(p_photos);
  v_item jsonb;
  v_photo_id uuid;
  v_master_path text;
  v_thumbnail_path text;
  v_paths jsonb := '[]'::jsonb;
begin
  if v_requested < 1 then raise exception 'No photos supplied'; end if;
  if char_length(p_device_token) < 20 then raise exception 'Invalid device token'; end if;

  select * into v_event from public.events
  where slug = p_slug
    and public_token_hash = encode(digest(coalesce(p_token,''), 'sha256'), 'hex')
  for update;

  if not found then raise exception 'Event not found'; end if;
  if v_event.status <> 'active' then raise exception 'Event is not active'; end if;
  if v_event.upload_ends_at is not null and now() > v_event.upload_ends_at then raise exception 'Upload period has ended'; end if;

  select * into v_device from public.event_devices
  where event_id = v_event.id
    and device_token_hash = encode(digest(p_device_token, 'sha256'), 'hex')
  for update;

  if not found then
    if v_event.device_count >= v_event.max_devices then raise exception 'Device limit reached'; end if;
    insert into public.event_devices(event_id,device_token_hash)
    values(v_event.id,encode(digest(p_device_token,'sha256'),'hex')) returning * into v_device;
    update public.events set device_count=device_count+1 where id=v_event.id;
  end if;

  if v_device.status <> 'active' then raise exception 'Device is blocked'; end if;
  if v_device.photo_count + v_requested > v_event.max_photos_per_device then raise exception 'Device photo limit reached'; end if;
  if v_event.photo_count + v_requested > v_event.max_photos then raise exception 'Event photo limit reached'; end if;

  for v_item in select value from jsonb_array_elements(p_photos)
  loop
    v_photo_id := gen_random_uuid();
    v_master_path := v_event.id::text||'/'||v_photo_id::text||'.jpg';
    v_thumbnail_path := v_event.id::text||'/'||v_photo_id::text||'-thumb.webp';
    insert into public.photos(id,event_id,event_device_id,client_photo_id,storage_path,thumbnail_path,file_hash,mime_type,byte_size)
    values(v_photo_id,v_event.id,v_device.id,(v_item->>'clientPhotoId')::uuid,v_master_path,v_thumbnail_path,v_item->>'fileHash','image/jpeg',(v_item->>'byteSize')::integer);
    v_paths := v_paths || jsonb_build_array(jsonb_build_object(
      'photoId',v_photo_id,'clientPhotoId',v_item->>'clientPhotoId','storagePath',v_master_path,'thumbnailStoragePath',v_thumbnail_path
    ));
  end loop;

  update public.event_devices set photo_count=photo_count+v_requested,last_seen_at=now() where id=v_device.id;
  update public.events set photo_count=photo_count+v_requested where id=v_event.id;
  return jsonb_build_object('eventId',v_event.id,'deviceId',v_device.id,'uploads',v_paths);
end;
$$;

revoke all on function public.reserve_guest_uploads(text,text,text,jsonb) from public;
grant execute on function public.reserve_guest_uploads(text,text,text,jsonb) to anon, authenticated;

drop policy if exists "reserved guest uploads" on storage.objects;
create policy "reserved guest uploads"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id='event-photos'
  and exists(
    select 1 from public.photos p
    where p.status='reserved'
      and (p.storage_path=name or p.thumbnail_path=name)
  )
);

drop function if exists public.get_random_owner_photos(uuid,integer);

create function public.get_random_owner_photos(
  p_event_id uuid,
  p_limit integer default 6
)
returns table(id uuid, storage_path text, thumbnail_path text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select p.id, p.storage_path, p.thumbnail_path, p.created_at
  from public.photos p
  join public.events e on e.id = p.event_id
  where p.event_id = p_event_id
    and e.user_id = auth.uid()
    and p.status <> 'deleted'
  order by random()
  limit least(greatest(p_limit, 1), 12);
$$;

revoke all on function public.get_random_owner_photos(uuid,integer) from public;
grant execute on function public.get_random_owner_photos(uuid,integer) to authenticated;
