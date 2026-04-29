create table if not exists public.consulting_codes (
  code text primary key,
  is_active boolean not null default true,
  max_uses integer not null default 1,
  use_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists consulting_codes_is_active_idx
  on public.consulting_codes (is_active);
