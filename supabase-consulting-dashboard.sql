-- Consulting 응답을 Supabase에서 보기 쉽게 만드는 1회성 세팅 SQL
-- 실행 순서:
-- 1) 이 파일 전체 실행
-- 2) Table Editor에서 아래 view들을 일반 테이블처럼 조회
--    - consulting_intakes_admin_v1
--    - consulting_answers_flat_v1
--    - consulting_daily_stats_v1
--    - consulting_source_stats_v1
--    - consulting_session_status_stats_v1

alter table if exists public.consulting_intakes
  add column if not exists user_id uuid,
  add column if not exists guest_session_id text,
  add column if not exists answers jsonb default '[]'::jsonb,
  add column if not exists fit_pics jsonb default '[]'::jsonb,
  add column if not exists created_at timestamptz default now();

create index if not exists consulting_intakes_created_at_idx
  on public.consulting_intakes (created_at desc);

create index if not exists consulting_intakes_user_id_idx
  on public.consulting_intakes (user_id);

create index if not exists consulting_intakes_guest_session_id_idx
  on public.consulting_intakes (guest_session_id);

drop view if exists public.consulting_answers_flat_v1;
create view public.consulting_answers_flat_v1 as
select
  ci.id as intake_id,
  ci.user_id,
  ci.guest_session_id,
  ci.created_at,
  coalesce(jsonb_array_length(coalesce(ci.fit_pics, '[]'::jsonb)), 0) as fit_pic_count,
  ans.item->>'id' as question_id,
  ans.item->>'question' as question,
  nullif(ans.item->>'answer', '') as answer_text,
  case
    when jsonb_typeof(ans.item->'selected') = 'array' then (
      select string_agg(v, ', ')
      from jsonb_array_elements_text(ans.item->'selected') as v
    )
    else null
  end as selected_text,
  nullif(ans.item->>'other', '') as other_text
from public.consulting_intakes ci
cross join lateral jsonb_array_elements(coalesce(ci.answers, '[]'::jsonb)) as ans(item);

drop view if exists public.consulting_intakes_admin_v1;
create view public.consulting_intakes_admin_v1 as
select
  ci.id as intake_id,
  ci.created_at,
  ci.user_id,
  ci.guest_session_id,
  coalesce(jsonb_array_length(coalesce(ci.fit_pics, '[]'::jsonb)), 0) as fit_pic_count,
  max(caf.selected_text) filter (where caf.question_id = 'referralSource') as referral_source,
  max(caf.other_text) filter (where caf.question_id = 'referralSource') as referral_source_other,
  max(caf.selected_text) filter (where caf.question_id = 'sessionStatus') as session_status,
  max(caf.answer_text) filter (where caf.question_id = 'birthYear') as birth_year,
  max(caf.answer_text) filter (where caf.question_id = 'birthMonthDay') as birth_month_day,
  max(caf.answer_text) filter (where caf.question_id = 'instagram') as instagram,
  max(caf.selected_text) filter (where caf.question_id = 'shopWhere') as shopping_channels,
  max(caf.selected_text) filter (where caf.question_id = 'shopWhereDetail') as shopping_channels_detail,
  max(caf.selected_text) filter (where caf.question_id = 'residenceRegion') as residence_region,
  max(caf.selected_text) filter (where caf.question_id = 'shoppingArea') as shopping_area,
  max(caf.selected_text) filter (where caf.question_id = 'budgetDay') as day_budget,
  max(caf.selected_text) filter (where caf.question_id = 'sessionGoal') as session_goal,
  max(caf.other_text) filter (where caf.question_id = 'sessionGoal') as session_goal_other,
  max(caf.answer_text) filter (where caf.question_id = 'finalNote') as final_note
from public.consulting_intakes ci
left join public.consulting_answers_flat_v1 caf
  on caf.intake_id = ci.id
group by ci.id, ci.created_at, ci.user_id, ci.guest_session_id, ci.fit_pics;

drop view if exists public.consulting_daily_stats_v1;
create view public.consulting_daily_stats_v1 as
select
  date_trunc('day', created_at) as day,
  count(*)::int as intake_count
from public.consulting_intakes
group by 1
order by 1 desc;

drop view if exists public.consulting_source_stats_v1;
create view public.consulting_source_stats_v1 as
select
  coalesce(nullif(referral_source, ''), '(미입력)') as referral_source,
  count(*)::int as intake_count
from public.consulting_intakes_admin_v1
group by 1
order by 2 desc, 1 asc;

drop view if exists public.consulting_session_status_stats_v1;
create view public.consulting_session_status_stats_v1 as
select
  coalesce(nullif(session_status, ''), '(미입력)') as session_status,
  count(*)::int as intake_count
from public.consulting_intakes_admin_v1
group by 1
order by 2 desc, 1 asc;
