import {
  getAuthenticatedUser,
  getGuestSessionId,
  supabase,
} from "./_lib/consultingAccess.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }

  const { answers, fitPics, code, prescriptionReportId, consents } = req.body ?? {};

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: "answers required" });
  }
  if (!code || typeof code !== "string") {
    return res.status(403).json({ error: "code_required" });
  }
  if (!prescriptionReportId || typeof prescriptionReportId !== "string") {
    return res.status(403).json({ error: "prescription_required" });
  }

  const user = await getAuthenticatedUser(req);
  const guestSessionId = getGuestSessionId(req);

  if (!user?.id && !guestSessionId) {
    return res.status(401).json({ error: "auth_required" });
  }

  const { data: codeData, error: codeErr } = await supabase
    .from("consulting_codes")
    .select("use_count, max_uses, is_active")
    .eq("code", code.trim())
    .maybeSingle();

  if (codeErr || !codeData || !codeData.is_active || codeData.use_count >= codeData.max_uses) {
    return res.status(403).json({ error: "code_invalid" });
  }

  let prescriptionQuery = supabase
    .from("reports")
    .select("id, user_id, guest_session_id, kind")
    .eq("id", prescriptionReportId)
    .eq("kind", "prescription");

  if (user?.id) {
    prescriptionQuery = prescriptionQuery.eq("user_id", user.id);
  } else if (guestSessionId) {
    prescriptionQuery = prescriptionQuery
      .is("user_id", null)
      .eq("guest_session_id", guestSessionId);
  }

  const { data: prescriptionData, error: prescriptionErr } = await prescriptionQuery.maybeSingle();

  if (prescriptionErr || !prescriptionData) {
    return res.status(403).json({ error: "prescription_required" });
  }
  if (!user?.id && (prescriptionData.user_id || (guestSessionId && prescriptionData.guest_session_id !== guestSessionId))) {
    return res.status(403).json({ error: "prescription_required" });
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

  const { error: updateCodeError } = await supabase
    .from("consulting_codes")
    .update({ use_count: codeData.use_count + 1 })
    .eq("code", code.trim())
    .eq("use_count", codeData.use_count);

  if (updateCodeError) {
    console.error("consulting_codes update error:", updateCodeError);
  }

  return res.status(200).json({ id: data.id });
}
