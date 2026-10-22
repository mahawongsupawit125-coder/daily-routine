-- Run as the SQL Editor administrator after schema.sql. All fixture rows roll back.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
('7152b1b0-55f1-4b01-9001-f01010000001','db-test-a@invalid.example','{"username":"db_test_a_7152","display_name":"DB Test A"}'),
('7152b1b0-55f1-4b01-9001-f01010000002','db-test-b@invalid.example','{"username":"db_test_b_7152","display_name":"DB Test B"}');
set local role service_role;
do $$ declare i integer; allowed boolean; begin
 for i in 1..16 loop
  allowed:=public.account_login_slot(repeat('d',64));
  if allowed is distinct from (i<=15) then raise exception 'rate limiter failed at %',i;end if;
 end loop;
 if public.account_save('7152b1b0-55f1-4b01-9001-f01010000001','{"version":1,"marker":"A"}',0) is distinct from 1 then raise exception 'initial insert failed';end if;
 if public.account_save('7152b1b0-55f1-4b01-9001-f01010000002','{"version":1,"marker":"B"}',0) is distinct from 1 then raise exception 'second insert failed';end if;
 if public.account_save('7152b1b0-55f1-4b01-9001-f01010000001','{"version":1,"marker":"bad"}',0) is not null then raise exception 'duplicate revision accepted';end if;
 if public.account_save('7152b1b0-55f1-4b01-9001-f01010000001','{"version":1,"marker":"A2"}',1) is distinct from 2 then raise exception 'revision increment failed';end if;
 if public.account_save('7152b1b0-55f1-4b01-9001-f01010000001','{"version":1,"marker":"bad"}',1) is not null then raise exception 'stale revision accepted';end if;
 if private.account_email('db_test_a_7152') is distinct from 'db-test-a@invalid.example' then raise exception 'username lookup failed';end if;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','7152b1b0-55f1-4b01-9001-f01010000001',true);
do $$ begin
 if (select count(*) from public.routine_data)<>1 then raise exception 'RLS account A row count failed';end if;
 if (select count(*) from public.routine_data where user_id='7152b1b0-55f1-4b01-9001-f01010000002')<>0 then raise exception 'account B data visible to A';end if;
 if (select state->>'marker' from public.routine_data) is distinct from 'A2' then raise exception 'wrong owner data';end if;
 if (select count(*) from public.account_profiles)<>1 then raise exception 'profile RLS failed';end if;
 if has_table_privilege(current_user,'public.routine_data','INSERT,UPDATE,DELETE') then raise exception 'direct write allowed';end if;
 if has_function_privilege(current_user,'public.account_save(uuid,jsonb,bigint)','EXECUTE') then raise exception 'service write RPC exposed';end if;
 if has_function_privilege(current_user,'public.account_username_email(text)','EXECUTE') then raise exception 'email lookup exposed';end if;
end $$;
select set_config('request.jwt.claim.sub','7152b1b0-55f1-4b01-9001-f01010000002',true);
do $$ begin
 if (select count(*) from public.routine_data)<>1 then raise exception 'RLS account B row count failed';end if;
 if (select state->>'marker' from public.routine_data) is distinct from 'B' then raise exception 'account A data visible to B';end if;
end $$;
reset role;
set local role anon;
do $$ begin
 if has_table_privilege(current_user,'public.routine_data','SELECT,INSERT,UPDATE,DELETE') then raise exception 'anonymous routine access';end if;
 if has_table_privilege(current_user,'public.account_profiles','SELECT') then raise exception 'anonymous profile access';end if;
 if has_function_privilege(current_user,'public.account_load(uuid)','EXECUTE') then raise exception 'anonymous load RPC access';end if;
end $$;
reset role;
rollback;
select 'PASS: service-role functions and rate limiting, A/B isolation, profile RLS, anonymous denial, service-only writes, username lookup, stale-revision protection; test rows rolled back' as database_checks;
