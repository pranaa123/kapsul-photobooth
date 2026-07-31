alter table public.events add column if not exists public_token text;

update public.events
set public_token = encode(gen_random_bytes(32), 'hex')
where public_token is null;

update public.events
set public_token_hash = encode(digest(public_token, 'sha256'), 'hex');

alter table public.events alter column public_token set default encode(gen_random_bytes(32), 'hex');
alter table public.events alter column public_token set not null;

create or replace function public.sync_event_public_token()
returns trigger
language plpgsql
security definer set search_path = public, extensions
as $$
begin
  if new.public_token is null then new.public_token := encode(gen_random_bytes(32), 'hex'); end if;
  new.public_token_hash := encode(digest(new.public_token, 'sha256'), 'hex');
  return new;
end;
$$;

drop trigger if exists sync_event_public_token on public.events;
create trigger sync_event_public_token
before insert or update of public_token on public.events
for each row execute procedure public.sync_event_public_token();

create or replace function public.get_public_event(p_slug text, p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_event public.events%rowtype;
begin
  select * into v_event
  from public.events
  where slug = p_slug
    and public_token_hash = encode(digest(coalesce(p_token,''), 'sha256'), 'hex');

  if not found then return null; end if;
  if v_event.status <> 'active' and v_event.user_id <> auth.uid() then return null; end if;

  return jsonb_build_object(
    'id', v_event.id,
    'name', v_event.name,
    'status', v_event.status,
    'starts_at', v_event.starts_at,
    'upload_ends_at', v_event.upload_ends_at,
    'max_photos_per_device', v_event.max_photos_per_device,
    'branding', v_event.branding
  );
end;
$$;

revoke all on function public.get_public_event(text,text) from public;
grant execute on function public.get_public_event(text,text) to anon, authenticated;
