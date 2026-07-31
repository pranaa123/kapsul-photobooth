create table if not exists public.event_drive_connections (
  event_id uuid primary key references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'google_drive' check (provider = 'google_drive'),
  account_email text,
  refresh_token_encrypted text not null,
  folder_id text not null,
  folder_name text not null,
  status text not null default 'connected' check (status in ('connected','error','disconnected')),
  last_error text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

alter table public.event_drive_connections enable row level security;
grant select, delete on public.event_drive_connections to authenticated;

create policy "owners read own drive connections"
on public.event_drive_connections for select to authenticated
using (user_id = auth.uid());

create policy "owners remove own drive connections"
on public.event_drive_connections for delete to authenticated
using (user_id = auth.uid());
