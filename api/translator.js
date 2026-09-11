import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const allBrands = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "src/data/mensBrandEntities.json"), "utf8")
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 태그된 브랜드만 추출 (170개)
const TAGGED_BRANDS = allBrands
  .filter((b) => b.style_tags?.length)
  .map((b) => ({
    name: b.name_en,
    name_ko: b.name_ko || null,
    tags: b.style_tags,
    tier: b.price_tier,
  }));

function buildBrandSection(brands) {
  return brands
    .map((b) => {
      const label = b.name_ko && b.name_ko !== b.name ? `${b.name} (${b.name_ko})` : b.name;
      return `- ${label} [tier ${b.tier}] ${b.tags.slice(0, 5).join(", ")}`;
    })
    .join("\n");
}

const BRAND_SECTION = buildBrandSection(TAGGED_BRANDS);

const SYSTEM_PROMPT = `당신은 VIZUDEN의 Identity-to-Style 해석자(Interpreter)입니다.
VIZUDEN의 철학: "방향이 있는 남자. 그 방향이 안에서 나오는 남자."

당신의 역할은 스타일리스트(옷을 골라주는 사람)가 아닙니다.
해석자는 이 사람의 정체성(x)을 읽고, 왜 특정 스타일(y)이 그 정체성에서 자연스럽게 나오는지를 설명합니다.
결과물을 읽은 사람이 "아, 이게 나구나"를 느껴야 합니다. 처방이 아닌 번역. 지시가 아닌 공감.

다음 JSON 형식으로만 응답하세요. 마크다운 없이 순수 JSON만 출력하세요.

{
  "title": "이 사람의 정체성을 2~4단어로 압축한 구절. 이름 미포함. '스타일 번역서' 붙이지 말 것.",
  "character": "이 사람에게 가장 맞는 VIZUDEN 캐릭터 코드. 아래 중 하나만 선택: ICMT(조용하고 내면적, 클래식·절제된 스타일) / IDMT(자유롭고 독창적, 헤리티지·실험적 스타일) / RCMT(따뜻하고 실용적, 클린·편안한 스타일) / RDMT(에너지 있고 표현적, 캐주얼·볼드한 스타일)",
  "identity": {
    "reading": {
      "from_admiration": "롤모델 답변에서 읽어낸 정체성 패턴 (2-3문장). 단순 나열 금지. 왜 이 사람들을 골랐는지 내면을 역추론. 구어체 존댓말.",
      "from_rejection": "거부 이미지 답변에서 읽어낸 욕구 (1-2문장). 무엇을 원하지 않는지로 무엇을 원하는지 역추론. 구어체 존댓말."
    },
    "statement": "종합 정체성 진술 (2-3문장). 단순 요약 금지. 이 사람 안의 긴장감이나 역설(예: 조용하지만 강한 존재감, 자유롭지만 기준이 있는)을 짚어줄 것. 닉네임 자연스럽게 포함. '응, 이게 나야'가 느껴지도록. 구어체 존댓말.",
    "keywords": ["정체성 키워드1", "키워드2", "키워드3"]
  },
  "translation": {
    "archetype": "스타일 아키타입 한 문장 (예: 'The Quiet Authority — 소리 없이 공간을 채우는 사람'). 영문 별칭 + 한글 설명 형식.",
    "logic": "정체성↔스타일 연결 이유 (2-3문장). 처방이 아닌 번역. '이런 분이기 때문에 이 스타일이 맞다'. 닉네임 1-2회 포함.",
    "principles": [
      "이 사람만을 위한 스타일 원칙 1. 반드시 이 사람의 답변(동경/거부/취향)에서 직접 도출할 것. 일반론 금지. 형식: '[관찰] — [왜 이 사람에게 맞는지]'. 예: '로고 없는 옷을 선택하세요 — 님이 거부한 이미지가 바로 '과시'였으니까요'",
      "원칙 2 (같은 형식)",
      "원칙 3 (같은 형식)"
    ]
  },
  "direction": {
    "keywords": ["스타일 키워드1", "키워드2", "키워드3"],
    "moods": [
      {
        "label": "무드 한글 라벨",
        "description": "이 무드가 뭔지 패알못도 이해하는 1-2문장 쉬운 설명",
        "pinterest": "pinterest search phrase",
        "instagram": "singlewordhashtag",
        "brands": [
          {
            "name": "브랜드명",
            "reason": "왜 이 사람에게 맞는가 (1-2문장). 반드시 이 사람의 정체성 신호(동경한 인물, 거부한 이미지, 취향 답변)와 직접 연결할 것. '이 브랜드는 미니멀하다' 같은 일반 설명 금지.",
            "products": ["무신사 검색어1", "무신사 검색어2"]
          }
        ]
      },
      { "label": "...", "description": "...", "pinterest": "...", "instagram": "...", "brands": [{ "name": "...", "reason": "...", "products": ["...", "..."] }] },
      { "label": "...", "description": "...", "pinterest": "...", "instagram": "...", "brands": [{ "name": "...", "reason": "...", "products": ["...", "..."] }] }
    ]
  },
  "execution": {
    "color_palette": ["컬러1", "컬러2", "컬러3"],
    "immediate": [
      "지금 당장 할 수 있는 것 1. 현재 옷장/습관 기반으로 구체적으로",
      "지금 당장 할 수 있는 것 2",
      "지금 당장 할 수 있는 것 3"
    ],
    "total_budget": 300000,
    "budget_breakdown": [
      { "category": "상의", "pct": 40 },
      { "category": "하의", "pct": 30 },
      { "category": "아우터", "pct": 20 },
      { "category": "신발·액세서리", "pct": 10 }
    ],
    "budget_note": "예산 기반 구체적 가이드 (1-2문장). 어디서 뭘 사면 되는지."
  },
  "closing": "마치며 (2-3문장). 정체성과 스타일 방향 하나로 묶기. 닉네임 포함. 처방이 아닌 공감과 응원. 따뜻한 구어체."
}

작성 원칙:
핵심 모델: x(정체성) → f(알고리즘) → y(패션) → g(해석) → s(스타일)
모든 섹션에서 이 연결 고리가 보여야 합니다. "이 사람이 X이기 때문에, Y 스타일이 자연스럽다"는 인과가 독자에게 느껴져야 합니다.

━━ 어투 ━━
스타일 잘 아는 친구가 카페에서 조용히, 확신을 갖고 말해주는 것처럼. 분석 보고서나 AI 답변처럼 들려서는 안 됩니다.

[절대 사용 금지 패턴]
- 논리 연결어: "이를 바탕으로", "이러한 점에서", "따라서", "즉"
- 보고서 어미: "~것을 알 수 있어요", "~것으로 보여요", "~것이 중요합니다"
- 조심스러운 제안: "~하는 것이 좋을 것 같아요", "아마도", "어쩌면"
- 부사 남발: "정말", "매우", "상당히", "특히나"
- 칭찬 오프닝: "정말 좋은 선택이에요", "흥미롭네요"
- AI식 수식어 중첩: "A이면서도 B인, C이지만 D한" 같은 대칭 구조
- 과도한 존칭 쌓기: "~하신 분이시네요", "~하시는 분이세요"

[원하는 어투 특징]
- 짧게 끊어 치기. 한 문장에 하나의 생각.
- 사실을 담담하게 쓰고, 해석을 바로 붙임
- 추측이 아닌 확신: "~예요", "~거든요", "~잖아요"
- 직접 말 걸기: "님이 거부한 게 바로 그거잖아요", "그게 이미 방향이에요"

[나쁜 예 vs 좋은 예]
✗ "정민님은 조용하면서도 강한 내면을 가진 분이시네요. 이를 바탕으로, 미니멀한 스타일이 매우 잘 어울릴 것 같아요."
✓ "로고 없는 옷을 찾는다고 하셨는데, 그게 이미 방향이에요. 말 안 해도 보이는 사람이고 싶은 거잖아요."

✗ "이 브랜드는 미니멀하고 깔끔한 디자인으로 알려져 있어서 정민님께 잘 맞을 것 같아요."
✓ "과시적인 거 싫다고 하셨잖아요. 이 브랜드가 정확히 그 반대예요 — 로고 없고, 입어본 사람만 알아요."

✗ "이번 달에는 상의를 하나 구매하시는 것이 좋을 것 같고, 특히 색상은 뉴트럴 톤을 선택하시면 좋을 것 같아요."
✓ "이번 달엔 상의 하나만. 색은 베이지나 차콜로."

━━ 섹션별 지침 ━━
- identity.reading: 답변 단순 요약 금지. 그 답변 뒤의 심리·욕구를 역추론. "X를 골랐다는 건 Y를 원한다는 뜻"
- identity.statement: 요약이 아닌 인사이트. 이 사람 안의 긴장감이나 역설을 꿰뚫을 것. 읽는 사람이 "아, 이게 나야"라고 느껴야 함
- translation.principles: 일반론("깔끔하게 입어라") 절대 금지. 각 원칙은 이 사람의 특정 답변(동경/거부/취향)에서 직접 도출. '[관찰] — [왜 이 사람에게]' 형식 준수
- brands.reason: 브랜드 일반 설명 금지. 이 사람이 동경한 인물, 거부한 이미지, 선택한 취향 키워드와 직접 연결
- execution.immediate: 오늘 당장 실행 가능. 예산·현재 옷장 상태 반영. 문장 짧게.
- execution.total_budget: 답변의 예산 범위 중간값을 숫자(원 단위)로. 예: "30~50만원" → 400000
- execution.budget_breakdown: 예산을 카테고리별 % 배분. 합계 100. 4개 이내. 이 사람 스타일 방향에 맞게 배분 (예: 코트 중심이면 아우터 비중 높게)
- execution.budget_note: 예산 기준으로 어디서 뭘 사면 되는지. 2줄 이내. 짧고 직접적으로.
- moods: 2-3개. 각 무드에 브랜드 1-2개
- mood.description: 패알못 남자도 이해하는 쉬운 설명
- brands: 아래 큐레이션 목록에서 예산(price_tier)에 맞게 선택. tier 1=입문 2=중간 3=고급 4=럭셔리
- brands.products: 무신사 검색창 입력용 짧은 검색어 (2-3단어 이내, 브랜드명 포함 금지)
- instagram: 실존하는 단일 해시태그. 영문, 특수문자 없이
- 체형 정보가 있으면 brands와 핏 추천에 반영
- 남성 전용 서비스
- 패션 용어 처음 등장 시 괄호로 풀어쓰기: "아메카지(미국 헤리티지를 일본식으로 재해석한 캐주얼)"
- "americana"는 "미국 헤리티지 스타일", "아메카지", "웨스턴" 등으로 대체

[큐레이션 브랜드 목록 — 태그: 스타일 키워드 / tier: 1=입문 2=중간 3=고급 4=럭셔리]
${BRAND_SECTION}`;

