begin;
insert into auth.users(id,email) values
 ('00000000-0000-4000-8000-000000000001','bauri-rls-a@example.invalid'),
 ('00000000-0000-4000-8000-000000000002','bauri-rls-b@example.invalid'),
 ('00000000-0000-4000-8000-000000000003','bauri-rls-c@example.invalid');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","is_anonymous":false}',true);
insert into public.bauri_subscriptions values('00000000-0000-4000-8000-000000000001','preview','test-only-zone',true);
insert into public.bauri_alerts(owner_id,local_id,environment,city_key,dog_name,area,last_seen,contact) values('00000000-0000-4000-8000-000000000001','rls-test','preview','test-only-zone','TEST','TEST','TEST','TEST');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated","is_anonymous":false}',true);
do $$begin if exists(select 1 from public.bauri_alerts where local_id='rls-test') then raise exception 'Unsubscribed user can read';end if;end$$;
insert into public.bauri_subscriptions values('00000000-0000-4000-8000-000000000002','preview','test-only-zone',true);
do $$begin if not exists(select 1 from public.bauri_alerts where local_id='rls-test') then raise exception 'Subscriber cannot read';end if;end$$;
do $$begin update public.bauri_alerts set status='found' where local_id='rls-test';if found then raise exception 'Non-owner can modify';end if;end$$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000003","role":"authenticated","is_anonymous":false}',true);
insert into public.bauri_subscriptions values('00000000-0000-4000-8000-000000000003','preview','other-test-zone',true);
do $$begin if exists(select 1 from public.bauri_alerts where local_id='rls-test') then raise exception 'Other zone can read';end if;end$$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","is_anonymous":false}',true);
update public.bauri_alerts set status='found' where local_id='rls-test';
do $$begin if not exists(select 1 from public.bauri_alerts where local_id='rls-test' and status='found' and contact='' and photo_data is null) then raise exception 'Close failed';end if;end$$;
update public.bauri_alerts set status='withdrawn' where local_id='rls-test';
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated","is_anonymous":false}',true);
do $$begin if exists(select 1 from public.bauri_alerts where local_id='rls-test') then raise exception 'Withdrawn visible';end if;end$$;
reset role;
select 'RLS TESTS PASSED: unsubscribed, subscribed, other-zone, non-owner, closure, withdrawal' as result;
rollback;
