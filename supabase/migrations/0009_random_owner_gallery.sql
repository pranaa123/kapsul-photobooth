create or replace function public.get_random_owner_photos(
  p_event_id uuid,
  p_limit integer default 6
)
returns table(id uuid, storage_path text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select p.id, p.storage_path, p.created_at
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
