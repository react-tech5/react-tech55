-- ============================================
-- react.tech — Full Database Schema (Consolidated)
-- Run this single file once in Supabase SQL Editor
-- Currency: USD | Points: 1 USD = 100 points
-- ============================================

create type user_role as enum ('admin', 'company', 'commenter');
create type sub_status as enum ('active', 'expired', 'suspended', 'cancelled');
create type task_status as enum ('pending', 'assigned', 'submitted', 'approved', 'disputed', 'rejected');
create type withdrawal_status as enum ('pending', 'approved', 'rejected', 'paid');
create type tx_type as enum ('subscription_payment', 'task_commission', 'withdrawal', 'points_deduction', 'points_reset', 'refund');
create type fee_type as enum ('withdrawal_fee', 'speed_fee', 'custom_word_fee', 'platform_share', 'upgrade_fee');
create type notification_type as enum (
  'task_approved', 'task_rejected', 'dispute_opened', 'dispute_resolved',
  'withdrawal_ready', 'subscription_expiring', 'subscription_expired',
  'package_upgraded', 'account_suspended', 'referral_bonus'
);
create type staff_role as enum ('super_admin', 'reviewer', 'support');

-- ============================================
-- 1) Core tables
-- ============================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  full_name text,
  phone text,
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table company_packages (
  id serial primary key,
  name text not null,
  price numeric(10,2) not null,
  comments_included int not null,
  points_included int not null
);
insert into company_packages (name, price, comments_included, points_included) values
('Starter', 149, 100, 10000),
('Growth', 370, 300, 30000),
('Pro', 730, 600, 60000);

create table commenter_packages (
  id serial primary key,
  name text not null,
  price numeric(10,2) not null,
  commission_per_task numeric(10,2) not null
);
insert into commenter_packages (name, price, commission_per_task) values
('Starter', 19, 0.20),
('Pro', 35, 0.40),
('Elite', 69, 0.60);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  role user_role not null,
  package_id int not null,
  points_balance int default 0,
  comments_remaining int,
  status sub_status default 'active',
  auto_renew boolean default true,
  start_date timestamptz default now(),
  end_date timestamptz not null,
  created_at timestamptz default now()
);
create index idx_subscriptions_user on subscriptions(user_id);
create index idx_subscriptions_status on subscriptions(status, end_date);

create table commenter_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  reliability_score numeric(5,2) default 100.00,
  wallet_balance numeric(10,2) default 0,
  total_earned numeric(10,2) default 0,
  tasks_completed int default 0,
  tasks_rejected int default 0,
  status text default 'active'
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references profiles(id) on delete cascade,
  platform text not null,               -- 'twitter' | 'instagram' | 'tiktok'
  target_url text not null,
  instructions text,
  points_cost int not null,
  is_fast_delivery boolean default false,
  has_custom_keywords boolean default false,
  custom_keywords text,
  extra_fees_points int default 0,
  status task_status default 'pending',
  assigned_commenter_id uuid references profiles(id),
  sla_hours int default 48,
  deadline timestamptz,
  created_at timestamptz default now()
);
create index idx_tasks_company on tasks(company_id, status);
create index idx_tasks_commenter on tasks(assigned_commenter_id, status);

create table task_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  commenter_id uuid references profiles(id),
  proof_url text not null,
  screenshot_url text not null,
  file_hash text,                 -- exact SHA-256 duplicate check
  phash text,                     -- perceptual hash for near-duplicate check
  is_flagged_duplicate boolean default false,
  review_status text default 'pending',
  reviewed_at timestamptz,
  reviewer_note text,
  submitted_at timestamptz default now()
);
create index idx_submissions_file_hash on task_submissions(file_hash);

create table disputes (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  raised_by uuid references profiles(id),
  reason text not null,
  status text default 'open',
  admin_note text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type tx_type not null,
  fee_type fee_type,
  amount numeric(10,2) not null,
  points int,
  reference_id uuid,
  note text,
  created_at timestamptz default now()
);
create index idx_transactions_user on transactions(user_id, created_at desc);

create table withdrawals (
  id uuid primary key default gen_random_uuid(),
  commenter_id uuid references profiles(id) on delete cascade,
  amount numeric(10,2) not null,
  status withdrawal_status default 'pending',
  method text,
  requested_at timestamptz default now(),
  processed_at timestamptz
);

