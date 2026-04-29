import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  try {
    const { data, error } = await supabase.auth.getUser(match[1]);
    if (error) return null;
    return data.user ?? null;
  } catch {
    return null;
  }
}

export function getGuestSessionId(req) {
  const raw = req.headers["x-guest-session-id"];
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 128) return null;
  return trimmed;
}

export function applyConsultingOwnerFilter(query, user, guestSessionId) {
  if (user?.id) {
    return query.eq("user_id", user.id);
  }

  if (guestSessionId) {
    return query
      .is("user_id", null)
      .eq("guest_session_id", guestSessionId);
  }

  return null;
}
