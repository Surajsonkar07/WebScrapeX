-- WebScrapeX v2 schema. Safe to run more than once (uses IF NOT EXISTS / OR REPLACE).
-- v1 tables (websites, metadata, assets, logs, profiles, verification_tokens) are
-- created only if missing; existing rows are untouched.

create extension if not exists pgcrypto;

-- Jobs. `notes` holds v2 job options as JSON: {"mode","engine","title","favicon","rows","error"}.
create table if not exists public.websites (
    id uuid primary key default gen_random_uuid(),
    url text not null,
    status text not null default 'pending' check (status in ('pending', 'scraping', 'completed', 'failed')),
    created_at timestamptz not null default now(),
    completed_at timestamptz,
    total_assets integer default 0,
    notes text,
    user_id uuid references auth.users (id) on delete cascade
);
create index if not exists websites_user_created_idx on public.websites (user_id, created_at desc);

create table if not exists public.metadata (
    id uuid primary key default gen_random_uuid(),
    website_id uuid not null references public.websites (id) on delete cascade,
    title text,
    description text,
    keywords text,
    favicon text,
    color_palette jsonb,
    fonts jsonb,
    technologies jsonb,
    created_at timestamptz not null default now()
);
create index if not exists metadata_website_idx on public.metadata (website_id);

create table if not exists public.assets (
    id uuid primary key default gen_random_uuid(),
    website_id uuid not null references public.websites (id) on delete cascade,
    file_type text not null,
    url text not null,
    local_path text,
    size_bytes bigint,
    created_at timestamptz not null default now()
);

create table if not exists public.logs (
    id uuid primary key default gen_random_uuid(),
    website_id uuid not null references public.websites (id) on delete cascade,
    message text not null,
    type text not null default 'info' check (type in ('info', 'error', 'success', 'warning')),
    created_at timestamptz not null default now()
);
create index if not exists logs_website_idx on public.logs (website_id, created_at);

create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    full_name text,
    email text,
    verified boolean default false,
    updated_at timestamptz not null default now()
);

-- Pre-signup email codes. Only the service role touches this table.
create table if not exists public.verification_tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    token text not null,
    expires_at timestamptz not null,
    created_at timestamptz not null default now()
);

-- v2: API keys (SHA-256 hash only; the plain key is shown once).
create table if not exists public.api_keys (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    name text not null,
    prefix text not null,
    key_hash text not null unique,
    created_at timestamptz not null default now(),
    last_used_at timestamptz
);
create index if not exists api_keys_user_idx on public.api_keys (user_id);

-- v2: recurring scrapes.
create table if not exists public.schedules (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    url text not null,
    options jsonb not null default '{}'::jsonb,
    frequency text not null check (frequency in ('daily', 'weekly', 'monthly')),
    webhook_url text,
    active boolean not null default true,
    next_run_at timestamptz not null,
    last_run_at timestamptz,
    last_job_id uuid,
    created_at timestamptz not null default now()
);
create index if not exists schedules_due_idx on public.schedules (active, next_run_at);

-- Row-level security: users see only their own rows. The server's service-role
-- key bypasses RLS and always filters by user_id itself.
alter table public.websites enable row level security;
alter table public.metadata enable row level security;
alter table public.assets enable row level security;
alter table public.logs enable row level security;
alter table public.profiles enable row level security;
alter table public.verification_tokens enable row level security;
alter table public.api_keys enable row level security;
alter table public.schedules enable row level security;

drop policy if exists "own websites" on public.websites;
create policy "own websites" on public.websites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own metadata" on public.metadata;
create policy "own metadata" on public.metadata for all
    using (exists (select 1 from public.websites w where w.id = website_id and w.user_id = auth.uid()))
    with check (exists (select 1 from public.websites w where w.id = website_id and w.user_id = auth.uid()));

drop policy if exists "own assets" on public.assets;
create policy "own assets" on public.assets for all
    using (exists (select 1 from public.websites w where w.id = website_id and w.user_id = auth.uid()))
    with check (exists (select 1 from public.websites w where w.id = website_id and w.user_id = auth.uid()));

drop policy if exists "own logs" on public.logs;
create policy "own logs" on public.logs for all
    using (exists (select 1 from public.websites w where w.id = website_id and w.user_id = auth.uid()))
    with check (exists (select 1 from public.websites w where w.id = website_id and w.user_id = auth.uid()));

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own api keys read" on public.api_keys;
create policy "own api keys read" on public.api_keys for select using (auth.uid() = user_id);

drop policy if exists "own schedules" on public.schedules;
create policy "own schedules" on public.schedules for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- verification_tokens: no policies on purpose (service role only).

-- Storage: result.json, screenshots/PDFs and saved images live under <job id>/ in this bucket.
-- Private is recommended; the app streams files after checking ownership.
insert into storage.buckets (id, name, public)
values ('scrapes', 'scrapes', false)
on conflict (id) do nothing;
