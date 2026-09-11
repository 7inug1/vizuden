import {
  getAuthenticatedUser,
  getGuestSessionId,
  supabase,
} from "./_lib/consultingAccess.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }

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
  const { answers, fitPics, code, consents, devMode } = body;

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: "answers required" });
  }

  const user = await getAuthenticatedUser(req);
  const guestSessionId = getGuestSessionId(req);

  if (!user?.id && !guestSessionId) {
    return res.status(401).json({ error: "auth_required" });
  }

  if (!devMode) {
    if (!code || typeof code !== "string") {
      return res.status(403).json({ error: "code_required" });
    }

    const { data: codeData, error: codeErr } = await supabase
      .from("consulting_codes")
      .select("use_count, max_uses, is_active")
      .eq("code", code.trim())
      .maybeSingle();

    if (codeErr || !codeData || !codeData.is_active) {
      return res.status(403).json({ error: "code_invalid" });
    }
  }

  const { data, error } = await supabase
    .from("consulting_intakes")
    .insert({
      user_id: user?.id ?? null,
      guest_session_id: user?.id ? null : guestSessionId,
      answers,
      fit_pics: fitPics ?? [],
      consents: consents ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("consulting_intakes insert error:", error);
    return res.status(500).json({ error: "db error" });
  }

  if (!devMode && code) {
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