create table reliability_log (
  id uuid primary key default gen_random_uuid(),
  commenter_id uuid references profiles(id) on delete cascade,
  task_id uuid references tasks(id),
  score_change numeric(5,2) not null,
  reason text,
  created_at timestamptz default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  is_read boolean default false,
  reference_id uuid,
  created_at timestamptz default now()
);
create index idx_notifications_user on notifications(user_id, is_read, created_at desc);

create table referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid references profiles(id) on delete cascade,
  referred_id uuid references profiles(id) on delete cascade unique,
  bonus_paid boolean default false,
  bonus_amount numeric(10,2) default 5.00,
  created_at timestamptz default now()
);

create table company_ratings (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade unique,
  company_id uuid references profiles(id) on delete cascade,
  commenter_id uuid references profiles(id) on delete cascade,
  clarity_score int check (clarity_score between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

create table company_task_reports (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade unique,
  company_id uuid references profiles(id) on delete cascade,
  status text not null check (status in ('completed', 'rejected')),
  admin_note text,
  reported_at timestamptz default now(),
  reported_by uuid references profiles(id)
);

create table admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references profiles(id),
  action text not null,
  target_table text,
  target_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

create table staff_members (
  id uuid primary key references profiles(id) on delete cascade,
  staff_role staff_role not null default 'reviewer',
  can_approve_tasks boolean default true,
  can_manage_finance boolean default false,
  can_suspend_accounts boolean default false,
  created_at timestamptz default now()
);

create table comment_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references profiles(id) on delete cascade,
  template_text text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ============================================
-- 2) Helper functions
-- ============================================
create or replace function is_admin()
returns boolean language sql stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function is_super_admin()
returns boolean language sql stable as $$
  select exists (select 1 from staff_members where id = auth.uid() and staff_role = 'super_admin')
    or is_admin();
$$;

create or replace function notify(p_user uuid, p_type notification_type, p_title text, p_body text, p_ref uuid default null)
returns void language plpgsql as $$
begin
  insert into notifications (user_id, type, title, body, reference_id)
  values (p_user, p_type, p_title, p_body, p_ref);
end $$;

create or replace function log_admin_action(p_action text, p_table text, p_target uuid, p_details jsonb default '{}')
returns void language plpgsql security definer as $$
begin
  insert into admin_audit_log (admin_id, action, target_table, target_id, details)
  values (auth.uid(), p_action, p_table, p_target, p_details);
end $$;

-- ============================================
-- 3) Task creation (deducts points, adds optional extra fees)
-- Task cost is fixed at 100 points ($1.00) per comment
-- ============================================
create or replace function create_task(
  p_company uuid, p_url text, p_platform text,
  p_fast boolean default false,
  p_keywords text default null
) returns uuid language plpgsql security definer as $$
declare
  v_sub subscriptions%rowtype;
  v_extra int := 0;
  v_total int;
  v_task_id uuid;
begin
  if p_fast then v_extra := v_extra + 50; end if;                -- $0.50
  if p_keywords is not null then v_extra := v_extra + 30; end if; -- $0.30
  v_total := 100 + v_extra;

  select * into v_sub from subscriptions
  where user_id = p_company and status = 'active' and end_date > now()
  for update;

  if not found or v_sub.points_balance < v_total then
    raise exception 'Insufficient balance (% points required)', v_total;
  end if;

  update subscriptions
  set points_balance = points_balance - v_total,
      comments_remaining = comments_remaining - 1
  where id = v_sub.id;

  insert into tasks (company_id, platform, target_url, points_cost,
                     is_fast_delivery, has_custom_keywords, custom_keywords, extra_fees_points)
  values (p_company, p_platform, p_url, 100, p_fast, p_keywords is not null, p_keywords, v_extra)
  returning id into v_task_id;

  insert into transactions (user_id, type, amount, points, reference_id)
  values (p_company, 'points_deduction', 1.00, 100, v_task_id);

  if p_fast then
    insert into transactions (user_id, type, fee_type, amount, points, reference_id, note)
    values (p_company, 'points_deduction', 'speed_fee', 0.50, 50, v_task_id, 'Fast delivery fee');
  end if;
  if p_keywords is not null then
    insert into transactions (user_id, type, fee_type, amount, points, reference_id, note)
    values (p_company, 'points_deduction', 'custom_word_fee', 0.30, 30, v_task_id, 'Custom keywords fee');
  end if;

  return v_task_id;
end $$;

-- ============================================
-- 4) Auto-assign task to best available commenter
-- ============================================
create or replace function auto_assign_task(p_task_id uuid)
returns uuid language plpgsql security definer as $$
declare
  v_commenter uuid;
