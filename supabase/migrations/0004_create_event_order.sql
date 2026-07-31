create or replace function public.create_event_order(
  p_package_id uuid,
  p_name text,
  p_slug text,
  p_event_type text,
  p_location text,
  p_estimated_guests integer,
  p_starts_at timestamptz
)
returns table(order_id uuid, event_id uuid, order_number text, public_token text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_package public.packages%rowtype;
  v_order_id uuid := gen_random_uuid();
  v_event_id uuid := gen_random_uuid();
  v_order_number text := 'KPS-' || to_char(now(),'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  v_public_token text := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if char_length(trim(p_name)) < 3 then raise exception 'Event name is too short'; end if;
  if p_estimated_guests < 1 then raise exception 'Estimated guests must be positive'; end if;

  select * into v_package from public.packages where id=p_package_id and is_active=true;
  if not found then raise exception 'Package is not available'; end if;

  insert into public.orders(id,user_id,package_id,order_number,total,payment_status)
  values(v_order_id,v_user_id,p_package_id,v_order_number,v_package.price,'UNPAID');

  insert into public.events(
    id,user_id,order_id,public_token_hash,slug,name,starts_at,upload_ends_at,
    status,max_devices,max_photos,max_photos_per_device,branding
  ) values(
    v_event_id,v_user_id,v_order_id,encode(digest(v_public_token,'sha256'),'hex'),p_slug,
    trim(p_name),p_starts_at,p_starts_at + make_interval(hours=>v_package.active_hours),
    'draft',v_package.max_devices,v_package.max_photos,v_package.max_photos_per_device,
    jsonb_build_object('event_type',p_event_type,'location',p_location,'estimated_guests',p_estimated_guests)
  );

  return query select v_order_id,v_event_id,v_order_number,v_public_token;
end;
$$;

revoke all on function public.create_event_order(uuid,text,text,text,text,integer,timestamptz) from public;
grant execute on function public.create_event_order(uuid,text,text,text,text,integer,timestamptz) to authenticated;
