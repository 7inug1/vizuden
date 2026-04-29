import { createClient } from "@supabase/supabase-js";

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
    const {
      type_code,
      guest_session_id,
      session_id,
      event_name,
      page_type,
      source,
      position,
      result_version,
      duration_ms,
      meta,
    } = req.body ?? {};

    if (!event_name || typeof event_name !== "string") {
      return res.status(400).json({ error: "event_name is required" });
    }

    const { error } = await supabase
      .from("type_events")
      .insert({
        user_id: user?.id ?? null,
        guest_session_id: guest_session_id ?? null,
        session_id: session_id ?? null,
        type_code: type_code ?? null,
        event_name,
        page_type: page_type ?? null,
        source: source ?? null,
        position: position ?? null,
        result_version: result_version ?? null,
        duration_ms: Number.isFinite(duration_ms) ? duration_ms : null,
        meta: meta ?? null,
      });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
