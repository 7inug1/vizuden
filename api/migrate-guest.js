import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getAuthenticatedUser(req) {
  const match = (req.headers.authorization || "").match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const { data, error } = await supabase.auth.getUser(match[1]);
  if (error) return null;
  return data.user ?? null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const user = await getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "auth_required" });

  const { guestSessionId } = req.body ?? {};
  if (!guestSessionId || typeof guestSessionId !== "string") {
    return res.status(400).json({ error: "guestSessionId required" });
  }

  const tables = [
    "type_completions",
    "reports",
    "consulting_intakes",
    "feedback",
  ];

  const results = await Promise.allSettled(
    tables.map((table) =>
      supabase
        .from(table)
        .update({ user_id: user.id, guest_session_id: null })
        .eq("guest_session_id", guestSessionId)
        .is("user_id", null)
    )
  );

  const errors = results
    .map((r, i) => (r.status === "rejected" || r.value?.error ? tables[i] : null))
    .filter(Boolean);

  if (errors.length) {
    console.error("migrate-guest partial failure:", errors);
  }

  return res.status(200).json({ ok: true, errors });
}
