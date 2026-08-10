-- ============================================================
-- Personal OS · Supabase 建表脚本
-- 在 Supabase Dashboard → SQL Editor 中执行一次
-- ============================================================

-- 开启 UUID 生成扩展
create extension if not exists "pgcrypto";

-- ===== 1. tasks 表 =====
create table if not exists public.tasks (
  id text primary key,                    -- 前端生成的 ID（t + 时间戳）
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  note text,
  completion_note text,
  meeting_location text,
  meeting_contact text,
  domain text not null default 'life',
  project_id text,
  priority text default 'medium',
  suggested_priority text,
  due_date text,
  due_time text,
  estimated_minutes integer default 30,
  progress integer default 0,
  next_action text,
  in_today boolean default false,
  in_top3 boolean default false,
  top3_order integer,
  status text default 'pending',
  links text[],
  created_at text,
  completed_at text,
  overdue boolean,
  deleted_at text,                        -- 软删除
  updated_at timestamptz default now(),   -- 同步用
  data jsonb                               -- 完整数据冗余（便于扩展）
);

-- 兼容已创建的旧表
alter table public.tasks add column if not exists completion_note text;
alter table public.tasks add column if not exists meeting_location text;
alter table public.tasks add column if not exists meeting_contact text;

-- ===== 2. inspirations 表 =====
create table if not exists public.inspirations (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  source text default 'manual',
  domain text,
  created_at text,
  converted_to jsonb,
  archived boolean default false,
  note text,
  updated_at timestamptz default now(),
  data jsonb
);

-- ===== 3. schedules 表 =====
create table if not exists public.schedules (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  domain text default 'life',
  date text,
  start text,
  "end" text,
  repeat_rule text default 'none',
  project_id text,
  task_id text,
  done boolean default false,
  updated_at timestamptz default now(),
  data jsonb
);

-- ===== 4. ledger_accounts 表 =====
create table if not exists public.ledger_accounts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text default 'cash',
  balance numeric default 0,
  note text,
  updated_at text,
  cloud_updated_at timestamptz default now(),
  data jsonb
);

-- ===== 5. ledger_txns 表 =====
create table if not exists public.ledger_txns (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id text not null,
  type text default 'expense',
  amount numeric default 0,
  category text default '其他',
  note text,
  date text,
  time text,
  cloud_updated_at timestamptz default now(),
  data jsonb
);

-- ===== 6. focus_sessions 表 =====
create table if not exists public.focus_sessions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  domain text default 'content',
  task_id text,
  date text,
  start text,
  "end" text,
  planned_min integer default 25,
  actual_min integer default 0,
  completed boolean default false,
  cancelled boolean default false,
  updated_at timestamptz default now(),
  data jsonb
);

-- ===== 7. user_settings 表（存储用户级设置/元数据）=====
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  avatar_text text default '玥',
  display_name text default '玥莹',
  focus_settings jsonb,
  trending_source jsonb,
  meta jsonb,
  updated_at timestamptz default now()
);

-- ============================================================
-- RLS（行级安全）策略：每个用户只能访问自己的数据
-- ============================================================

-- 启用 RLS
alter table public.tasks enable row level security;
alter table public.inspirations enable row level security;
alter table public.schedules enable row level security;
alter table public.ledger_accounts enable row level security;
alter table public.ledger_txns enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.user_settings enable row level security;

-- tasks 策略
drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks for select using (auth.uid() = user_id);
drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks for insert with check (auth.uid() = user_id);
drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks for delete using (auth.uid() = user_id);

-- inspirations 策略
drop policy if exists "insp_select_own" on public.inspirations;
create policy "insp_select_own" on public.inspirations for select using (auth.uid() = user_id);
drop policy if exists "insp_insert_own" on public.inspirations;
create policy "insp_insert_own" on public.inspirations for insert with check (auth.uid() = user_id);
drop policy if exists "insp_update_own" on public.inspirations;
create policy "insp_update_own" on public.inspirations for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "insp_delete_own" on public.inspirations;
create policy "insp_delete_own" on public.inspirations for delete using (auth.uid() = user_id);

