create table if not exists public.guest_activity (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  device_token_hash text not null,
  activity_type text not null check (activity_type in ('page_view','camera_granted','photo_started','submit_success')),
  created_at timestamptz not null default now(),
  unique(event_id,device_token_hash,activity_type)
);
alter table public.guest_activity enable row level security;
grant select on public.guest_activity to authenticated;
create policy "owners read own guest analytics" on public.guest_activity for select to authenticated using (exists(select 1 from public.events e where e.id=event_id and e.user_id=auth.uid()));

create or replace function public.track_guest_activity(p_slug text,p_token text,p_device_token text,p_activity_type text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_event_id uuid;
begin
  if char_length(p_device_token)<20 or p_activity_type not in ('page_view','camera_granted','photo_started','submit_success') then return; end if;
  select id into v_event_id from public.events where slug=p_slug and public_token_hash=encode(digest(coalesce(p_token,''),'sha256'),'hex');
  if not found then return; end if;
  insert into public.guest_activity(event_id,device_token_hash,activity_type) values(v_event_id,encode(digest(p_device_token,'sha256'),'hex'),p_activity_type) on conflict(event_id,device_token_hash,activity_type) do nothing;
end;$$;

create or replace function public.get_owner_event_analytics(p_event_id uuid)
returns jsonb language sql security definer set search_path = public as $$
  select case when exists(select 1 from public.events e where e.id=p_event_id and e.user_id=auth.uid()) then jsonb_build_object('page_views',count(*) filter(where activity_type='page_view'),'camera_granted',count(*) filter(where activity_type='camera_granted'),'photo_started',count(*) filter(where activity_type='photo_started'),'submit_success',count(*) filter(where activity_type='submit_success')) else null end from public.guest_activity where event_id=p_event_id;
$$;
revoke all on function public.track_guest_activity(text,text,text,text) from public;
revoke all on function public.get_owner_event_analytics(uuid) from public;
grant execute on function public.track_guest_activity(text,text,text,text) to anon,authenticated;
grant execute on function public.get_owner_event_analytics(uuid) to authenticated;