begin
  select cp.id into v_commenter
  from commenter_profiles cp
  join profiles p on p.id = cp.id and p.is_active = true
  join subscriptions s on s.user_id = cp.id and s.status = 'active' and s.end_date > now()
  where cp.status = 'active' and cp.reliability_score >= 70
    and not exists (
      select 1 from tasks t where t.assigned_commenter_id = cp.id and t.status in ('assigned','submitted')
    )
  order by cp.reliability_score desc, s.package_id desc, cp.tasks_completed asc
  limit 1;

  if v_commenter is null then
    raise exception 'No eligible commenter available right now';
  end if;

  update tasks set status = 'assigned', assigned_commenter_id = v_commenter where id = p_task_id;

  perform notify(v_commenter, 'task_approved', 'New task assigned to you', 'A new task has been auto-assigned to you', p_task_id);

  return v_commenter;
end $$;

-- Auto-set SLA deadline based on company package tier
create or replace function set_task_sla()
returns trigger language plpgsql as $$
declare
  v_package_name text;
begin
  select cpk.name into v_package_name
  from subscriptions s join company_packages cpk on cpk.id = s.package_id
  where s.user_id = new.company_id and s.role = 'company' and s.status = 'active';

  new.sla_hours := case v_package_name
    when 'Pro' then 6
    when 'Growth' then 24
    else 48
  end;
  new.deadline := now() + (new.sla_hours || ' hours')::interval;
  return new;
end $$;

create trigger trg_set_task_sla before insert on tasks
for each row execute function set_task_sla();

-- ============================================
-- 5) Proof submission with URL-format validation + duplicate-image detection
-- ============================================
create or replace function validate_proof_url(p_platform text, p_proof_url text, p_target_url text)
returns boolean language plpgsql as $$
declare
  v_proof_id text;
  v_target_id text;
begin
  if p_platform = 'twitter' or p_platform = 'x' then
    if p_proof_url !~ '(twitter\.com|x\.com)\/[A-Za-z0-9_]+\/status\/[0-9]+' then
      raise exception 'Invalid proof link — must be a direct reply (status) link on Twitter/X';
    end if;
    v_proof_id := substring(p_proof_url from 'status\/([0-9]+)');
    v_target_id := substring(p_target_url from 'status\/([0-9]+)');
    if v_proof_id = v_target_id then
      raise exception 'This is the original post link, not an independent reply';
    end if;

  elsif p_platform = 'instagram' then
    if p_proof_url !~ 'instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+' then
      raise exception 'Invalid link — must be a valid Instagram post link';
    end if;
    -- Note: Instagram provides no standalone comment link; the screenshot is the real proof

  elsif p_platform = 'tiktok' then
    if p_proof_url !~ 'tiktok\.com\/@[A-Za-z0-9_.]+\/video\/[0-9]+' and p_proof_url !~ 'vm\.tiktok\.com\/' then
      raise exception 'Invalid link — must be a valid TikTok video link';
    end if;
    -- Note: TikTok also provides no standalone comment link

  else
    raise exception 'Unsupported platform';
  end if;

  return true;
end $$;

create or replace function submit_task_proof(
  p_task_id uuid,
  p_proof_url text,
  p_screenshot_url text,
  p_file_hash text,
  p_phash text
) returns uuid language plpgsql security definer as $$
declare
  v_commenter uuid := auth.uid();
  v_platform text;
  v_target_url text;
  v_exact_dup boolean;
  v_near_dup boolean;
  v_submission_id uuid;
  v_admin uuid;
