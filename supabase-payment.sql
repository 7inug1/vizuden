-- reports 테이블에 결제 정보 컬럼 추가
alter table reports add column if not exists payment_key text;
