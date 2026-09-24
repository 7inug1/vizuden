/** 번역가 인테이크 — 목록·상세·생성을 한 라우트에서 처리한다.
 *
 *  Vercel 무료 플랜은 서버리스 함수를 12개까지만 배포한다. 셋으로 나뉘어 있던
 *  translator-intakes(목록) · translator-intake-detail(상세) · translator-intake(생성)이
 *  한계를 넘겨 배포가 거부됐다(실측). 같은 자원을 다루고 메서드로 갈리므로 합쳤다.
 *
 *    GET  /api/translator-intake          목록
 *    GET  /api/translator-intake?id=…     상세 (첨부 사진에 서명 URL 을 붙인다)
 *    POST /api/translator-intake          코드 검증 또는 인테이크 제출
 */
import {
  applyConsultingOwnerFilter,
  getAuthenticatedUser,
  getGuestSessionId,
  supabase,
} from "./_lib/consultingAccess.js";
import { DAILY_LIMIT, codeIsValid, ipHash, usedToday } from "./_lib/dailyLimit.js";

const DEFAULT_FITPIC_BUCKET = process.env.SUPABASE_IDENTITY_FITPIC_BUCKET || "identity-fitpics";
const ADMIN_USER_IDS = new Set(["bb212db4-994c-42b2-951b-c6a860ec09ec"]);

async function listIntakes(req, res) {

  try {
    const user = await getAuthenticatedUser(req);
    const guestSessionId = getGuestSessionId(req);

    let query = supabase
      .from("consulting_intakes")
      .select("id, created_at, answers, fit_pics, consents, user_id, guest_session_id, review_unlocked, status")
      .order("created_at", { ascending: false });

    query = applyConsultingOwnerFilter(query, user, guestSessionId);
    if (!query) {
      return res.status(401).json({ error: "auth_required" });
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json({
      items: Array.isArray(data) ? data : [],
    });
  } catch (error) {
    console.error("translator-intakes error:", error);
    return res.status(500).json({ error: error?.message || "Server error" });
  }
}

async function intakeDetail(req, res) {

  const intakeId = typeof req.query?.id === "string" ? req.query.id : "";
  if (!intakeId) {
    return res.status(400).json({ error: "id required" });
  }

  try {
    const user = await getAuthenticatedUser(req);
    const guestSessionId = getGuestSessionId(req);

    const isAdmin = user && ADMIN_USER_IDS.has(user.id);

    let query = supabase
      .from("consulting_intakes")
      .select("id, created_at, answers, fit_pics, consents, user_id, guest_session_id")
      .eq("id", intakeId)
      .limit(1);

    if (!isAdmin) {
      query = applyConsultingOwnerFilter(query, user, guestSessionId);
      if (!query) {
        return res.status(401).json({ error: "auth_required" });
      }
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: "not_found" });
    }

    let fitPics = Array.isArray(data.fit_pics) ? data.fit_pics : [];
    const paths = fitPics.map((pic) => pic?.path).filter(Boolean);
    if (paths.length > 0) {
      const bucket = fitPics[0]?.bucket || DEFAULT_FITPIC_BUCKET;
      const { data: signedUrls, error: signedUrlError } = await supabase.storage
        .from(bucket)
        .createSignedUrls(paths, 60 * 60);

      if (!signedUrlError && Array.isArray(signedUrls)) {
        fitPics = fitPics.map((pic, index) => ({
          ...pic,
          signedUrl: signedUrls[index]?.signedUrl || null,
        }));
      }
    }

    return res.status(200).json({
      item: {
        ...data,
        fit_pics: fitPics,
      },
    });
  } catch (error) {
    console.error("translator-intake-detail error:", error);
    return res.status(500).json({ error: error?.message || "Server error" });
  }
}

async function createIntake(req, res) {

  const body = req.body ?? {};

  // 코드 검증 전용 요청 (body에 code만 있을 때)
  if (body.code && !body.answers) {
    const { code } = body;
    if (typeof code !== "string") {
      return res.status(400).json({ valid: false, error: "code_required" });
    }
    const { data, error } = await supabase
      .from("consulting_codes")
      .select("is_active")
      .eq("code", code.trim())
      .maybeSingle();
    if (error || !data || !data.is_active) {
      return res.status(200).json({ valid: false });
    }
    return res.status(200).json({ valid: true });
  }

  // 인테이크 제출
  const { answers, fitPics, code, consents } = body;

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: "answers required" });
  }

  const user = await getAuthenticatedUser(req);
  const guestSessionId = getGuestSessionId(req);

  if (!user?.id && !guestSessionId) {
    return res.status(401).json({ error: "auth_required" });
  }

  /* 베타 코드를 먼저 묻지 않는다.
   *
   *  코드를 가진 사람만 써볼 수 있으면 방문자는 결과물을 볼 수 없다. 대신 같은
   *  곳에서 최근 24시간 DAILY_LIMIT 건까지 열어 두고, 그 위로는 코드를 받는다.
   *  개발 화면에서 보낸 값으로 서버의 한도 검사를 건너뛰지 않는다. */
  const hash = ipHash(req);
  const used = await usedToday(supabase, hash);
  if (used >= DAILY_LIMIT && !(await codeIsValid(supabase, code))) {
    return res.status(429).json({
      error: "daily_limit",
      used,
      limit: DAILY_LIMIT,
    });
  }

  const { data, error } = await supabase
    .from("consulting_intakes")
    .insert({
      user_id: user?.id ?? null,
      guest_session_id: user?.id ? null : guestSessionId,
      answers,
      fit_pics: fitPics ?? [],
      consents: consents ?? null,
      ip_hash: hash,
    })
    .select("id")
    .single();

  if (error) {
    console.error("consulting_intakes insert error:", error);
    return res.status(500).json({ error: "db error" });
  }

  // 코드를 써서 한도를 넘긴 경우에만 사용 횟수를 올린다
  if (code) {
    const { data: codeData } = await supabase
      .from("consulting_codes")
      .select("use_count")
      .eq("code", code.trim())
      .maybeSingle();
    if (codeData) {
      await supabase
        .from("consulting_codes")
        .update({ use_count: codeData.use_count + 1 })
        .eq("code", code.trim())
        .eq("use_count", codeData.use_count);
    }
  }

  return res.status(200).json({ id: data.id });
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    // id 가 있으면 한 건, 없으면 목록
    return req.query?.id ? intakeDetail(req, res) : listIntakes(req, res);
  }
  if (req.method === "POST") return createIntake(req, res);
  return res.status(405).json({ error: "method not allowed" });
}
