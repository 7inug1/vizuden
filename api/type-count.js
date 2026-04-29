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
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "GET") {
    const { count, error } = await supabase
      .from("type_completions")
      .select("*", { count: "exact", head: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ count: count ?? 0 });
  }

  if (req.method === "POST") {
    try {
      const user = await getAuthenticatedUser(req);
      const {
        type_code,
        guest_session_id,
        session_id,
        source_path,
        completed_from,
        duration_sec,
        axis_scores,
        question_version,
        result_version,
        started_at,
      } = req.body ?? {};
      const { error } = await supabase
        .from("type_completions")
        .insert({
          type_code: type_code ?? null,
          user_id: user?.id ?? null,
          guest_session_id: guest_session_id ?? null,
          session_id: session_id ?? null,
          source_path: source_path ?? null,
          completed_from: completed_from ?? null,
          duration_sec: Number.isFinite(duration_sec) ? duration_sec : null,
          axis_scores: axis_scores ?? null,
          question_version: question_version ?? null,
          result_version: result_version ?? null,
          started_at: started_at ?? null,
        });

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).end();
}
