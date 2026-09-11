// 한국어 어투 윤문 (2단계 후처리)
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function humanizeReport(report) {
  const FIELDS = [
    ['mirror', 'lead'],
    ['mirror', 'body'],
    ['mirror', 'blockers_note'],
    ['identity', 'from_reference'],
    ['identity', 'body'],
    ['fit', 'photo_read'],
    ['fit', 'concern_advice'],
    ['fit', 'top'],
    ['fit', 'bottom'],
    ['fit', 'outer'],
    ['closing', 'body'],
  ].filter(([s, k]) => report[s]?.[k]);

  if (!FIELDS.length) return report;

  const input = FIELDS.map(([s, k]) => `[${s}.${k}]\n${report[s][k]}`).join('\n\n');

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: `한국어 텍스트의 AI 어투를 자연스러운 구어체로 윤문합니다.
[필드명] 형식 그대로 유지해 출력. 의미·고유명사·수치 변경 금지. 작은따옴표 인용('...')은 사용자의 실제 표현이므로 인용 형태와 문구 그대로 유지.
[절대 금지] ~셨을 겁니다 / ~겠습니다 / 옷이 말한다·대화한다 류 의인화 / 이를 바탕으로·따라서·즉 / A이면서도 B인 대칭 구조
[용어] 패션 용어는 한국에서 실제 통용되는 표기로 교정 (예: '터크인' → '턱인'). 어색한 음차·불필요한 영어 병기 제거. 뜻풀이 괄호는 처음 한 번만, 자연스러운 한글로.
[선호] ~예요 / ~거든요 / ~잖아요 / 짧게 끊어 치기 / 실제 말하듯`,
    messages: [{ role: 'user', content: input }],
  });

  const out = msg.content[0]?.text ?? '';
  const updated = JSON.parse(JSON.stringify(report));

  FIELDS.forEach(([s, k]) => {
    const re = new RegExp(`\\[${s}\\.${k}\\]\\n([\\s\\S]*?)(?=\\n\\[|$)`);
    const m = out.match(re);
    if (m?.[1]) updated[s][k] = m[1].trim();
  });

  return updated;
}

