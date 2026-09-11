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
    const { data, count, error } = await supabase
      .from("type_completions")
      .select("type_code", { count: "exact" })
      .not("type_code", "is", null)
      .limit(10000); // Supabase 기본 limit 1000 → 분포 계산 오류 방지

    if (error) return res.status(500).json({ error: error.message });

    const distribution = {};
    (data ?? []).forEach(({ type_code }) => {
      distribution[type_code] = (distribution[type_code] || 0) + 1;
    });

    // distribution 합계로 분모 재계산 (limit 초과 시 count보다 정확)
    const distTotal = Object.values(distribution).reduce((a, b) => a + b, 0);

    return res.status(200).json({ count: distTotal, distribution });
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
          email: user?.email ?? null,
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
