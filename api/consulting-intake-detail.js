import {
  applyConsultingOwnerFilter,
  getAuthenticatedUser,
  getGuestSessionId,
  supabase,
} from "./_lib/consultingAccess.js";

const DEFAULT_FITPIC_BUCKET = process.env.SUPABASE_IDENTITY_FITPIC_BUCKET || "identity-fitpics";
const ADMIN_USER_IDS = new Set(["bb212db4-994c-42b2-951b-c6a860ec09ec"]);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method not allowed" });
  }

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
    console.error("consulting-intake-detail error:", error);
    return res.status(500).json({ error: error?.message || "Server error" });
  }
}
