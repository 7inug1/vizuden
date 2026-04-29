import {
  applyConsultingOwnerFilter,
  getAuthenticatedUser,
  getGuestSessionId,
  supabase,
} from "./_lib/consultingAccess.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method not allowed" });
  }

  try {
    const user = await getAuthenticatedUser(req);
    const guestSessionId = getGuestSessionId(req);

    let query = supabase
      .from("consulting_intakes")
      .select("id, created_at, answers, fit_pics, consents, user_id, guest_session_id")
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
    console.error("consulting-intakes error:", error);
    return res.status(500).json({ error: error?.message || "Server error" });
  }
}