begin
  select platform, target_url into v_platform, v_target_url
  from tasks where id = p_task_id and assigned_commenter_id = v_commenter;

  if not found then
    raise exception 'This task is not assigned to you';
  end if;

  perform validate_proof_url(v_platform, p_proof_url, v_target_url);

  select exists (select 1 from task_submissions where file_hash = p_file_hash) into v_exact_dup;
  if v_exact_dup then
    raise exception 'Rejected: this exact image was already used in another task';
  end if;

  select exists (
    select 1 from task_submissions
    where commenter_id = v_commenter
      and phash is not null
      and length(replace((phash::bit(64) # p_phash::bit(64))::text, '0', '')) <= 10
  ) into v_near_dup;

  insert into task_submissions (task_id, commenter_id, proof_url, screenshot_url, file_hash, phash, is_flagged_duplicate)
  values (p_task_id, v_commenter, p_proof_url, p_screenshot_url, p_file_hash, p_phash, v_near_dup)
  returning id into v_submission_id;

  update tasks set status = 'submitted' where id = p_task_id;

  if v_near_dup then
    select id into v_admin from profiles where role = 'admin' limit 1;
    if v_admin is not null then
      perform notify(v_admin, 'dispute_opened', 'Suspected duplicate image',
        format('Commenter submitted an image highly similar to a previous one — review task %s before approval', p_task_id),
        p_task_id);
    end if;
  end if;

  return v_submission_id;
end $$;

-- Block direct inserts; all submissions must go through submit_task_proof (security definer)
create policy "block direct insert" on task_submissions for insert with check (false);

-- Lock proof forever once its task is approved
create or replace function lock_approved_submission()
returns trigger language plpgsql as $$
begin
  if exists (select 1 from tasks where id = old.task_id and status = 'approved') then
    raise exception 'Cannot edit or delete proof of an approved task — record is permanently locked';
  end if;
  return old;
end $$;

create trigger trg_lock_submission
before update or delete on task_submissions
for each row execute function lock_approved_submission();

-- Auto-suspend commenter after 3 flagged-duplicate submissions
create or replace function check_repeated_duplicates()
returns trigger language plpgsql as $$
declare
  v_count int;
begin
  if new.is_flagged_duplicate then
    select count(*) into v_count from task_submissions
    where commenter_id = new.commenter_id and is_flagged_duplicate = true;

    if v_count >= 3 then
      update commenter_profiles set status = 'suspended' where id = new.commenter_id;
      update profiles set is_active = false where id = new.commenter_id;
      perform notify(new.commenter_id, 'account_suspended', 'Your account has been suspended',
        'Repeated suspicious duplicate images detected — contact support');
    end if;
  end if;
  return new;
end $$;

create trigger trg_check_repeated_duplicates
after insert on task_submissions
for each row execute function check_repeated_duplicates();

-- ============================================
-- 6) Approve / reject task
-- ============================================
create or replace function approve_task(p_task_id uuid)
returns void language plpgsql security definer as $$
declare
  v_commenter uuid;
  v_commission numeric(10,2);
  v_platform_share numeric(10,2);
begin
  select t.assigned_commenter_id, cp.commission_per_task
  into v_commenter, v_commission
  from tasks t
  join subscriptions s on s.user_id = t.assigned_commenter_id and s.status = 'active'
  join commenter_packages cp on cp.id = s.package_id
  where t.id = p_task_id and t.status = 'submitted';

  if not found then raise exception 'Task is not valid for approval'; end if;

  v_platform_share := 1.00 - v_commission;

  update tasks set status = 'approved' where id = p_task_id;

  update commenter_profiles
  set wallet_balance = wallet_balance + v_commission,
      total_earned = total_earned + v_commission,
      tasks_completed = tasks_completed + 1,
      reliability_score = least(100, reliability_score + 1)
  where id = v_commenter;

  insert into transactions (user_id, type, amount, reference_id)
  values (v_commenter, 'task_commission', v_commission, p_task_id);

  insert into transactions (user_id, type, fee_type, amount, reference_id, note)
  values (v_commenter, 'task_commission', 'platform_share', v_platform_share, p_task_id, 'Platform share of comment');

  perform notify(v_commenter, 'task_approved', 'Your comment was approved',
    format('You earned $%s on an approved task', v_commission), p_task_id);

  perform pay_referral_bonus(v_commenter);
end $$;

create or replace function reject_task(p_task_id uuid, p_reason text)
returns uuid language plpgsql security definer as $$
declare
  v_commenter uuid;
  v_dispute_id uuid;
begin
  select assigned_commenter_id into v_commenter from tasks where id = p_task_id and status = 'submitted';
  if not found then raise exception 'Task is not valid for rejection'; end if;

  update tasks set status = 'disputed' where id = p_task_id;

  insert into disputes (task_id, raised_by, reason)
  select p_task_id, company_id, p_reason from tasks where id = p_task_id
  returning id into v_dispute_id;

  update commenter_profiles
  set reliability_score = greatest(0, reliability_score - 10),
      tasks_rejected = tasks_rejected + 1
  where id = v_commenter;

  insert into reliability_log (commenter_id, task_id, score_change, reason)
  values (v_commenter, p_task_id, -10, p_reason);

  perform notify(v_commenter, 'dispute_opened', 'Your comment was rejected', p_reason, p_task_id);

  return v_dispute_id;
end $$;

create or replace function check_reliability()
returns trigger language plpgsql as $$
begin
  if new.reliability_score < 70 then
    new.status := 'suspended';
    update profiles set is_active = false where id = new.id;
  end if;
  return new;
end $$;

create trigger trg_reliability before update on commenter_profiles
for each row execute function check_reliability();

-- ============================================
-- 7) Withdrawals — $20 minimum, $1 flat processing fee
-- ============================================
create or replace function request_withdrawal(p_commenter uuid, p_amount numeric, p_method text)
returns uuid language plpgsql security definer as $$
declare
  v_balance numeric;
  v_net numeric;
  v_id uuid;
begin
  select wallet_balance into v_balance from commenter_profiles where id = p_commenter for update;

  if v_balance is null or p_amount < 30 or p_amount > v_balance then
    raise exception 'Invalid amount — minimum $20 and within your available balance';
  end if;

  v_net := p_amount - 6.00;

  update commenter_profiles set wallet_balance = wallet_balance - p_amount where id = p_commenter;

  insert into withdrawals (commenter_id, amount, method) values (p_commenter, v_net, p_method) returning id into v_id;

  insert into transactions (user_id, type, amount, reference_id) values (p_commenter, 'withdrawal', -v_net, v_id);

  insert into transactions (user_id, type, fee_type, amount, reference_id, note)
  values (p_commenter, 'withdrawal', 'withdrawal_fee', -6.00, v_id, 'Processing fee');

  return v_id;
end $$;

-- ============================================
-- 8) Strict upgrade-only policy (no downgrades before expiry)
-- ============================================
create or replace function upgrade_company_package(p_company uuid, p_new_package_id int)
returns void language plpgsql security definer as $$
declare
  v_sub subscriptions%rowtype;
  v_old company_packages%rowtype;
  v_new company_packages%rowtype;
  v_points_diff int;
  v_comments_diff int;
