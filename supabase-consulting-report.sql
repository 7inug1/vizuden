-- consulting_intakes 테이블에 보고서 컬럼 추가
alter table consulting_intakes
  add column if not exists report jsonb,
  add column if not exists report_generated_at timestamptz;

-- 어드민이 보고서 읽기/쓰기 가능하도록 (service_role은 기본 허용)
-- RLS 정책: 본인 또는 어드민만 조회 가능
-- 기존 RLS 정책 유지하되, report 컬럼은 자동 포함됨
