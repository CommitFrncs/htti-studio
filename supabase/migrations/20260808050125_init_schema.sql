-- profiles table, extends auth.users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro', 'pro_api', 'api_only')),
  renders_this_month int not null default 0,
  saved_templates_count int not null default 0,
  created_at timestamptz not null default now()
);

-- auto-create a profile row whenever a new user signs up
create function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- config table, tunable without redeploying code
create table plan_limits (
  plan text primary key check (plan in ('free', 'pro', 'pro_api', 'api_only')),
  monthly_export_limit int,        -- null = unlimited
  saved_templates_limit int,       -- null = unlimited
  has_watermark boolean not null default true,
  export_quality text not null default 'standard' check (export_quality in ('standard', 'high')),
  api_access boolean not null default false,
  advanced_editing boolean not null default false
);

insert into plan_limits (plan, monthly_export_limit, saved_templates_limit, has_watermark, export_quality, api_access, advanced_editing) values
  ('free', 30, 12, true, 'standard', false, false),
  ('pro', null, null, false, 'high', false, true),
  ('pro_api', null, null, false, 'high', true, true),
  ('api_only', null, 0, false, 'high', true, false);

-- templates library
create table templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  html_structure text not null,
  css text not null,
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);

-- user's saved/edited templates
create table user_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  template_id uuid references templates(id) on delete set null,
  edited_html text not null,
  edited_css text not null,
  created_at timestamptz not null default now()
);

-- usage log
create table renders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  mode text not null check (mode in ('template', 'custom-code')),
  template_id uuid references templates(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Row Level Security: users can only see/edit their own data
alter table profiles enable row level security;
alter table user_templates enable row level security;
alter table renders enable row level security;
alter table templates enable row level security;
alter table plan_limits enable row level security;

create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "Users can view own saved templates" on user_templates
  for select using (auth.uid() = user_id);
create policy "Users can insert own saved templates" on user_templates
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own saved templates" on user_templates
  for delete using (auth.uid() = user_id);

create policy "Users can view own renders" on renders
  for select using (auth.uid() = user_id);
create policy "Users can insert own renders" on renders
  for insert with check (auth.uid() = user_id);

create policy "Anyone can view templates" on templates
  for select using (true);

create policy "Anyone can view plan limits" on plan_limits
  for select using (true);