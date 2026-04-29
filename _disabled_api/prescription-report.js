import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { typeCode, typeInfo, answers } = req.body;

    const answersText = answers
      .map((a, i) => {
        const q = `Q${i + 1}. ${a.question.replace(/\n/g, " ")}`;
        const ans = a.selected
          ? a.selected.join(", ") + (a.other ? ` / 기타: ${a.other}` : "")
          : a.answer || "(미입력)";
        return `${q}\n→ ${ans}`;
      })
      .join("\n\n");

    const typeSection = typeInfo
      ? `유형 코드: ${typeCode}
유형명: ${typeInfo.nameKo} (${typeInfo.nameEn})
유형 설명: ${typeInfo.description}
스타일 축 요약:
- 동기: ${typeInfo.axisSummary.motivation}
- 방향성: ${typeInfo.axisSummary.orientation}
- 에너지: ${typeInfo.axisSummary.energy}
- 시간성: ${typeInfo.axisSummary.temporality}`
      : "유형 진단 없이 진행";

    const prompt = `당신은 남성 스타일 코치 전문가입니다.
사용자의 유형 진단 결과와 인테이크 답변을 바탕으로 개인화된 스타일 교정 보고서를 작성합니다.
말투는 전문가가 직접 설명하는 구어체로, 딱딱하지 않되 신뢰감이 있어야 합니다.
반드시 아래 JSON 형식으로만 응답하고, 다른 텍스트는 포함하지 마세요.

---

${typeSection}

인테이크 답변:
${answersText}

---

다음 JSON 형식으로 보고서를 작성하세요:
{
  "free": {
    "diagnosis": "2~3문장. 이 유형의 핵심 패턴과 현재 상황을 전문가가 직접 설명 (구어체). 무엇이 잘 되고 있고 무엇이 막히는지 명확히.",
    "coreIssue": "핵심 문제를 한 줄로 (명사형 또는 짧은 문장, 따옴표 없이)",
    "teaser": "이 문제를 잡으면 어떻게 달라지는지 1문장 (동기부여, 구어체)"
  },
  "full": {
    "rootCause": [
      "핵심 오류가 발생하는 구체적 상황과 이유",
      "그로 인해 생기는 결과 또는 반복되는 패턴"
    ],
    "actions": [
      { "timing": "오늘 당장", "action": "지금 바로 할 수 있는 가장 임팩트 있는 행동 1가지" },
      { "timing": "이번 주", "action": "이번 주 안에 실행할 행동 1가지" },
      { "timing": "다음 쇼핑 시", "action": "다음에 옷 살 때 반드시 지킬 기준 1가지" }
    ],
    "principleStatement": "나는 [상황]할 때, [기준]을 선택한다 — 형식으로 이 유형에 맞는 스타일 원칙 문장",
    "situationRules": [
      { "ctx": "일상·캐주얼", "note": "이 상황에서의 구체적 기준" },
      { "ctx": "세미포멀", "note": "이 상황에서의 구체적 기준" },
      { "ctx": "포멀", "note": "이 상황에서의 구체적 기준" }
    ],
    "recommendations": [
      { "item": "아이템 종류", "brand": "구체적 브랜드 또는 라인 예시", "reason": "이 유형에게 맞는 이유" },
      { "item": "아이템 종류", "brand": "구체적 브랜드 또는 라인 예시", "reason": "이 유형에게 맞는 이유" },
      { "item": "아이템 종류", "brand": "구체적 브랜드 또는 라인 예시", "reason": "이 유형에게 맞는 이유" }
    ],
    "avoid": [
      "피해야 할 것 1 (구체적으로)",
      "피해야 할 것 2 (구체적으로)",
      "피해야 할 것 3 (구체적으로)"
    ]
  }
}`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/,'').trim();
    const report = JSON.parse(raw);
    return res.status(200).json({ report });
  } catch (e) {
    console.error("prescription-report error:", e);
    return res.status(500).json({ error: e.message });
  }
}
