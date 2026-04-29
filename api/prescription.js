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

function getGuestSessionId(req) {
  const raw = req.headers["x-guest-session-id"];
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed ? trimmed : null;
}

function stringifyAnswers(answers = []) {
  return answers
    .map((a, i) => {
      const q = `Q${i + 1}. ${(a.question || "").replace(/\n/g, " ")}`;
      if (a.answer) return `${q}\n→ ${a.answer}`;
      if (a.selected?.length) {
        const selected = a.selected.join(", ");
        return `${q}\n→ ${selected}${a.other ? ` / 기타: ${a.other}` : ""}`;
      }
      return `${q}\n→ (미입력)`;
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
  if (req.method !== "POST") return res.status(405).end();

  try {
    const user = await getAuthenticatedUser(req);
    const guestSessionId = getGuestSessionId(req);
    const { typeCode, typeInfo, answers, fitPics, nickname, code } = req.body;

    // 초대 코드 검증 (Claude 호출 전)
    if (!code || typeof code !== "string") {
      return res.status(403).json({ error: "code_required" });
    }
    const { data: codeData, error: codeErr } = await supabase
      .from("prescription_codes")
      .select("use_count, max_uses, is_active")
      .eq("code", code.trim())
      .maybeSingle();

    if (codeErr || !codeData || !codeData.is_active || codeData.use_count >= codeData.max_uses) {
      return res.status(403).json({ error: "code_invalid" });
    }
    const fitPicList = Array.isArray(fitPics) ? fitPics : [];

    const nicknameSection = nickname
      ? `사용자 닉네임: ${nickname}\\n주어는 "${nickname}님"으로 씁니다.\\n\\n`
      : "";

    const typeSection = typeInfo
      ? `[유형 정보]
유형 코드: ${typeCode}
유형명: ${typeInfo.nameKo} (${typeInfo.nameEn})
유형 설명: ${typeInfo.description}
- 동기: ${typeInfo.axisSummary.motivation}
- 방향성: ${typeInfo.axisSummary.orientation}
- 에너지: ${typeInfo.axisSummary.energy}
- 시간성: ${typeInfo.axisSummary.temporality}

`
      : "";

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

    const fitPicSection = fitPicList.length > 0
      ? `[착장 사진]
- 사용자가 현재 자주 입는 착장 사진 ${fitPicList.length}장을 첨부했습니다.
- 사진에서는 체형을 과장해서 단정하지 말고, 핏, 기장, 실루엣, 색 조합, 신발 연결을 중심으로 읽습니다.
- 얼굴 평가는 하지 않습니다. 오직 스타일링과 비율만 봅니다.

`
      : "";

    const answersText = stringifyAnswers(answers);

    const prompt = `${nicknameSection}당신은 VIZUDEN의 스타일 처방전을 작성하는 남성 스타일 디렉터입니다.

[보고서 목적]
- 이 보고서는 사용자의 취향을 길게 읽어주는 글이 아니라, 지금 더 나아 보이기 위해 바로 가져갈 수 있는 기준과 코디 방향을 정리하는 문서입니다.
- 반복 설명은 줄이고, 바로 써먹을 수 있는 판단과 처방을 우선합니다.

[이 보고서에서 꼭 나와야 하는 결과물]
1. 사용자가 지향하는 스타일 방향 한 문장
2. 앞으로 계속 가져가야 할 기준 3개
3. 체형과 현재 상태에 맞는 코디 기준
4. 바로 써먹는 스타일 공식과 짧은 실행 계획
5. 제품군과 브랜드 추천

[작성 원칙]
- 답변을 다시 나열하지 않습니다.
- 같은 뜻을 다시 풀어 말하지 않습니다.
- 길게 읽어주는 진단문보다, 실제로 쓰이는 기준을 우선합니다.
- 영어식 표현, 업계 용어, 번역투를 쓰지 않습니다.
- 중학생도 바로 이해할 수 있는 자연스러운 한국어로 씁니다.
- 남성 사용자가 특히 체형, 핏, 코디, 쇼핑 기준에 반응한다는 점을 반영합니다.
- 체형을 설명할 때는 민감한 평가나 과장을 피하고, 어떻게 입으면 더 나아 보이는지로 바로 연결합니다.
- 제품 추천은 커뮤니티식 무난 추천으로 끝내지 말고, 이 사용자의 이상향과 현재 상태에 연결해 설명합니다.
- 국내에서 찾기 쉬운 브랜드를 우선하되, 보너스 참고 브랜드는 더 넓게 시야를 열어주는 용도로만 씁니다.
- 보너스 참고 브랜드는 실제 인물과 연결 근거가 분명할 때만 구체적으로 씁니다.

[문체 원칙]
- 짧고 또렷하게 씁니다.
- 각 섹션은 새로운 판단을 줘야 합니다.
- 장황한 해설 대신, 사용자가 바로 이해하고 옮길 수 있는 문장으로 씁니다.

[금지사항]
- 답변 재인용
- 추상어 남발
- 브랜드 이름만 길게 나열
- 쇼핑 리스트처럼 쓰기
- 과한 칭찬
- 사용자가 말하지 않은 사실 단정

${typeSection}${fitPicSection}[설문 답변]
${answersText}

다음 JSON 형식으로만 응답하세요:
{
  "title": "자연스러운 문서 제목. 12~22자. 광고 문구처럼 쓰지 말고 담백하게",
  "direction": "섹션명은 '당신의 스타일 방향'. 정확히 1문장",
  "criteria": [
    {
      "title": "가져가야 할 기준 한 줄",
      "detail": "왜 이 기준이 필요한지 2~3문장"
    },
    {
      "title": "가져가야 할 기준 한 줄",
      "detail": "왜 이 기준이 필요한지 2~3문장"
    },
    {
      "title": "가져가야 할 기준 한 줄",
      "detail": "왜 이 기준이 필요한지 2~3문장"
    }
  ],
  "bodyGuide": "섹션명은 '체형에 맞는 코디 기준'. 4~6문장. 상의 길이, 하의 핏, 피해야 할 실루엣, 신발이나 헤어가 인상에 주는 역할까지 포함할 수 있다.",
  "stylingFormula": {
    "intro": "섹션명은 '바로 써먹는 스타일 공식'. 1~2문장",
    "formulas": [
      {
        "title": "코디 공식 제목",
        "detail": "실제로 돌려 입을 수 있는 조합 설명 2문장"
      },
      {
        "title": "코디 공식 제목",
        "detail": "실제로 돌려 입을 수 있는 조합 설명 2문장"
      }
    ],
    "actionPlan": {
      "thisWeek": "이번 주에 할 일. 1~2문장",
      "thisMonth": "이번 달에 만들 변화. 1~2문장",
      "threeMonths": "3개월 안에 기대할 변화. 1~2문장"
    }
  },
  "recommendations": {
    "practical": {
      "intro": "섹션명은 '제품군과 브랜드 추천'. 1~2문장",
      "categories": [
        {
          "category": "하의/상의/아우터/신발/헤어 중 하나",
          "keywords": "검색 키워드 1~3개",
          "brands": "한국에서 찾기 쉬운 브랜드 2~4개",
          "match": "매칭 방향 1~2문장",
          "effect": "기대되는 인상 1문장"
        }
      ]
    },
    "reference": "보너스: 더 넓게 참고할 브랜드와 방향. 3~5문장. 인물 연결이 없으면 비워도 된다."
  }
}`;

    const content = [
      ...fitPicUrls.map((url) => ({
        type: "image",
        source: { type: "url", url },
      })),
      { type: "text", text: prompt },
    ];

    const message = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 5200,
      temperature: 0.7,
      messages: [{ role: "user", content }],
    });

    const report = parseModelJson(message.content[0]?.text || "");

    const basePayload = {
      type_code: typeCode || null,
      title: report.title || null,
      answers: answers || null,
      fit_pics: fitPicList.length > 0 ? fitPicList : null,
      prompt,
      free: { direction: report.direction },
      full_report: report,
    };

    let { data, error } = await supabase
      .from("reports")
      .insert({
        ...basePayload,
        kind: "prescription",
        user_id: user?.id ?? null,
        guest_session_id: user?.id ? null : guestSessionId,
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

    // 코드 사용 횟수 증가 (낙관적 잠금: 동시 요청 시 초과 방지)
    await supabase
      .from("prescription_codes")
      .update({ use_count: codeData.use_count + 1 })
      .eq("code", code.trim())
      .eq("use_count", codeData.use_count);

    return res.status(200).json({
      report,
      title: report.title || null,
      reportId: data.id,
    });
  } catch (e) {
    console.error("prescription error:", e);
    return res.status(500).json({ error: e.message });
  }
}
