import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { reportId } = req.query;
  if (!reportId) return res.status(400).json({ error: "reportId required" });

  const { data, error } = await supabase
    .from("reports")
    .select("full_report, free, title, fit_pics, answers")
    .eq("id", reportId)
    .single();

  if (error || !data) return res.status(404).json({ error: "Report not found" });

  return res.status(200).json({
    report: data.full_report ?? null,
    free: data.free ?? null,
    title: data.title ?? null,
    fitPics: data.fit_pics ?? null,
    answers: data.answers ?? null,
  });
}
