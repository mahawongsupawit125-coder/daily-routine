-- Bootstrap for the new account subsystem. Apply once after inspecting existing objects.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table public.account_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique check (username ~ '^[a-z0-9_]{3,30}$'),
 display_name text not null check (char_length(display_name) between 1 and 80)
);
alter table public.account_profiles enable row level security;
revoke all on public.account_profiles from anon, authenticated;
grant select on public.account_profiles to authenticated;
grant all on public.account_profiles to service_role;
create policy own_profile on public.account_profiles for select to authenticated using ((select auth.uid())=user_id);

create table public.routine_data (
 user_id uuid primary key references auth.users(id) on delete cascade,
 state jsonb not null check(jsonb_typeof(state)='object' and state @> '{"version":1}'::jsonb and octet_length(state::text)<=5000000),
 revision bigint not null default 1 check(revision>0),
 updated_at timestamptz not null default now()
);
alter table public.routine_data enable row level security;
revoke all on public.routine_data from anon, authenticated;
grant select on public.routine_data to authenticated;
grant all on public.routine_data to service_role;
create policy own_routine on public.routine_data for select to authenticated using ((select auth.uid())=user_id);
-- Writes are service-only through the validating Edge Function. Authenticated clients cannot bypass validation.

create table private.account_login_limits (
 bucket_key text primary key check(length(bucket_key)=64),
 window_start timestamptz not null,
 attempts integer not null
);
alter table private.account_login_limits enable row level security;
grant all on private.account_login_limits to service_role;

create function private.account_on_signup() returns trigger language plpgsql security definer set search_path='' as $$
declare username text; display_name text;
begin
 username:=lower(trim(new.raw_user_meta_data->>'username'));
 display_name:=trim(new.raw_user_meta_data->>'display_name');
 if username is null or username !~ '^[a-z0-9_]{3,30}$' or display_name is null or char_length(display_name) not between 1 and 80 then
  raise exception 'Invalid account details';
 end if;
 insert into public.account_profiles(user_id,username,display_name) values(new.id,username,display_name);
 return new;
end;$$;
revoke all on function private.account_on_signup() from public,anon,authenticated;
create trigger account_signup after insert on auth.users for each row execute function private.account_on_signup();

create function private.account_email(p_username text) returns text language sql stable security definer set search_path='' as $$
 select u.email from auth.users u join public.account_profiles p on p.user_id=u.id where p.username=lower(p_username) limit 1;
$$;
revoke all on function private.account_email(text) from public,anon,authenticated;
grant execute on function private.account_email(text) to service_role;
create function public.account_username_email(p_username text) returns text language sql stable security invoker set search_path='' as $$
 select private.account_email(p_username);
$$;
revoke all on function public.account_username_email(text) from public,anon,authenticated;
grant execute on function public.account_username_email(text) to service_role;

create function public.account_login_slot(p_key text) returns boolean language plpgsql security invoker set search_path='' as $$
declare current_attempts integer;
begin
 delete from private.account_login_limits where window_start<now()-interval '1 day';
 insert into private.account_login_limits(bucket_key,window_start,attempts) values(p_key,now(),1)
 on conflict(bucket_key) do update set
 attempts=case when account_login_limits.window_start<now()-interval '10 minutes' then 1 else account_login_limits.attempts+1 end,
 window_start=case when account_login_limits.window_start<now()-interval '10 minutes' then now() else account_login_limits.window_start end
 returning attempts into current_attempts;
 return current_attempts<=15;
end;$$;
revoke all on function public.account_login_slot(text) from public,anon,authenticated;
grant execute on function public.account_login_slot(text) to service_role;

create function public.account_load(p_user uuid) returns table(state jsonb,revision bigint) language sql stable security invoker set search_path='' as $$
 select r.state,r.revision from public.routine_data r where r.user_id=p_user;
$$;
revoke all on function public.account_load(uuid) from public,anon,authenticated;
grant execute on function public.account_load(uuid) to service_role;

create function public.account_save(p_user uuid,p_state jsonb,p_revision bigint) returns bigint language plpgsql security invoker set search_path='' as $$
declare next_revision bigint;
begin
 if p_revision<0 then raise exception 'Invalid revision';end if;
 if p_revision=0 then
  insert into public.routine_data(user_id,state,revision) values(p_user,p_state,1)
   on conflict(user_id) do nothing returning revision into next_revision;
 else
  update public.routine_data set state=p_state,revision=revision+1,updated_at=now()
   where user_id=p_user and revision=p_revision returning revision into next_revision;
 end if;
 return next_revision;
end;$$;
revoke all on function public.account_save(uuid,jsonb,bigint) from public,anon,authenticated;
grant execute on function public.account_save(uuid,jsonb,bigint) to service_role;
commit;

