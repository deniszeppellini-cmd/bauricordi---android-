create table public.bauri_subscriptions (
 user_id uuid not null references auth.users(id) on delete cascade,
 environment text not null check(environment in ('preview','live')),
 city_key text not null check(length(city_key) between 2 and 80),
 enabled boolean not null default true,
 primary key(user_id,environment)
);
alter table public.bauri_subscriptions enable row level security;
revoke all on public.bauri_subscriptions from anon,authenticated;
grant select,insert,update,delete on public.bauri_subscriptions to authenticated;
create policy "Own community subscription" on public.bauri_subscriptions for all to authenticated
 using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false');
create index bauri_subscriptions_zone on public.bauri_subscriptions(environment,city_key) where enabled;

create table public.bauri_alerts (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 local_id text not null check(length(local_id) between 1 and 80),
 environment text not null check(environment in ('preview','live')),
 city_key text not null check(length(city_key) between 2 and 80),
 dog_name text not null check(length(dog_name) between 1 and 80),
 breed text not null default '' check(length(breed)<=160),
 area text not null check(length(area) between 1 and 160),
 last_seen text not null check(length(last_seen) between 1 and 160),
 contact text not null check(length(contact)<=160),
 description text not null default '' check(length(description)<=2000),
 photo_data text check(photo_data is null or (length(photo_data)<=220000 and photo_data like 'data:image/jpeg;base64,%')),
 status text not null default 'missing' check(status in ('missing','found','withdrawn')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '14 days',
 unique(owner_id,local_id)
);
alter table public.bauri_alerts enable row level security;
revoke all on public.bauri_alerts from anon,authenticated;
grant select on public.bauri_alerts to authenticated;
grant insert(owner_id,local_id,environment,city_key,dog_name,breed,area,last_seen,contact,description,photo_data) on public.bauri_alerts to authenticated;
grant update(status) on public.bauri_alerts to authenticated;
create policy "Owners and subscribed zone members" on public.bauri_alerts for select to authenticated using(
 owner_id=(select auth.uid()) or
 (status in ('missing','found') and expires_at>now() and exists(select 1 from public.bauri_subscriptions s where s.user_id=(select auth.uid()) and s.enabled and s.environment=bauri_alerts.environment and s.city_key=bauri_alerts.city_key))
);
create policy "Publish own announcement in subscribed zone" on public.bauri_alerts for insert to authenticated with check(
 owner_id=(select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false' and
 exists(select 1 from public.bauri_subscriptions s where s.user_id=(select auth.uid()) and s.enabled and s.environment=bauri_alerts.environment and s.city_key=bauri_alerts.city_key)
);
create policy "Only owner closes announcement" on public.bauri_alerts for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()) and status in ('found','withdrawn'));
create index bauri_alerts_owner on public.bauri_alerts(owner_id,created_at desc);
create index bauri_alerts_zone on public.bauri_alerts(environment,city_key,created_at desc) where status in ('missing','found');
create function public.bauri_alert_guard() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if TG_OP='INSERT' then
  perform pg_advisory_xact_lock(hashtext(new.owner_id::text));
  if (select count(*) from public.bauri_alerts where owner_id=new.owner_id and created_at>now()-interval '24 hours')>=3 then raise exception 'Massimo tre annunci ogni 24 ore.'; end if;
  new.created_at=now();new.updated_at=now();new.expires_at=now()+interval '14 days';new.status='missing';
 else
  if old.status='withdrawn' then raise exception 'Annuncio già ritirato.'; end if;
  new.updated_at=now();new.contact='';new.photo_data=null;new.description='';
  new.expires_at=case when new.status='found' then least(old.expires_at,now()+interval '1 day') else now() end;
 end if;
 return new;
end $$;
revoke all on function public.bauri_alert_guard() from public,anon,authenticated;
create trigger bauri_alert_guard before insert or update on public.bauri_alerts for each row execute function public.bauri_alert_guard();
alter publication supabase_realtime add table public.bauri_alerts;
create extension if not exists pg_cron;
select cron.schedule('bauricordi-alert-retention','21 * * * *',
 $$delete from public.bauri_alerts where expires_at<now();$$);