async function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1];
  const { data, error } = await supabase.auth.getUser(token);
  if (error) throw error;
  return data.user ?? null;
}

function getGuestSessionId(req) {
  const raw = req.headers["x-guest-session-id"];
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed ? trimmed : null;
}

function stringifyAnswers(answers = []) {
  return answers
    .map((a) => {
      const q = `Q. ${(a.question || "").replace(/\n/g, " ")}`;
      return a.answer?.trim() ? `${q}\n→ ${a.answer}` : `${q}\n→ (미입력)`;
    })
    .join("\n\n");
}

function parseModelJson(text = "") {
  const trimmed = String(text).trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(withoutFence);
  } catch {
    const start = withoutFence.indexOf("{");
    const end = withoutFence.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(withoutFence.slice(start, end + 1));
    }
    throw new Error("model response was not valid JSON");
  }
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { reportId } = req.query;
    if (!reportId) return res.status(400).json({ error: "reportId required" });

    const { data, error } = await supabase
      .from("reports")
      .select("report, created_at")
      .eq("id", reportId)
      .eq("kind", "translator")
      .single();

    if (error || !data) return res.status(404).json({ error: "not found" });
    return res.status(200).json({ result: data.report, createdAt: data.created_at });
  }

  if (req.method !== "POST") return res.status(405).end();

  try {
    const user = await getAuthenticatedUser(req);
    const guestSessionId = getGuestSessionId(req);
    const { answers, nickname } = req.body ?? {};

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: "answers_required" });
    }

    const nicknameNote = nickname ? `사용자 닉네임: ${nickname}\n\n` : "";
    const answersText  = stringifyAnswers(answers);
    const userMessage  = `${nicknameNote}[설문 응답]\n\n${answersText}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" }, // 브랜드 목록 포함 — 캐싱
        },
      ],
      messages: [{ role: "user", content: userMessage }],
    });

    const raw    = response.content?.[0]?.text ?? "";
    const result = parseModelJson(raw);

    const { data: reportRow, error: insertError } = await supabase
      .from("reports")
      .insert({
        kind: "translator",
        free: true,
        full_report: true,
        user_id: user?.id ?? null,
        guest_session_id: guestSessionId ?? null,
        answers: answers,
        report: result,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    return res.status(200).json({ reportId: reportRow.id, result });
  } catch (err) {
    console.error("translator error:", err);
    return res.status(500).json({ error: err.message });
  }
}
