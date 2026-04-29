/* eslint-env node */
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
  if (req.method !== "GET") return res.status(405).end();

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [{ data: reportsData, error }, { data: typeData }] = await Promise.all([
      supabase
        .from("reports")
        .select("id, kind, title, created_at, free")
        .eq("user_id", user.id)
        .in("kind", ["prescription", "identity"])
        .order("created_at", { ascending: false }),
      supabase
        .from("type_completions")
        .select("type_code, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (error) throw error;

    const latestByKind = { prescription: null, identity: null };
    for (const row of reportsData ?? []) {
      if (!row?.kind || latestByKind[row.kind]) continue;
      latestByKind[row.kind] = row.id;
    }

    const prescriptions = (reportsData ?? [])
      .filter((r) => r.kind === "prescription")
      .map((r) => ({
        id: r.id,
        title: r.title ?? null,
        preview: r.free?.direction ?? null,
        createdAt: r.created_at,
      }));

    const typeHistory = (typeData ?? [])
      .filter((r) => r.type_code)
      .map((r) => ({ code: r.type_code, createdAt: r.created_at }));

    return res.status(200).json({
      prescription: {
        done: Boolean(latestByKind.prescription),
        reportId: latestByKind.prescription,
      },
      identity: {
        done: Boolean(latestByKind.identity),
        reportId: latestByKind.identity,
      },
      prescriptions,
      typeHistory,
    });
  } catch (error) {
    console.error("report-status error:", error);
    return res.status(500).json({ error: error?.message || "Server error" });
  }
}
