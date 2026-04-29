import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1];
  const { data, error } = await supabase.auth.getUser(token);
  if (error) throw error;
  return data.user ?? null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const user = await getAuthenticatedUser(req);
    const { prescriptionData, answers, fitPics, nickname, fromType } = req.body;
    const fitPicList = Array.isArray(fitPics) ? fitPics : [];

    const answersText = answers
      .map((a, i) => {
        const q = `Q${i + 1}. ${(a.question || "").replace(/\n/g, " ")}`;
        let ans = "";
        if (a.answer && a.selected?.length) {
          ans = `${a.answer} / 선택: ${a.selected.join(", ")}`;
        } else if (a.answer) {
          ans = a.answer;
        } else if (a.selected?.length) {
          ans = a.selected.join(", ");
        } else {
          ans = "(미입력)";
        }
        return `${q}\n→ ${ans}`;
      })
      .join("\n\n");

    const nicknameSection = nickname
      ? `사용자 닉네임: ${nickname}\n주어는 "당신" 대신 "${nickname}님"으로 쓴다.\n\n`
      : "";

    const prescriptionSection = prescriptionData?.free
      ? `[Prescription 기준 — 이미 확인된 이 사람의 스타일 방향]
당신의 스타일 기준: ${prescriptionData.free.core || "(없음)"}
스타일 진단: ${prescriptionData.free.insight || "(없음)"}

`
      : "[Prescription 기준 없음 — 사용자가 Prescription을 아직 완료하지 않았음]\n\n";

    const fitPicSection = fitPicList.length > 0
      ? `[현재 착장 사진]
- 사용자가 실제로 자주 입는 핏 사진 ${fitPicList.length}장을 첨부했습니다.
- 사진에서 읽을 수 있는 실루엣, 기장감, 사이즈 여유, 색 조합, 신발 연결 방식을 진단에 반영합니다.
- 얼굴 인상이나 민감한 신체 특성 단정은 피하고, 오직 스타일링과 핏 중심으로 해석합니다.

`
      : "";

    const prompt = `${nicknameSection}당신은 VIZUDEN의 Identity report를 작성하는 스타일 디렉터이자 분석가입니다.

[보고서 목적]
- 이 보고서는 Prescription에서 정리된 사용자의 스타일 기준이 왜 실제 외적 모습으로 이어지지 않는지 보여주고, 그 기준을 비주얼 정체성으로 구현하기 위한 우선순위와 시스템을 정리해주는 문서입니다.
- 단순한 진단이나 쇼핑 추천에서 끝나지 않고, 사용자가 실제로 어떤 요소부터 정리해야 하는지, 어떤 방식으로 반복 가능한 스타일을 만들 수 있는지까지 안내해야 합니다.

[반드시 도출할 것]
- 사용자가 외적으로 어떤 방향을 지향하는지
- 현재 구현 상태에서 이미 맞는 요소와 아직 안 맞는 요소
- 현재 상태와 이상향 사이에서 가장 크게 막히는 점
- 무엇부터 먼저 손대야 하는지에 대한 우선순위
- 반복 가능한 스타일링 시스템
- 유지 실패를 막기 위한 기본 원칙
- 지금 시도할 수 있는 제품군과 브랜드
- 이상향 인물과 연결해 참고할 수 있는 브랜드와 방향

[해석 절차]
- Prescription에서 도출된 스타일 기준과 현재 답변을 함께 봅니다.
- 사용자의 체형, 헤어, 보유 옷, 생활 방식, 예산 안에서 이미 맞는 요소를 찾습니다.
- 사용자가 적은 어려움을 목록처럼 반복하지 말고, 하나의 상태나 흐름으로 묶어 해석합니다.
- 현재 모습과 이상향 사이에서 무엇이 가장 크게 이어지지 않는지 찾습니다.
- 그 차이를 줄이기 위해 무엇을 먼저 고정해야 하는지 우선순위를 정합니다.
- 아이템 추천보다 먼저, 반복 가능한 조합 방식과 관리 방식을 정리합니다.
- 제품군과 브랜드는 "지금 시도할 수 있는 추천"과 "시야를 넓혀주는 참고 추천"으로 나누어 제시합니다.

[추론 원칙]
- 사용자가 직접 적은 내용을 반복하는 데 그치지 말고, 그 답이 실제로 뜻하는 상태를 풀어 설명합니다.
- 사용자가 제공한 정보 바깥의 사실을 단정하지 않습니다.
- 다만 입력값을 근거로 한 합리적인 추론은 허용합니다.
- 추론은 단정이 아니라 완곡한 표현으로 씁니다. 예: "~로 보입니다", "~에 가깝습니다", "~로 읽힙니다", "~를 중요하게 여기는 것으로 보입니다".
- 사용자의 어려움은 목록처럼 다시 적지 말고, 하나의 구조나 상태로 묶어 설명합니다.
- 필요하면 심리적 지향이나 무의식적 선택 패턴까지 해석할 수 있지만, 반드시 스타일 구현과 연결되는 범위 안에서만 다룹니다.

[작성 원칙]
- 전체 문장은 지나치게 가볍지 않은, 정돈된 한국어로 작성합니다. 영어 단어와 번역투 표현, 업무용 표현은 쓰지 않습니다.
- 답변을 배열처럼 다시 나열하지 않습니다.
- "병목", "시스템", "운영" 같은 업무용 표현보다 "막히는 점", "이어지지 않는 상태", "반복되는 방식"처럼 생활 언어로 풉니다.
- 영어식 번역 표현이나 어색한 비유는 쓰지 않습니다. 예: "방향 위에 있다", "마감재", "같은 밀도로 맞물린다", "조합 틀", "작동한다".
- 중학생도 바로 이해할 수 있는 자연스러운 한국어로 씁니다.
- 현재 구현 상태에서는 이미 잘 맞는 요소, 아직 맞지 않는 요소, 왜 그 차이가 생기는지를 함께 설명합니다.
- 헤어, 체형, 그루밍, 스타일링은 따로 떨어진 문제가 아니라 하나의 인상으로 묶어 해석합니다.
- 사용자가 직접 입력한 텍스트는 가능한 경우 1회 이상 직접 언급하거나 자연스럽게 녹여 씁니다.
- 사용자의 답변을 따옴표로 길게 다시 옮기지 말고, 그 뜻을 자연스럽게 풀어 설명합니다.
- 브랜드나 제품 추천은 본문을 잡아먹지 않게 하고, 반드시 사용자의 이상향과 현재 상태에 연결해 설명합니다.
- "무엇을 사라"보다 "어떤 종류를 어떤 이유로 봐야 하는가"를 우선합니다.
- 추천 섹션은 가능하면 "하의", "상의", "아우터", "신발", "헤어"처럼 실제 탐색 단위로 나누어 설명합니다.
- 인물이 실제로 연결되는 브랜드를 참고 브랜드로 제시할 수 있습니다. 다만 근거가 분명한 경우에만 실제 브랜드를 연결하고, 그렇지 않으면 브랜드보다 스타일 특징과 미감을 설명합니다.
- "이상향 인물과 연결해 참고해볼 브랜드와 방향"은 가능하면 2개 문단으로 나눕니다. 첫 문단에서는 인물과 브랜드 또는 미감의 연결 이유를 설명하고, 둘째 문단에서는 그 방향을 사용자가 어떻게 참고하면 좋은지 정리합니다.
- 문장은 지나치게 짧지 않아도 되지만, 모든 문장은 새로운 해석이나 판단 근거를 제공해야 합니다.
- 각 섹션은 지정된 문장 수를 넘기지 않습니다. 불필요하게 길어지지 않게 쓰고, 같은 뜻을 반복하지 않습니다.
- 전체 보고서는 너무 짧지도 너무 길지도 않게, 대략 1,400~2,200자 수준의 밀도 있는 한국어 문장으로 작성합니다.
- "현재 구현 상태", "핵심 간극", "스타일링 시스템", "스타일이 계속 유지되려면"은 가능하면 2개 문단으로 나눕니다. 문단 사이는 빈 줄 한 줄로 구분합니다.
- "구현 우선순위"의 각 항목 설명도 길어지면 2개 문단으로 나눌 수 있습니다.

[금지사항]
- 사용자의 답변을 문장만 바꿔 다시 출력하는 방식
- 영어, 번역투, 업무용 표현
- 근거 없는 칭찬
- 심리상담처럼 과장된 해석
- 쇼핑 리스트가 본문을 대신하는 구조
- 특정 제품명이나 브랜드명을 길게 나열하는 방식
- 헤어샵 주문서, 제품 사용법, 구매 계획을 과하게 세세하게 적는 방식
- 사용자의 답변에 없는 성격, 배경, 경험을 사실처럼 단정하는 방식

반드시 아래 JSON 형식으로만 응답하고, 다른 텍스트는 포함하지 마세요.

---

${prescriptionSection}[Identity 설문 답변]
${answersText}

${fitPicSection}
---

다음 JSON 형식으로 Identity 보고서를 작성하세요:
{
  "title": "자연스러운 보고서 제목. 14~22자 내외. 광고 카피처럼 쓰지 말고 문서 제목처럼 담백하게 쓴다. 추상적인 명사 조합보다 이 사람의 실제 상황과 방향이 드러나는 명사구로 쓴다.",
  "identity": "섹션명은 '당신의 비주얼 정체성'. 정확히 1문장. 45자 이내가 바람직하다. 이 사람이 외적으로 어떤 방향으로 정리되고 싶은지 한 문장으로 정리한다.",
  "currentState": "섹션명은 '현재 상태'. 3~4문장. 이미 맞는 요소와 아직 안 맞는 요소를 함께 설명한다. 답변을 나열하지 말고 하나의 상태로 풀어 쓴다.",
  "gap": {
    "headline": "섹션명은 '지금 모습과 원하는 방향의 차이'. 1문장. 현재 모습과 이상향 사이에서 가장 크게 막히는 점을 원인 중심으로 쓴다.",
    "detail": "3~4문장. 사용자가 적은 여러 어려움을 하나의 상태로 묶어 해석한다."
  },
  "priorities": [
    {
      "title": "구현 우선순위 제목",
      "detail": "2~3문장. 무엇부터 먼저 정리해야 하는지, 왜 그것이 우선인지 설명한다."
    },
    {
      "title": "구현 우선순위 제목",
      "detail": "2~3문장. 무엇부터 먼저 정리해야 하는지, 왜 그것이 우선인지 설명한다."
    },
    {
      "title": "구현 우선순위 제목",
      "detail": "2~3문장. 무엇부터 먼저 정리해야 하는지, 왜 그것이 우선인지 설명한다."
    }
  ],
  "stylingSystem": "섹션명은 '코디의 기준'. 4~5문장. 반복 가능한 조합 공식과 기본 규칙을 설명한다. 무엇을 살까보다 어떻게 굴러가게 만들까를 우선한다.",
  "maintenance": "섹션명은 '스타일이 계속 유지되려면'. 3~4문장. 왜 다시 흔들리는지, 무엇을 줄이고 무엇을 고정해야 지속되는지 설명한다.",
  "actionPlan": {
    "twoWeeks": "섹션명은 '실행 계획'. 이번 2주 안에 할 일. 2문장.",
    "oneMonth": "한 달 안에 만들 변화. 2문장.",
    "threeMonths": "3개월 안에 기대할 수 있는 변화. 2문장."
  },
  "recommendations": {
    "practical": {
      "intro": "1~2문장. 이 추천 섹션의 전체 방향을 짧게 설명한다.",
      "categories": [
        {
          "category": "하의/상의/아우터/신발/헤어 중 하나",
          "keywords": "검색에 바로 쓸 수 있는 제품군 키워드 1~3개",
          "brands": "한국에서 찾기 쉬운 브랜드 2~4개",
          "match": "이 카테고리를 지금 어떻게 붙이면 좋은지 1~2문장",
          "effect": "이 카테고리가 정체성 구현에 어떤 효과를 주는지 1문장"
        }
      ]
    },
    "reference": "이상향 인물과 연결해 참고해볼 브랜드와 방향. 4~6문장. 가능하면 2개 문단으로 나눈다. 첫 문단에서는 인물과 브랜드 또는 미감의 연결 이유를 설명하고, 둘째 문단에서는 그 방향을 사용자가 어떻게 참고하면 좋은지 정리한다. 실제 브랜드 연결에 근거가 분명한 경우만 언급하고, 그렇지 않으면 스타일 특징과 미감 중심으로 설명한다. 단순히 브랜드를 이름만 나열하지 말고, 왜 그 인물과 연결되는지 짧게 설명한다."
  }
}`;

    let fitPicUrls = [];
    if (fitPicList.length > 0) {
      const paths = fitPicList.map((pic) => pic?.path).filter(Boolean);
      if (paths.length > 0) {
        const bucket = fitPicList[0]?.bucket || (process.env.SUPABASE_IDENTITY_FITPIC_BUCKET || "identity-fitpics");
        const { data: signedUrls, error: signedUrlError } = await supabase.storage
          .from(bucket)
          .createSignedUrls(paths, 60 * 60);
        if (signedUrlError) throw signedUrlError;
        fitPicUrls = (signedUrls || []).map((entry) => entry?.signedUrl).filter(Boolean);
      }
    }

    const content = [
      ...fitPicUrls.map((url) => ({
          type: "image",
          source: {
            type: "url",
            url,
          },
        })),
      { type: "text", text: prompt },
    ];

    const message = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 6400,
      temperature: 0.7,
      messages: [{ role: "user", content }],
    });

    const raw = message.content[0].text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const report = JSON.parse(raw);

    const basePayload = {
      type_code: fromType || null,
      title: report.title || null,
      answers: answers || null,
      fit_pics: fitPicList.length > 0 ? fitPicList : null,
      prompt,
      free: { identity: report.identity, currentState: report.currentState },
      full_report: report,
    };

    let { data, error } = await supabase
      .from("reports")
      .insert({
        ...basePayload,
        kind: "identity",
        user_id: user?.id ?? null,
      })
      .select("id")
      .single();

    if (error) {
      const fallback = await supabase
        .from("reports")
        .insert(basePayload)
        .select("id")
        .single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;

    return res.status(200).json({
      report,
      title: report.title || null,
      reportId: data.id,
      fitPicUrls,
    });
  } catch (e) {
    console.error("identity error:", e);
    return res.status(500).json({ error: e.message });
  }
}
