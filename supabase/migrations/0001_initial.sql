create extension if not exists pgcrypto;

create type public.user_role as enum ('owner','admin');
create type public.event_status as enum ('draft','active','paused','ended');
create type public.photo_status as enum ('reserved','uploaded','deleted');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role public.user_role not null default 'owner',
  created_at timestamptz not null default now()
);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price integer not null check (price >= 0),
  max_devices integer not null check (max_devices > 0),
  max_photos integer not null check (max_photos > 0),
  max_photos_per_device integer not null check (max_photos_per_device > 0),
  active_hours integer not null check (active_hours > 0),
  retention_days integer not null check (retention_days > 0),
  is_active boolean not null default true
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  package_id uuid not null references public.packages(id),
  order_number text not null unique,
  total integer not null,
  payment_status text not null default 'UNPAID'
    check (payment_status in ('UNPAID','PENDING','PAID','EXPIRED','FAILED','REFUNDED')),
  provider_order_id text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  order_id uuid not null unique references public.orders(id),
  public_token_hash text not null unique,
  slug text not null unique,
  name text not null,
  starts_at timestamptz,
  upload_ends_at timestamptz,
  status public.event_status not null default 'draft',
  max_devices integer not null,
  max_photos integer not null,
  max_photos_per_device integer not null,
  photo_count integer not null default 0,
  device_count integer not null default 0,
  branding jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.event_devices (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  device_token_hash text not null,
  photo_count integer not null default 0,
  status text not null default 'active' check (status in ('active','blocked')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique(event_id, device_token_hash)
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  event_device_id uuid not null references public.event_devices(id),
  client_photo_id uuid not null,
  storage_path text not null unique,
  thumbnail_path text,
  file_hash text not null,
  status public.photo_status not null default 'reserved',
  mime_type text,
  byte_size integer,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  unique(event_id,event_device_id,file_hash),
  unique(event_id,event_device_id,client_photo_id)
);

create table public.guest_messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  event_device_id uuid not null references public.event_devices(id),
  guest_name text,
  message text not null check (char_length(message) <= 500),
  created_at timestamptz not null default now()
);

create table public.payment_webhooks (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_event_id text not null,
  payload jsonb not null,
  signature_valid boolean not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(provider, external_event_id)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.events enable row level security;
alter table public.event_devices enable row level security;
alter table public.photos enable row level security;
alter table public.guest_messages enable row level security;

create policy "owners read own profile" on public.profiles for select using (id = auth.uid());
create policy "owners read own orders" on public.orders for select using (user_id = auth.uid());
create policy "owners manage own events" on public.events for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owners read own event devices" on public.event_devices for select using (
  exists(select 1 from public.events e where e.id=event_id and e.user_id=auth.uid())
);
create policy "owners read own photos" on public.photos for select using (
  exists(select 1 from public.events e where e.id=event_id and e.user_id=auth.uid())
);
create policy "owners update own photos" on public.photos for update using (
  exists(select 1 from public.events e where e.id=event_id and e.user_id=auth.uid())
);
create policy "owners read own messages" on public.guest_messages for select using (
  exists(select 1 from public.events e where e.id=event_id and e.user_id=auth.uid())
);

insert into public.packages(name,price,max_devices,max_photos,max_photos_per_device,active_hours,retention_days)
values
('Intimate',299000,50,500,10,24,30),
('Celebration',599000,150,1500,10,72,60),
('Festival',1200000,500,5000,10,168,90);
