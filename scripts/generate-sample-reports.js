import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// .env.local 로드
try {
  const env = readFileSync(join(ROOT, '.env.local'), 'utf8');
  env.split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  });
} catch {}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── 시스템 프롬프트 (api/consulting-report.js에서 동일하게) ──────
const SYSTEM_PROMPT = readFileSync(join(ROOT, 'api/consulting-report.js'), 'utf8')
  .match(/const SYSTEM_PROMPT = `([\s\S]*?)`;/)?.[1] ?? '';

// ── 세 명 설문 답변 ────────────────────────────────────────────────
const PERSONAS = [
  {
    id: 'teo-yoo',
    name: '유태오',
    answers: `Q. 어떠한 이미지로 비춰지길 원하나요?
→ 꾸민 것 없이 자연스러워 보이고 싶다, 나다운 스타일이 있어 보이고 싶다

Q. 닮고 싶은 인물이 있나요?
→ 딱히 없음 — 나 자신이 기준

Q. 그 인물의 어떤 점이 끌리나요?
→ (미입력)

Q. 패션에 얼마나 관심 있고 잘 아세요?
→ 내 기준이 생긴 편 — 브랜드·핏·실루엣 보는 눈 있음

Q. 업무 환경의 드레스코드는?
→ 완전 자유

Q. 어떤 상황에 입을 옷을 추천받고 싶으세요?
→ 일상 외출·약속, 여행·주말 외출

Q. 어떤 일을 하고 계세요?
→ 배우·모델 (미디어·콘텐츠·예술)

Q. 지금 스타일에서 가장 자주 막히거나 아쉬운 점은?
→ 사놓고 안 입는 옷이 쌓인다

Q. 지금 옷장에서 가장 아쉬운 카테고리가 있나요?
→ 딱히 없음

Q. 어떤 스타일에 끌리나요?
→ 미니멀·클린, 빈티지·레트로

Q. 절대 하고 싶지 않은 스타일이 있나요?
→ 딱딱하고 포멀한 스타일, 너무 유행하는 스타일

Q. 평소 자주 입는 색 계열은?
→ 블랙·화이트·그레이, 베이지·브라운·카멜

Q. 반대로 피하고 싶은 색이 있나요?
→ 레드·블루·그린·머스타드 (선명한 컬러), 라벤더·민트·핑크 (파스텔)

Q. 피부톤이 어떤 편인가요?
→ 가을 웜톤 — 까무잡잡하거나 구릿빛인 편

Q. 즐겨 입는 브랜드가 있나요?
→ 마르지엘라, 아크네, 르메르, 포터리

Q. 키를 알려주세요
→ 180

Q. 몸무게를 알려주세요
→ 70

Q. 체형이 어떤 편인가요?
→ 슬림·마른 편

Q. 체형에서 신경 쓰이는 부분이 있나요?
→ 특별히 없다

Q. 생년월일을 알려주세요
→ 1987

Q. 지금 스타일에서 얼마나 바꾸고 싶나요?
→ 디테일만 다듬고 싶다

Q. 절대 바꾸고 싶지 않은 스타일 요소가 있나요?
→ 소재 감각. 면이든 울이든 좋은 원단을 고르는 기준

Q. 스타일에 쓸 수 있는 예산은?
→ 100~300만원

Q. 보고서에 꼭 반영됐으면 하는 점이 있나요?
→ 과하지 않되 기억에 남는 스타일. 스크린 밖에서도 나답게.`,
  },
  {
    id: 'bong-taegyu',
    name: '봉태규',
    answers: `Q. 어떠한 이미지로 비춰지길 원하나요?
→ 나다운 스타일이 있어 보이고 싶다, 꾸민 것 없이 자연스러워 보이고 싶다

Q. 닮고 싶은 인물이 있나요?
→ 딱히 없음

Q. 그 인물의 어떤 점이 끌리나요?
→ (미입력)

Q. 패션에 얼마나 관심 있고 잘 아세요?
→ 내 기준이 생긴 편 — 브랜드·핏·실루엣 보는 눈 있음

Q. 업무 환경의 드레스코드는?
→ 완전 자유

Q. 어떤 상황에 입을 옷을 추천받고 싶으세요?
→ 일상 외출·약속, 여행·주말 외출, 결혼식

Q. 어떤 일을 하고 계세요?
→ 배우·모델 (미디어·콘텐츠·예술)

Q. 지금 스타일에서 가장 자주 막히거나 아쉬운 점은?
→ 어떻게 매칭해야 할지 모르겠다

Q. 지금 옷장에서 가장 아쉬운 카테고리가 있나요?
→ 딱히 없음

Q. 어떤 스타일에 끌리나요?
→ 빈티지·레트로, 워크웨어·밀리터리, 클래식·포멀

Q. 절대 하고 싶지 않은 스타일이 있나요?
→ 몸에 달라붙는 스타일, 컬러·패턴이 화려한 스타일

Q. 평소 자주 입는 색 계열은?
→ 블랙·화이트·그레이, 카키·올리브, 베이지·브라운·카멜

Q. 반대로 피하고 싶은 색이 있나요?
→ 라벤더·민트·핑크 (파스텔)

Q. 피부톤이 어떤 편인가요?
→ 가을 웜톤 — 까무잡잡하거나 구릿빛인 편

Q. 즐겨 입는 브랜드가 있나요?
→ 칼하트 WIP, 리바이스, 엔지니어드가먼츠, RRL

Q. 키를 알려주세요
→ 178

Q. 몸무게를 알려주세요
→ 73

Q. 체형이 어떤 편인가요?
→ 역삼각형 — 어깨 넓고 허리·하체는 좁은 편

Q. 체형에서 신경 쓰이는 부분이 있나요?
→ 특별히 없다

Q. 생년월일을 알려주세요
→ 1981

Q. 지금 스타일에서 얼마나 바꾸고 싶나요?
→ 지금 방향 유지하면서 더 잘 입고 싶다

Q. 절대 바꾸고 싶지 않은 스타일 요소가 있나요?
→ 데님. 어떤 상황에서도 데님은 항상 있어야 한다

Q. 스타일에 쓸 수 있는 예산은?
→ 50~100만원

Q. 보고서에 꼭 반영됐으면 하는 점이 있나요?
→ 나이 들어도 유지할 수 있는 스타일. 트렌드보다 내 것.`,
  },
  {
    id: 'steven-yeun',
    name: '스티븐 연',
    answers: `Q. 어떠한 이미지로 비춰지길 원하나요?
→ 나다운 스타일이 있어 보이고 싶다, 세련되고 고급스러워 보이고 싶다

Q. 닮고 싶은 인물이 있나요?
→ 딱히 없음

Q. 그 인물의 어떤 점이 끌리나요?
→ (미입력)

Q. 패션에 얼마나 관심 있고 잘 아세요?
→ 내 기준이 생긴 편 — 브랜드·핏·실루엣 보는 눈 있음

Q. 업무 환경의 드레스코드는?
→ 완전 자유

Q. 어떤 상황에 입을 옷을 추천받고 싶으세요?
→ 일상 외출·약속, 비즈니스 행사·면접·네트워킹, 파티·특별한 모임

Q. 어떤 일을 하고 계세요?
→ 배우·모델 (미디어·콘텐츠·예술)

Q. 지금 스타일에서 가장 자주 막히거나 아쉬운 점은?
→ 감각 있게 입는 방법을 모르겠다

Q. 지금 옷장에서 가장 아쉬운 카테고리가 있나요?
→ 딱히 없음

Q. 어떤 스타일에 끌리나요?
→ 미니멀·클린, 클래식·포멀

Q. 절대 하고 싶지 않은 스타일이 있나요?
→ 너무 유행하는 스타일, 그래픽·로고가 강한 스타일

Q. 평소 자주 입는 색 계열은?
→ 블랙·화이트·그레이, 네이비·버건디

Q. 반대로 피하고 싶은 색이 있나요?
→ 레드·블루·그린·머스타드 (선명한 컬러), 라벤더·민트·핑크 (파스텔)

Q. 피부톤이 어떤 편인가요?
→ 가을 웜톤 — 까무잡잡하거나 구릿빛인 편

Q. 즐겨 입는 브랜드가 있나요?
→ 아크네, 우영미, 보테가 베네타, 생로랑, 마르지엘라

Q. 키를 알려주세요
→ 175

Q. 몸무게를 알려주세요
→ 70

Q. 체형이 어떤 편인가요?
→ 표준형 — 특별한 특징 없이 균형 잡힌 편

Q. 체형에서 신경 쓰이는 부분이 있나요?
→ 특별히 없다

Q. 생년월일을 알려주세요
→ 1983

Q. 지금 스타일에서 얼마나 바꾸고 싶나요?
→ 디테일만 다듬고 싶다

Q. 절대 바꾸고 싶지 않은 스타일 요소가 있나요?
→ 블랙. 블랙은 항상 기준이 된다.

Q. 스타일에 쓸 수 있는 예산은?
→ 300만원 이상

Q. 보고서에 꼭 반영됐으면 하는 점이 있나요?
→ LA와 서울 사이. 두 문화를 자연스럽게 담는 스타일.`,
  },
];

function parseJson(text) {
  const s = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try { return JSON.parse(s); } catch {
    const start = s.indexOf('{'), end = s.lastIndexOf('}');
    if (start !== -1 && end > start) return JSON.parse(s.slice(start, end + 1));
    throw new Error('invalid JSON');
  }
}

async function generate(persona) {
  console.log(`\n▶ ${persona.name} 보고서 생성 중...`);
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 6000,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: `[설문 응답]\n\n${persona.answers}` }],
  });
  const raw = msg.content?.[0]?.text ?? '';
  const report = parseJson(raw);
  console.log(`  ✓ ${persona.name} 완료`);
  return report;
}

async function main() {
  mkdirSync(join(ROOT, 'src/data/samples'), { recursive: true });

  for (const persona of PERSONAS) {
    try {
      const report = await generate(persona);
      const outPath = join(ROOT, `src/data/samples/${persona.id}.json`);
      writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
      console.log(`  저장: src/data/samples/${persona.id}.json`);
    } catch (err) {
      console.error(`  ✗ ${persona.name} 실패:`, err.message);
    }
  }
  console.log('\n✅ 완료');
}

main();
