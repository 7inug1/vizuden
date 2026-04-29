-- feedback 테이블 생성 (Blueprint 결과 피드백 수집)
create table if not exists public.feedback (
  id         uuid        primary key default gen_random_uuid(),
  report_id  uuid        null,
  type_code  text        null,
  is_paid    boolean     null,
  rating     numeric(2,1) not null,
  message    text        not null,
  user_agent text        null,
  referer    text        null,
  created_at timestamptz default now()
);

-- 기존에 rating이 int로 생성돼 있으면 0.5점 저장을 위해 numeric(2,1)로 변경
do $$
declare dt text;
begin
  select data_type
    into dt
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'feedback'
    and column_name = 'rating';

  if dt = 'integer' then
    alter table public.feedback
      alter column rating type numeric(2,1)
      using rating::numeric;
  end if;
end $$;

-- 공개 접근 완전 차단 (service_role 키만 접근 가능)
alter table public.feedback enable row level security;

create policy "no public access"
  on public.feedback for all
  using (false);

alter table public.feedback
  add column if not exists category text null,
  add column if not exists pathname text null,
  add column if not exists page_type text null,
  add column if not exists user_id uuid null,
  add column if not exists guest_session_id text null;

alter table public.feedback
  alter column rating drop not null;
