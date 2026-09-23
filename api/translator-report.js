import { saveTranslatorReport } from "./_lib/saveTranslatorReport.js";
import Anthropic from "@anthropic-ai/sdk";
import { getAuthenticatedUser, supabase } from "./_lib/auth.js";
import {
  SYSTEM_PROMPT, buildAnswerText,
  extractReferencePerson, extractStyleHint,
} from "./_lib/translatorPrompt.js";
import {
  searchReferenceStyle, searchCurrentWeatherContext, searchEditorialTrends,
} from "./_lib/translatorSearches.js";
import { humanizeReport } from "./_lib/translatorHumanize.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ADMIN_USER_IDS = new Set(["bb212db4-994c-42b2-951b-c6a860ec09ec"]);

function parseJson(text = "") {
  const s = String(text).trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try { return JSON.parse(s); } catch {
    const start = s.indexOf("{"), end = s.lastIndexOf("}");
    if (start !== -1 && end > start) return JSON.parse(s.slice(start, end + 1));
    throw new Error("invalid JSON from model");
  }
}

export default async function handler(req, res) {
  // GET: 저장된 보고서 조회 (공개/unlisted)
  // 링크(intakeId=UUID)를 아는 사람은 누구나 저장된 보고서 본문을 볼 수 있음.
  // 소유자 확인 없음 — 단, 체형 사진 등 민감정보는 별도 엔드포인트(translator-intake-detail)에서
  // 여전히 소유자만 접근 가능하므로 남에게 노출되지 않는다. 여기서는 report 본문만 반환.
  if (req.method === "GET") {
    const { intakeId } = req.query;
    if (!intakeId) return res.status(400).json({ error: "intakeId required" });

    const { data, error } = await supabase
      .from("consulting_intakes")
      .select("id, report, report_generated_at")
      .eq("id", intakeId)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "not_found" });

    // 실제 발행 순번 — 이 보고서까지 생성된 보고서 수
    let reportNo = null;
    if (data.report && data.report_generated_at) {
      const { count } = await supabase
        .from("consulting_intakes")
        .select("id", { count: "exact", head: true })
        .not("report_generated_at", "is", null)
        .lte("report_generated_at", data.report_generated_at);
      if (typeof count === "number") reportNo = count;
    }

    return res.status(200).json({
      report: data.report ?? null,
      generatedAt: data.report_generated_at ?? null,
      reportNo,
    });
  }

  // POST: 보고서 생성 (어드민 전용)
  if (req.method !== "POST") return res.status(405).end();

  let keepalive;
  try {
    const user = await getAuthenticatedUser(req);
    const guestSessionId = (req.headers["x-guest-session-id"] || "").trim() || null;
    const isAdmin = user && ADMIN_USER_IDS.has(user.id);

    const { intakeId, nickname } = req.body ?? {};
    if (!intakeId) return res.status(400).json({ error: "intakeId required" });

    // 설문 응답 조회 — 본인 또는 어드민만
    let intakeQuery = supabase
      .from("consulting_intakes")
      .select("id, answers, fit_pics, user_id, guest_session_id, report, report_generated_at")
      .eq("id", intakeId);

    if (!isAdmin) {
      if (user) {
        intakeQuery = intakeQuery.eq("user_id", user.id);
      } else if (guestSessionId) {
        intakeQuery = intakeQuery.eq("guest_session_id", guestSessionId);
      } else {
        return res.status(401).json({ error: "auth_required" });
      }
    }

    const { data: intake, error: fetchError } = await intakeQuery.maybeSingle();

    if (fetchError) throw fetchError;
    if (!intake) return res.status(404).json({ error: "intake_not_found" });

    // 멱등 가드: 이미 생성된 보고서가 있으면 재생성하지 않고 그대로 스트리밍 반환
    // (열 때마다 덮어쓰기·Claude 토큰 비용 발생 방지)
    if (intake.report && typeof intake.report === "object" && Object.keys(intake.report).length > 0) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      let reportNo = null;
      try {
        const { count } = await supabase
          .from("consulting_intakes")
          .select("id", { count: "exact", head: true })
          .not("report_generated_at", "is", null)
          .lte("report_generated_at", intake.report_generated_at);
        if (typeof count === "number") reportNo = count;
      } catch {}
      const donePayload = JSON.stringify({ type: "done", intakeId, report: intake.report, reportNo }).replace(/[\n\r\u2028\u2029]/g, " ");
      res.write(`data: ${donePayload}\n\n`);
      return res.end();
    }

    const answers = Array.isArray(intake.answers) ? intake.answers : [];

    // 체형 사진 signed URL 생성 (멀티모달 분석용)
    let fitPicUrls = [];
    if (Array.isArray(intake.fit_pics) && intake.fit_pics.length > 0) {
      const paths = intake.fit_pics.map((p) => p?.path).filter(Boolean);
      if (paths.length > 0) {
        const bucket = intake.fit_pics[0]?.bucket || "identity-fitpics";
        const { data: signed } = await supabase.storage
          .from(bucket)
          .createSignedUrls(paths, 60 * 60);
        if (Array.isArray(signed)) fitPicUrls = signed.map((s) => s?.signedUrl).filter(Boolean);
      }
    }
    const fitPicCount = fitPicUrls.length;

    // 현재 날짜·계절 맥락
    const now = new Date();
    const month = now.getMonth() + 1;
    const seasonLabel = month >= 3 && month <= 5 ? '봄' : month >= 6 && month <= 8 ? '여름' : month >= 9 && month <= 11 ? '가을' : '겨울';
    const nextSeasonLabel = month >= 3 && month <= 5 ? '여름' : month >= 6 && month <= 8 ? '가을' : month >= 9 && month <= 11 ? '겨울' : '봄';
    const isTransition = [2, 5, 8, 11].includes(month);
    const seasonNote = `\n\n[현재 날짜: ${now.toISOString().slice(0,10)} / 계절: 한국 기준 ${seasonLabel}${isTransition ? ` (${nextSeasonLabel} 전환기)` : ''}]\nTPO의 season_note 및 스타일 추천은 현재 계절(${seasonLabel})에 맞는 소재·레이어링을 우선으로, ${nextSeasonLabel} 전환 시 활용 가능한 아이템도 함께 언급할 것.`;

    const fitPicNote = fitPicCount > 0
      ? `\n\n[첨부 사진: ${fitPicCount}장 — 위 이미지를 직접 분석할 것. (1)체형: 실제 어깨·상하체 비율 → fit.photo_read와 fit.concern_advice/top/bottom/outer에 근거로 반영. (2)피부톤: 사진 속 실제 얼굴·피부색 → color.skin_tone과 skin_tone_desc를 사진 기반으로 판단. (3)현재 착장: 지금 입은 옷의 핏·스타일이 잘 맞는지/아쉬운지 → fit.photo_read에 포함. 모든 사진 기반 판단은 추측이 아니라 실제 보이는 것에 근거할 것]`
      : "";

    // 레퍼런스 인물 + 날씨 뉴스 + 에디토리얼 트렌드 병렬 검색
    const referencePerson = extractReferencePerson(answers);
    const styleHint = extractStyleHint(answers);
    const [referenceContext, weatherContext, editorialContext] = await Promise.all([
      referencePerson ? searchReferenceStyle(referencePerson) : null,
      searchCurrentWeatherContext(month),
      searchEditorialTrends(seasonLabel, styleHint),
    ]);
    const referenceNote = referenceContext
      ? `\n\n[추구미 인물 웹 검색 결과]\n추구미 인물: ${referencePerson}\n${referenceContext}\n\n[이 정보 활용법 — 보고서 전체의 관통선. 매우 중요]\n우리 서비스의 핵심은 "정체성을 스타일로 번역"하는 것. 추구미 인물(${referencePerson})은 그 번역의 열쇠이자 보고서 전체를 관통하는 중심축이다. 결론에서만 언급하지 말고 처음부터 끝까지 실로 꿰어라.\n1) 먼저 위 '매력·이미지' 검색에서 사람들이 ${referencePerson}의 어떤 지점에 끌리는지(태도·분위기·페르소나의 본질)를 한 문장으로 정의할 것. 이게 '추구미의 핵심'.\n2) identity.from_reference: "당신이 ${referencePerson}에게 끌리는 건 사실 △△(그 핵심)이고, 그건 당신의 □□와 통해요" 식으로 초반에 명확히 심을 것. 인물 이름을 반드시 언급.\n3) direction.lead / brands.moods[].label·desc / brand.reason / tpo.note: 주요 추천마다 그 '추구미 핵심(△△)'과 연결해 왜 이걸 추천하는지 근거를 달 것. 예: "${referencePerson}의 △△를 당신 버전으로 만들려면 이 무드가 맞아요."\n4) 단, 그 사람 옷을 복사가 아니라 '매력의 원리'를 사용자 몸·예산·삶에 맞게 번역. 인물이 실제 자주 입는 브랜드가 있으면 brands에 반영.\n5) closing에서 그 관통선을 다시 매듭지어 "아 그래서 처음부터 ${referencePerson}였구나"를 느끼게 할 것.`
      : '';
    const weatherNote = weatherContext
      ? `\n\n[현재 날씨·계절 뉴스 — 웹 검색 결과]\n${weatherContext}\n위 날씨·계절 맥락(장마, 폭염, 환절기 등)을 TPO season_note 및 스타일 추천에 반영하세요. 예: 장마철이면 방수 소재·워터프루프 아이템 우선 추천.`
      : '';
    const editorialNote = editorialContext
      ? `\n\n[최신 패션 에디토리얼·매거진 트렌드 — 웹 검색 결과]\n${editorialContext}\n위는 지금 이 시즌의 니치한 에디토리얼 추천(신상 컬래버, 셀럽 착장, 매거진 픽 등)이다.\n이 사람의 스타일 방향과 실제로 맞는 것이 있으면 1~2개만 골라 자연스럽게 녹여낼 것 (brands의 above 티어나 tpo note 등). 억지로 다 넣지 말고, 결이 맞고 신선한 것만. 일반 상식이 아니라 '요즘 아는 사람은 아는' 픽을 주는 게 목적.`
      : '';

    const identityThreadNote = `\n\n[정체성 관통선 — 항상 적용]\n이 사람의 설문 답변에서 드러난 핵심 신호(직업·라이프스타일·체형·고민·예산·TPO 상황·유지하고 싶은 것·바꾸고 싶은 것)를 보고서 전체의 또 하나의 관통선으로 삼아라. 모든 주요 추천(direction·brands·tpo·color·fit)의 근거를 "당신은 ○○(구체적 본인 신호)이니까" 형태로 반드시 연결할 것. 추상적·일반론적 근거 금지 — 이 사람 고유의 맥락에서만 나올 수 있는 근거여야 한다. 추구미(있으면)와 본인 정체성, 이 두 축이 함께 엮여 "그래서 나한테 이게 맞는구나"가 계속 느껴지게.`;

    const nicknameNote = (nickname && String(nickname).trim())
      ? `\n\n[닉네임: ${String(nickname).trim()} — 보고서 곳곳에서 이 이름으로 자연스럽게 부르며 작성할 것]`
      : "";

    const userMessage = `[설문 응답]\n\n${buildAnswerText(answers)}${fitPicNote}${nicknameNote}${identityThreadNote}${referenceNote}${weatherNote}${editorialNote}${seasonNote}`;

    // 사진 있으면 멀티모달 콘텐츠, 없으면 텍스트만
    const userContent = fitPicUrls.length > 0
      ? [
          ...fitPicUrls.map((url) => ({ type: "image", source: { type: "url", url } })),
          { type: "text", text: userMessage },
        ]
      : userMessage;

    // SSE 스트리밍 시작
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    // 윤문·저장 동안에는 보낼 데이터가 없고, 화면은 30초 무응답이면 연결을 끊는다.
    // SSE 주석 줄은 화면 파서가 무시하므로 연결이 살아 있다는 신호로만 쓰인다.
    keepalive = setInterval(() => {
      try { res.write(": keepalive\n\n"); } catch { /* 연결이 이미 끊겼으면 보낼 곳이 없다 */ }
    }, 10000);

    let fullText = "";

    // 1단계: Sonnet으로 보고서 생성
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userContent }],
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
        const text = event.delta.text;
        fullText += text;
        res.write(`data: ${JSON.stringify({ type: "delta", text })}\n\n`);
      }
    }

    const rawReport = parseJson(fullText);

    // 2단계: 한국어 어투 자동 윤문
    res.write(`data: ${JSON.stringify({ type: "status", message: "윤문 중…" })}\n\n`);
    const report = await humanizeReport(rawReport);

    // 닉네임을 리포트에 저장 — 공유 링크(다른 브라우저)에서도 제목에 이름이 뜨도록
    if (nickname && String(nickname).trim()) report.nickname = String(nickname).trim();

    // Supabase 저장
    const genAt = new Date().toISOString();
    await saveTranslatorReport(supabase, intakeId, report, genAt);

    // 실제 발행 순번
    let reportNo = null;
    try {
      const { count } = await supabase
        .from("consulting_intakes")
        .select("id", { count: "exact", head: true })
        .not("report_generated_at", "is", null)
        .lte("report_generated_at", genAt);
      if (typeof count === "number") reportNo = count;
    } catch {}

    // SSE는 개행으로 라인을 구분하므로 done 페이로드 내 리터럴 개행 제거 (U+000A·U+000D·U+2028·U+2029)
    const donePayload = JSON.stringify({ type: "done", intakeId, report, reportNo }).replace(/[\n\r\u2028\u2029]/g, " ");
    res.write(`data: ${donePayload}\n\n`);
    res.end();
  } catch (err) {
    console.error("translator-report error:", err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err?.message || "server_error" });
    }
    try { res.write(`data: ${JSON.stringify({ type: "error", error: err?.message })}\n\n`); res.end(); } catch {}
  } finally {
    clearInterval(keepalive);
  }
}
