alter table public.consulting_intakes
  add column if not exists guest_session_id text;

create index if not exists consulting_intakes_guest_session_id_idx
  on public.consulting_intakes (guest_session_id);
