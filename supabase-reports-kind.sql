alter table public.reports
  add column if not exists kind text,
  add column if not exists user_id uuid null,
  add column if not exists guest_session_id text null;

update public.reports
set kind = 'identity'
where kind is null
  and fit_pics is not null;

update public.reports
set kind = 'prescription'
where kind is null or kind = 'blueprint';

alter table public.reports
  alter column kind set not null;

create index if not exists reports_user_id_kind_created_at_idx
  on public.reports (user_id, kind, created_at desc);

create index if not exists reports_guest_session_id_kind_created_at_idx
  on public.reports (guest_session_id, kind, created_at desc);
