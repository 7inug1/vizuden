import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { reportId } = req.body;
  if (!reportId) return res.status(400).json({ error: "reportId required" });

  let report = null;
  let error = null;

  const primary = await supabase
    .from("reports")
    .select("id, paid_at, kind, free, full_report")
    .eq("id", reportId)
    .single();

  report = primary.data;
  error = primary.error;

  if (error || !report) return res.status(404).json({ error: "Report not found" });

  const looksLikeIdentity =
    report?.kind === "identity" ||
    Boolean(report?.free?.identity) ||
    Boolean(report?.full_report?.identity);

  if (!looksLikeIdentity) {
    return res.status(400).json({ error: "Not an identity report" });
  }

  if (!report.paid_at) {
    const { error: updateError } = await supabase
      .from("reports")
      .update({ paid_at: new Date().toISOString() })
      .eq("id", reportId);

    if (updateError) return res.status(500).json({ error: updateError.message });
  }

  return res.status(200).json({ ok: true });
}