begin
  select * into v_sub from subscriptions
  where user_id = p_company and role = 'company' and status = 'active' and end_date > now()
  for update;
  if not found then raise exception 'No active subscription found for this company'; end if;

  select * into v_old from company_packages where id = v_sub.package_id;
  select * into v_new from company_packages where id = p_new_package_id;
  if v_new.id is null then raise exception 'Package not found'; end if;

  if v_new.price <= v_old.price then
    raise exception 'Cannot switch to a lower or equal plan — please wait until % to change plans', v_sub.end_date;
  end if;

  v_points_diff := v_new.points_included - v_old.points_included;
  v_comments_diff := v_new.comments_included - v_old.comments_included;

  update subscriptions
  set package_id = v_new.id,
      points_balance = points_balance + v_points_diff,
      comments_remaining = coalesce(comments_remaining, 0) + v_comments_diff
  where id = v_sub.id;

  insert into transactions (user_id, type, fee_type, amount, reference_id, note)
  values (p_company, 'subscription_payment', 'upgrade_fee', 17.00, v_sub.id,
          format('Upgrade from %s to %s', v_old.name, v_new.name));
end $$;

create or replace function upgrade_commenter_package(p_commenter uuid, p_new_package_id int)
returns void language plpgsql security definer as $$
declare
  v_sub subscriptions%rowtype;
  v_old commenter_packages%rowtype;
  v_new commenter_packages%rowtype;
begin
  select * into v_sub from subscriptions
  where user_id = p_commenter and role = 'commenter' and status = 'active' and end_date > now()
  for update;
  if not found then raise exception 'No active subscription found for this commenter'; end if;

  select * into v_old from commenter_packages where id = v_sub.package_id;
  select * into v_new from commenter_packages where id = p_new_package_id;
  if v_new.id is null then raise exception 'Package not found'; end if;

  if v_new.price <= v_old.price then
    raise exception 'Cannot switch to a lower or equal plan — please wait until % to change plans', v_sub.end_date;
  end if;

  update subscriptions set package_id = v_new.id where id = v_sub.id;

  insert into transactions (user_id, type, fee_type, amount, reference_id, note)
  values (p_commenter, 'subscription_payment', 'upgrade_fee', 17.00, v_sub.id,
          format('Upgrade from %s to %s', v_old.name, v_new.name));
end $$;

-- ============================================
-- 9) Dispute resolution (with audit log)
-- ============================================
create or replace function resolve_dispute(p_dispute_id uuid, p_favor text, p_admin_note text)
returns void language plpgsql security definer as $$
declare
  v_task_id uuid;
  v_commenter uuid;
