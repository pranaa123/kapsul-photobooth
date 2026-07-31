alter table public.packages enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.packages to anon, authenticated;

drop policy if exists "anyone reads active packages" on public.packages;
create policy "anyone reads active packages"
on public.packages for select
to anon, authenticated
using (is_active = true);

grant select, update on public.profiles to authenticated;
grant select on public.orders to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select on public.event_devices to authenticated;
grant select, update on public.photos to authenticated;
grant select on public.guest_messages to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