-- schedules 策略
drop policy if exists "sch_select_own" on public.schedules;
create policy "sch_select_own" on public.schedules for select using (auth.uid() = user_id);
drop policy if exists "sch_insert_own" on public.schedules;
create policy "sch_insert_own" on public.schedules for insert with check (auth.uid() = user_id);
drop policy if exists "sch_update_own" on public.schedules;
create policy "sch_update_own" on public.schedules for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "sch_delete_own" on public.schedules;
create policy "sch_delete_own" on public.schedules for delete using (auth.uid() = user_id);

-- ledger_accounts 策略
drop policy if exists "acc_select_own" on public.ledger_accounts;
create policy "acc_select_own" on public.ledger_accounts for select using (auth.uid() = user_id);
drop policy if exists "acc_insert_own" on public.ledger_accounts;
create policy "acc_insert_own" on public.ledger_accounts for insert with check (auth.uid() = user_id);
drop policy if exists "acc_update_own" on public.ledger_accounts;
create policy "acc_update_own" on public.ledger_accounts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "acc_delete_own" on public.ledger_accounts;
create policy "acc_delete_own" on public.ledger_accounts for delete using (auth.uid() = user_id);

-- ledger_txns 策略
drop policy if exists "txn_select_own" on public.ledger_txns;
create policy "txn_select_own" on public.ledger_txns for select using (auth.uid() = user_id);
drop policy if exists "txn_insert_own" on public.ledger_txns;
create policy "txn_insert_own" on public.ledger_txns for insert with check (auth.uid() = user_id);
drop policy if exists "txn_update_own" on public.ledger_txns;
create policy "txn_update_own" on public.ledger_txns for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "txn_delete_own" on public.ledger_txns;
create policy "txn_delete_own" on public.ledger_txns for delete using (auth.uid() = user_id);

-- focus_sessions 策略
drop policy if exists "fs_select_own" on public.focus_sessions;
create policy "fs_select_own" on public.focus_sessions for select using (auth.uid() = user_id);
drop policy if exists "fs_insert_own" on public.focus_sessions;
create policy "fs_insert_own" on public.focus_sessions for insert with check (auth.uid() = user_id);
drop policy if exists "fs_update_own" on public.focus_sessions;
create policy "fs_update_own" on public.focus_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "fs_delete_own" on public.focus_sessions;
create policy "fs_delete_own" on public.focus_sessions for delete using (auth.uid() = user_id);

-- user_settings 策略
drop policy if exists "us_select_own" on public.user_settings;
create policy "us_select_own" on public.user_settings for select using (auth.uid() = user_id);
drop policy if exists "us_insert_own" on public.user_settings;
create policy "us_insert_own" on public.user_settings for insert with check (auth.uid() = user_id);
drop policy if exists "us_update_own" on public.user_settings;
create policy "us_update_own" on public.user_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 自动更新 updated_at 触发器（同步用）
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tasks_touch on public.tasks;
create trigger tasks_touch before update on public.tasks for each row execute function public.touch_updated_at();

drop trigger if exists insp_touch on public.inspirations;
create trigger insp_touch before update on public.inspirations for each row execute function public.touch_updated_at();

drop trigger if exists sch_touch on public.schedules;
create trigger sch_touch before update on public.schedules for each row execute function public.touch_updated_at();

drop trigger if exists acc_touch on public.ledger_accounts;
create trigger acc_touch before update on public.ledger_accounts for each row execute function public.touch_updated_at();

drop trigger if exists txn_touch on public.ledger_txns;
create trigger txn_touch before update on public.ledger_txns for each row execute function public.touch_updated_at();

drop trigger if exists fs_touch on public.focus_sessions;
create trigger fs_touch before update on public.focus_sessions for each row execute function public.touch_updated_at();

drop trigger if exists us_touch on public.user_settings;
create trigger us_touch before update on public.user_settings for each row execute function public.touch_updated_at();

-- ============================================================
-- 完成
-- ============================================================