begin
  select task_id into v_task_id from disputes where id = p_dispute_id and status = 'open';
  if not found then raise exception 'Dispute not found or already closed'; end if;

  select assigned_commenter_id into v_commenter from tasks where id = v_task_id;

  if p_favor = 'commenter' then
    update disputes set status = 'resolved_commenter', admin_note = p_admin_note, resolved_at = now() where id = p_dispute_id;
    update tasks set status = 'submitted' where id = v_task_id;
    update commenter_profiles set reliability_score = least(100, reliability_score + 10) where id = v_commenter;
    perform notify(v_commenter, 'dispute_resolved', 'Dispute resolved in your favor', p_admin_note, v_task_id);
  elsif p_favor = 'company' then
    update disputes set status = 'resolved_company', admin_note = p_admin_note, resolved_at = now() where id = p_dispute_id;
    update tasks set status = 'rejected' where id = v_task_id;
    perform notify(v_commenter, 'dispute_resolved', 'Dispute resolved in favor of the company', p_admin_note, v_task_id);
  else
    raise exception 'p_favor must be commenter or company';
  end if;

  perform log_admin_action('resolve_dispute', 'disputes', p_dispute_id,
    jsonb_build_object('favor', p_favor, 'note', p_admin_note));
end $$;

-- ============================================
-- 10) Automatic company reporting (no raw proof exposure)
-- ============================================
create or replace function auto_report_to_company()
returns trigger language plpgsql security definer as $$
declare
  v_report_status text;
begin
  if new.status = 'approved' then
    v_report_status := 'completed';
  elsif new.status = 'rejected' then
    v_report_status := 'rejected';
  else
    return new;
  end if;

  insert into company_task_reports (task_id, company_id, status, admin_note, reported_by)
  values (new.id, new.company_id, v_report_status, 'Automatic instant system report', null)
  on conflict (task_id) do update
    set status = excluded.status, reported_at = now(), admin_note = excluded.admin_note;

  insert into notifications (user_id, type, title, body, reference_id)
  values (
    new.company_id,
    case when v_report_status = 'completed' then 'task_approved' else 'task_rejected' end,
    case when v_report_status = 'completed' then 'One of your tasks was completed' else 'A task could not be completed' end,
    'Task reviewed by the react.tech team and its status was updated automatically',
    new.id
  );

  return new;
end $$;

create trigger trg_auto_report_company
after update of status on tasks
for each row
when (new.status is distinct from old.status)
execute function auto_report_to_company();

-- ============================================
-- 11) Scheduled jobs (daily)
-- ============================================
create or replace function remind_expiring_subscriptions()
returns void language plpgsql as $$
begin
  insert into notifications (user_id, type, title, body, reference_id)
  select user_id, 'subscription_expiring', 'Your subscription is expiring soon',
         format('Your plan expires on %s — renew to avoid service interruption', to_char(end_date, 'YYYY-MM-DD')),
         id
  from subscriptions
  where status = 'active' and end_date between now() and now() + interval '3 days'
    and not exists (
      select 1 from notifications n
      where n.reference_id = subscriptions.id and n.type = 'subscription_expiring'
        and n.created_at > now() - interval '3 days'
    );
end $$;

create or replace function daily_subscription_check()
returns void language plpgsql as $$
begin
  perform remind_expiring_subscriptions();

  insert into transactions (user_id, type, amount, points, note)
  select user_id, 'points_reset', points_balance / 100.0, points_balance, 'Monthly reset - subscription expired'
  from subscriptions
  where status = 'active' and end_date < now() and points_balance > 0;

  update subscriptions set status = 'expired', points_balance = 0
  where status = 'active' and end_date < now();

  insert into notifications (user_id, type, title, body, reference_id)
  select user_id, 'subscription_expired', 'Your subscription has expired', 'Renew now to resume service', id
  from subscriptions where status = 'expired' and end_date < now();
end $$;

-- Enable with pg_cron once the extension is turned on (Database > Extensions):
-- select cron.schedule('daily-check', '0 3 * * *', 'select daily_subscription_check()');

