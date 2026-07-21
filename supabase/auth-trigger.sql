-- ============================================
-- react.tech — Auth Trigger Addendum
-- Run this once, AFTER schema.sql, in Supabase SQL Editor
-- Automatically creates a profiles (+ commenter_profiles) row whenever
-- someone signs up through the /signup page (Supabase Auth).
-- ============================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_role user_role;
begin
  v_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'commenter');

  insert into public.profiles (id, role, full_name)
  values (new.id, v_role, new.raw_user_meta_data->>'full_name');

  if v_role = 'commenter' then
    insert into public.commenter_profiles (id) values (new.id);
  end if;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();
