/* eslint-env node */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function isUuid(val) {
  return typeof val === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const {
      rating,
      category,
      message,
      reportId,
      typeCode,
      isPaid,
      pathname,
      pageType,
      userId,
      guestSessionId,
    } = req.body ?? {};

    const trimmedMessage = typeof message === "string" ? message.trim() : "";
    if (trimmedMessage.length < 5 || trimmedMessage.length > 1000) {
      return res.status(400).json({ error: "Invalid message" });
    }

    const allowedCategories = new Set(["bug", "content", "usability", "other"]);
    const normalizedCategory = category == null || category === "" ? null : String(category);
    if (normalizedCategory !== null && !allowedCategories.has(normalizedCategory)) {
      return res.status(400).json({ error: "Invalid category" });
    }

    const normalizedReportId = reportId == null || reportId === "" ? null : reportId;
    if (normalizedReportId !== null && !isUuid(normalizedReportId)) {
      return res.status(400).json({ error: "Invalid reportId" });
    }

    const normalizedTypeCode = typeCode == null || typeCode === "" ? null : String(typeCode);
    if (normalizedTypeCode !== null && normalizedTypeCode.length > 32) {
      return res.status(400).json({ error: "Invalid typeCode" });
    }

    const normalizedIsPaid =
      typeof isPaid === "boolean" ? isPaid : isPaid == null ? null : null;

    const normalizedPathname = pathname == null || pathname === "" ? null : String(pathname);
    if (normalizedPathname !== null && normalizedPathname.length > 255) {
      return res.status(400).json({ error: "Invalid pathname" });
    }

    const normalizedPageType = pageType == null || pageType === "" ? null : String(pageType);
    if (normalizedPageType !== null && normalizedPageType.length > 64) {
      return res.status(400).json({ error: "Invalid pageType" });
    }

    const normalizedUserId = userId == null || userId === "" ? null : userId;
    if (normalizedUserId !== null && !isUuid(normalizedUserId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const normalizedGuestSessionId =
      guestSessionId == null || guestSessionId === "" ? null : String(guestSessionId);
    if (normalizedGuestSessionId !== null && normalizedGuestSessionId.length > 128) {
      return res.status(400).json({ error: "Invalid guestSessionId" });
    }

    const parsedRating = (() => {
      const next = Number(rating);
      const isHalfStep = Number.isFinite(next) && Math.abs(next * 2 - Math.round(next * 2)) < 1e-9;
      if (isHalfStep && next >= 0.5 && next <= 5) return next;
      return 5.0;
    })();

    const userAgent = req.headers["user-agent"] || null;
    const referer = req.headers.referer || null;

    const payload = {
      report_id: normalizedReportId,
      type_code: normalizedTypeCode,
      is_paid: normalizedIsPaid,
      rating: parsedRating,
      category: normalizedCategory,
      message: trimmedMessage,
      pathname: normalizedPathname,
      page_type: normalizedPageType,
      user_id: normalizedUserId,
      guest_session_id: normalizedGuestSessionId,
      user_agent: userAgent,
      referer,
    };

    let { error } = await supabase.from("feedback").insert(payload);

    if (error) {
      const fallbackMessage = [
        normalizedCategory ? `[category:${normalizedCategory}]` : null,
        normalizedPathname ? `[path:${normalizedPathname}]` : null,
        normalizedPageType ? `[page:${normalizedPageType}]` : null,
        normalizedUserId ? `[user:${normalizedUserId}]` : null,
        normalizedGuestSessionId ? `[guest:${normalizedGuestSessionId}]` : null,
        trimmedMessage,
      ].filter(Boolean).join(" ");

      const fallback = await supabase.from("feedback").insert({
        report_id: normalizedReportId,
        type_code: normalizedTypeCode,
        is_paid: normalizedIsPaid,
        rating: parsedRating,
        message: fallbackMessage.slice(0, 1000),
        user_agent: userAgent,
        referer,
      });

      error = fallback.error;
    }

    if (error) throw error;

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("feedback error:", e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