-- ============================================
-- 12) Referral program ($5 bonus after referred commenter's first approved task)
-- ============================================
create or replace function pay_referral_bonus(p_referred uuid)
returns void language plpgsql security definer as $$
declare
  v_referral referrals%rowtype;
  v_first_approved_count int;
begin
  select * into v_referral from referrals where referred_id = p_referred and bonus_paid = false;
  if not found then return; end if;

  select count(*) into v_first_approved_count
  from tasks where assigned_commenter_id = p_referred and status = 'approved';

  if v_first_approved_count = 1 then
    update commenter_profiles set wallet_balance = wallet_balance + v_referral.bonus_amount
    where id = v_referral.referrer_id;

    insert into transactions (user_id, type, amount, reference_id, note)
    values (v_referral.referrer_id, 'task_commission', v_referral.bonus_amount, v_referral.id, 'Referral bonus');

    update referrals set bonus_paid = true where id = v_referral.id;

    perform notify(v_referral.referrer_id, 'referral_bonus', 'Referral bonus!',
      format('You earned $%s because your referral completed their first task', v_referral.bonus_amount));
  end if;
end $$;

-- ============================================
-- 13) Reporting views
-- ============================================
create or replace view monthly_profit as
select
  sum(case when type = 'subscription_payment' and fee_type is null then amount else 0 end) as subscriptions,
  sum(case when fee_type = 'platform_share' then amount else 0 end) as platform_share_from_comments,
  sum(case when fee_type in ('withdrawal_fee','speed_fee','custom_word_fee') then abs(amount) else 0 end) as service_fees,
  sum(case when fee_type = 'upgrade_fee' then amount else 0 end) as upgrade_fees,
  sum(case when type = 'subscription_payment' and fee_type is null then amount else 0 end)
    + sum(case when fee_type = 'platform_share' then amount else 0 end)
    + sum(case when fee_type in ('withdrawal_fee','speed_fee','custom_word_fee') then abs(amount) else 0 end)
    + sum(case when fee_type = 'upgrade_fee' then amount else 0 end) as net_profit
from transactions
where created_at >= date_trunc('month', now());

create or replace view withdrawal_ledger as
select
  w.id as withdrawal_id,
  p.full_name as commenter_name,
  p.phone as commenter_phone,
  w.amount + 1.00 as amount_requested,
  1.00 as fee_deducted,
  w.amount as net_transferred,
  w.method as transfer_method,
  w.status,
  w.requested_at,
  w.processed_at
from withdrawals w
join profiles p on p.id = w.commenter_id
order by w.requested_at desc;

create or replace view commenter_task_proof as
select
  p.full_name as commenter_name,
  t.id as task_id,
  t.platform,
  t.target_url as post_url,
  ts.proof_url as comment_url,
  ts.screenshot_url,
  ts.submitted_at,
  ts.review_status,
  ts.reviewer_note,
  comp.full_name as company_name
from task_submissions ts
join tasks t on t.id = ts.task_id
join profiles p on p.id = ts.commenter_id
join profiles comp on comp.id = t.company_id
order by ts.submitted_at desc;

create or replace view commenter_summary as
select
  p.id as commenter_id,
  p.full_name as commenter_name,
  cp.reliability_score,
  cp.wallet_balance,
  cp.total_earned,
  count(ts.id) filter (where ts.review_status = 'approved') as approved_tasks,
  count(ts.id) filter (where ts.review_status = 'rejected') as rejected_tasks,
  count(ts.id) filter (where ts.review_status = 'pending') as pending_tasks,
  count(ts.id) as total_tasks
from profiles p
join commenter_profiles cp on cp.id = p.id
left join task_submissions ts on ts.commenter_id = p.id
where p.role = 'commenter'
group by p.id, p.full_name, cp.reliability_score, cp.wallet_balance, cp.total_earned;

create or replace view company_revenue_detail as
select
  p.id as company_id,
  p.full_name as company_name,
  cpk.name as package_name,
  s.status,
  s.comments_remaining,
  s.points_balance,
  s.end_date,
  count(t.id) as tasks_created,
  count(t.id) filter (where t.status = 'approved') as tasks_completed
from profiles p
join subscriptions s on s.user_id = p.id and s.role = 'company'
join company_packages cpk on cpk.id = s.package_id
left join tasks t on t.company_id = p.id
where p.role = 'company'
group by p.id, p.full_name, cpk.name, s.status, s.comments_remaining, s.points_balance, s.end_date;

create or replace view commenter_revenue_detail as
select
  p.id as commenter_id,
  p.full_name as commenter_name,
  ckp.name as package_name,
  s.status,
  s.end_date,
  cp.wallet_balance,
  cp.total_earned,
  cp.tasks_completed,
  cp.reliability_score
from profiles p
join subscriptions s on s.user_id = p.id and s.role = 'commenter'
join commenter_packages ckp on ckp.id = s.package_id
join commenter_profiles cp on cp.id = p.id
where p.role = 'commenter';

