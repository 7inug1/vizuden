import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const DEFAULT_FITPIC_BUCKET = process.env.SUPABASE_IDENTITY_FITPIC_BUCKET || "identity-fitpics";

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
    report: data.full_report ?? null,
    free: data.free ?? null,
    title: data.title ?? null,
    fitPics,
    answers: data.answers ?? null,
  });
}
