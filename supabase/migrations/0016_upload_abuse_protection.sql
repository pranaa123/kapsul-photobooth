-- Validasi payload, jeda singkat antarpemesanan, dan pembersihan reservasi
-- terbengkalai. Batas produk (10 foto/perangkat/acara) tetap menjadi lapisan utama.
create or replace function public.reserve_guest_uploads(p_slug text,p_token text,p_device_token text,p_photos jsonb)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare
  v_event public.events%rowtype; v_device public.event_devices%rowtype;
  v_requested integer:=case when jsonb_typeof(p_photos)='array' then jsonb_array_length(p_photos) else 0 end;
  v_item jsonb; v_photo_id uuid; v_master_path text; v_thumbnail_path text; v_paths jsonb:='[]'::jsonb;
begin
  if v_requested<1 or v_requested>10 then raise exception 'Invalid photo batch'; end if;
  if char_length(p_device_token)<20 or char_length(p_device_token)>200 then raise exception 'Invalid device token'; end if;
  for v_item in select value from jsonb_array_elements(p_photos) loop
    if coalesce(v_item->>'clientPhotoId','')!~*'^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      or coalesce(v_item->>'fileHash','')!~'^[0-9a-f]{64}$'
      or coalesce((v_item->>'byteSize')::integer,0) not between 1000 and 10485760 then raise exception 'Invalid photo metadata'; end if;
  end loop;
  select * into v_event from public.events where slug=p_slug and public_token_hash=encode(digest(coalesce(p_token,''),'sha256'),'hex') for update;
  if not found then raise exception 'Event not found'; end if;
  if v_event.status<>'active' then raise exception 'Event is not active'; end if;
  if v_event.upload_ends_at is not null and now()>v_event.upload_ends_at then raise exception 'Upload period has ended'; end if;
  select * into v_device from public.event_devices where event_id=v_event.id and device_token_hash=encode(digest(p_device_token,'sha256'),'hex') for update;
  if not found then
    if v_event.device_count>=v_event.max_devices then raise exception 'Device limit reached'; end if;
    insert into public.event_devices(event_id,device_token_hash) values(v_event.id,encode(digest(p_device_token,'sha256'),'hex')) returning * into v_device;
    update public.events set device_count=device_count+1 where id=v_event.id;
  elsif v_device.last_seen_at>now()-interval '2 seconds' then raise exception 'Please wait before retrying';
  end if;
  if v_device.status<>'active' then raise exception 'Device is blocked'; end if;
  if v_device.photo_count+v_requested>v_event.max_photos_per_device then raise exception 'Device photo limit reached'; end if;
  if v_event.photo_count+v_requested>v_event.max_photos then raise exception 'Event photo limit reached'; end if;
  for v_item in select value from jsonb_array_elements(p_photos) loop
    v_photo_id:=gen_random_uuid();v_master_path:=v_event.id::text||'/'||v_photo_id::text||'.jpg';v_thumbnail_path:=v_event.id::text||'/'||v_photo_id::text||'-thumb.webp';
    insert into public.photos(id,event_id,event_device_id,client_photo_id,storage_path,thumbnail_path,file_hash,mime_type,byte_size)
    values(v_photo_id,v_event.id,v_device.id,(v_item->>'clientPhotoId')::uuid,v_master_path,v_thumbnail_path,v_item->>'fileHash','image/jpeg',(v_item->>'byteSize')::integer);
    v_paths:=v_paths||jsonb_build_array(jsonb_build_object('photoId',v_photo_id,'clientPhotoId',v_item->>'clientPhotoId','storagePath',v_master_path,'thumbnailStoragePath',v_thumbnail_path));
  end loop;
  update public.event_devices set photo_count=photo_count+v_requested,last_seen_at=now() where id=v_device.id;
  update public.events set photo_count=photo_count+v_requested where id=v_event.id;
  return jsonb_build_object('eventId',v_event.id,'deviceId',v_device.id,'uploads',v_paths);
end;$$;
revoke all on function public.reserve_guest_uploads(text,text,text,jsonb) from public;
grant execute on function public.reserve_guest_uploads(text,text,text,jsonb) to anon,authenticated;

create or replace function public.complete_guest_submission(p_slug text,p_token text,p_device_token text,p_photo_ids uuid[],p_guest_name text default null,p_message text default null)
returns void language plpgsql security definer set search_path=public,extensions as $$
declare v_event_id uuid;v_device_id uuid;v_completed integer:=0;
begin
  if coalesce(array_length(p_photo_ids,1),0)<1 or array_length(p_photo_ids,1)>10 then raise exception 'Invalid photo batch'; end if;
  select id into v_event_id from public.events where slug=p_slug and public_token_hash=encode(digest(coalesce(p_token,''),'sha256'),'hex');if not found then raise exception 'Event not found';end if;
  select id into v_device_id from public.event_devices where event_id=v_event_id and device_token_hash=encode(digest(p_device_token,'sha256'),'hex');if not found then raise exception 'Device not found';end if;
  update public.photos set status='uploaded' where event_id=v_event_id and event_device_id=v_device_id and id=any(p_photo_ids) and status='reserved';get diagnostics v_completed=row_count;
  if v_completed>0 and nullif(trim(coalesce(p_message,'')),'') is not null then insert into public.guest_messages(event_id,event_device_id,guest_name,message) values(v_event_id,v_device_id,nullif(left(trim(coalesce(p_guest_name,'')),80),''),left(trim(p_message),500));end if;
end;$$;
revoke all on function public.complete_guest_submission(text,text,text,uuid[],text,text) from public;
grant execute on function public.complete_guest_submission(text,text,text,uuid[],text,text) to anon,authenticated;

create or replace function public.release_abandoned_uploads(p_photo_ids uuid[])
returns integer language plpgsql security definer set search_path=public as $$
declare v_count integer;
begin
  with removed as(delete from public.photos where id=any(p_photo_ids) and status='reserved' and created_at<now()-interval '2 hours' returning event_id,event_device_id),
  event_totals as(select event_id,count(*)::integer qty from removed group by event_id),device_totals as(select event_device_id,count(*)::integer qty from removed group by event_device_id),
  update_events as(update public.events e set photo_count=greatest(0,e.photo_count-t.qty) from event_totals t where e.id=t.event_id),
  update_devices as(update public.event_devices d set photo_count=greatest(0,d.photo_count-t.qty) from device_totals t where d.id=t.event_device_id)
  select coalesce(sum(qty),0)::integer into v_count from event_totals;
  return v_count;
end;$$;
revoke all on function public.release_abandoned_uploads(uuid[]) from public,anon,authenticated;
grant execute on function public.release_abandoned_uploads(uuid[]) to service_role;
