alter table public.reports
  add column if not exists guest_session_id text;

create index if not exists reports_guest_session_id_kind_created_at_idx
  on public.reports (guest_session_id, kind, created_at desc);
