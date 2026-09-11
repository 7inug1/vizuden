import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // type_completions 컬럼 확인 - 전체 row 하나 가져오기
  const { data: typeSample, error: typeErr } = await supabase
    .from('type_completions')
    .select('*')
    .limit(5);
  console.log('--- type_completions 샘플 ---');
  if (typeErr) console.log('ERROR:', typeErr);
  console.log(JSON.stringify(typeSample, null, 2));

  // guest_session_id로 type_completions 찾기 (처방전의 guest_session_id 사용)
  const guestSessionId = '9f56c5e4-9afe-4435-af8c-bfdb8879e499'; // 가장 최근 처방전
  const { data: typeByGuest, error: typeGuestErr } = await supabase
    .from('type_completions')
    .select('*')
    .eq('guest_session_id', guestSessionId);
  console.log('\n--- 해당 guest_session의 type_completions ---');
  if (typeGuestErr) console.log('ERROR:', typeGuestErr);
  console.log(JSON.stringify(typeByGuest, null, 2));
}

main().catch(console.error);