create or replace view flagged_duplicates as
select
  p.full_name as commenter_name,
  t.platform,
  ts.proof_url,
  ts.submitted_at,
  ts.review_status
from task_submissions ts
join tasks t on t.id = ts.task_id
join profiles p on p.id = ts.commenter_id
where ts.is_flagged_duplicate = true
order by ts.submitted_at desc;

create or replace view commenter_leaderboard as
select
  p.full_name as commenter_name,
  cp.tasks_completed,
  cp.reliability_score,
  cp.total_earned,
  rank() over (order by cp.tasks_completed desc, cp.reliability_score desc) as rank
from profiles p
join commenter_profiles cp on cp.id = p.id
where p.role = 'commenter' and cp.status = 'active'
order by rank
limit 50;

create or replace view company_clean_report as
select
  ctr.company_id,
  t.platform,
  ckp.name as commenter_package,
  ctr.status,
  ctr.admin_note,
  ctr.reported_at
from company_task_reports ctr
join tasks t on t.id = ctr.task_id
left join subscriptions s on s.user_id = t.assigned_commenter_id and s.role = 'commenter'
left join commenter_packages ckp on ckp.id = s.package_id
order by ctr.reported_at desc;

create or replace view commenter_activity_feed as
select
  user_id as commenter_id,
  type as activity_type,
  fee_type,
  amount,
  note,
  created_at
from transactions
where user_id in (select id from profiles where role = 'commenter')
order by created_at desc;

create or replace view company_rating_summary as
select company_id, round(avg(clarity_score), 2) as avg_clarity, count(*) as rating_count
from company_ratings group by company_id;

-- ============================================
-- 14) Row Level Security
-- ============================================
alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table tasks enable row level security;
alter table task_submissions enable row level security;
alter table transactions enable row level security;
alter table withdrawals enable row level security;
alter table commenter_profiles enable row level security;
alter table notifications enable row level security;
alter table referrals enable row level security;
alter table company_ratings enable row level security;
alter table company_task_reports enable row level security;
alter table admin_audit_log enable row level security;
alter table staff_members enable row level security;
alter table comment_templates enable row level security;

create policy "read own profile" on profiles for select using (auth.uid() = id);
create policy "read own subscription" on subscriptions for select using (auth.uid() = user_id);
create policy "company reads own tasks" on tasks for select using (auth.uid() = company_id or auth.uid() = assigned_commenter_id);
create policy "read own transactions" on transactions for select using (auth.uid() = user_id);
create policy "read own withdrawals" on withdrawals for select using (auth.uid() = commenter_id);
create policy "commenter reads own profile" on commenter_profiles for select using (auth.uid() = id);
create policy "commenter reads own submissions" on task_submissions for select using (auth.uid() = commenter_id);
create policy "read own notifications" on notifications for select using (auth.uid() = user_id);
create policy "update own notifications" on notifications for update using (auth.uid() = user_id);
create policy "read own referrals" on referrals for select using (auth.uid() = referrer_id);
create policy "commenter rates task" on company_ratings for insert with check (auth.uid() = commenter_id);
create policy "read company ratings" on company_ratings for select using (true);
create policy "company reads own reports" on company_task_reports for select using (auth.uid() = company_id);
create policy "company manages own templates" on comment_templates for all using (auth.uid() = company_id);
create policy "commenter reads templates of assigned task" on comment_templates for select
  using (company_id in (select company_id from tasks where assigned_commenter_id = auth.uid()));

-- Admin full access across sensitive tables
create policy "admin full access profiles" on profiles for all using (is_admin());
create policy "admin full access subscriptions" on subscriptions for all using (is_admin());
create policy "admin full access tasks" on tasks for all using (is_admin());
create policy "admin full access submissions" on task_submissions for all using (is_admin());
create policy "admin full access transactions" on transactions for all using (is_admin());
create policy "admin full access withdrawals" on withdrawals for all using (is_admin());
create policy "admin full access commenter_profiles" on commenter_profiles for all using (is_admin());
create policy "admin full access notifications" on notifications for all using (is_admin());
create policy "admin full access referrals" on referrals for all using (is_admin());
create policy "admin full access ratings" on company_ratings for all using (is_admin());
create policy "admin full access reports" on company_task_reports for all using (is_admin());
create policy "admin full access audit" on admin_audit_log for all using (is_admin());
create policy "admin manages staff" on staff_members for all using (is_admin());
create policy "admin full access templates" on comment_templates for all using (is_admin());
create policy "admin reads audit log" on admin_audit_log for select using (is_admin());
