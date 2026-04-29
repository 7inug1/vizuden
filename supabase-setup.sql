-- ① reports 테이블 생성
create table if not exists reports (
  id            uuid        primary key default gen_random_uuid(),
  kind          text        default 'prescription',
  user_id       uuid        default null,
  guest_session_id text     default null,
  type_code     text,
  title         text        default null,
  answers       jsonb       default null,
  prompt        text        default null,
  free          jsonb       not null,
  full_report   jsonb       not null,
  paid_at       timestamptz default null,
  created_at    timestamptz default now()
);

-- 기존 테이블 마이그레이션: answers / prompt 컬럼 추가
alter table reports add column if not exists title text;
alter table reports add column if not exists answers jsonb;
alter table reports add column if not exists prompt text;
alter table reports add column if not exists kind text;
alter table reports add column if not exists user_id uuid;
alter table reports add column if not exists guest_session_id text;

-- ② 공개 접근 완전 차단 (service_role 키만 접근 가능)
alter table reports enable row level security;

create policy "no public access"
  on reports for all
  using (false);
