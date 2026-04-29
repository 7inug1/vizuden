alter table public.reports
  add column if not exists guest_session_id text;

alter table public.reports
  alter column kind set default 'prescription';

update public.reports
set kind = 'prescription'
where kind = 'blueprint' or kind is null;

create index if not exists reports_user_id_kind_created_at_idx
  on public.reports (user_id, kind, created_at desc);

create index if not exists reports_guest_session_id_kind_created_at_idx
  on public.reports (guest_session_id, kind, created_at desc);
