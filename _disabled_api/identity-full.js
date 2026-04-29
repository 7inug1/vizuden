import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalizeIdentityReport(raw) {
  if (!raw) return null;

  let source = raw;
  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      return null;
    }
  }

  const normalized = {
    identity: source.identity ?? null,
    currentState: source.currentState ?? null,
    gap: source.gap ?? null,
    priorities: Array.isArray(source.priorities) ? source.priorities.filter(Boolean) : [],
    stylingSystem: source.stylingSystem ?? null,
    maintenance: source.maintenance ?? null,
    actionPlan: source.actionPlan ?? null,
    recommendations: source.recommendations ?? null,
  };

  if (!normalized.gap?.headline) return null;
  return normalized;
}

async function resolveFitPicUrls(fitPics) {
  if (!Array.isArray(fitPics) || fitPics.length === 0) return [];

  const resolved = new Array(fitPics.length).fill(null);
  const bucketGroups = new Map();

  fitPics.forEach((pic, index) => {
    if (!pic?.bucket || !pic?.path) return;
    const list = bucketGroups.get(pic.bucket) || [];
    list.push({ index, path: pic.path });
    bucketGroups.set(pic.bucket, list);
  });

  await Promise.all(
    [...bucketGroups.entries()].map(async ([bucket, items]) => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrls(items.map((item) => item.path), 60 * 60);
      if (error) throw error;
      items.forEach((item, itemIndex) => {
        resolved[item.index] = data?.[itemIndex]?.signedUrl || null;
      });
    })
  );

  return resolved.filter(Boolean);
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { reportId } = req.query;
  if (!reportId) return res.status(400).json({ error: "reportId required" });

  const { data, error } = await supabase
    .from("reports")
    .select("full_report, free, title, fit_pics, type_code")
    .eq("id", reportId)
    .single();

  if (error || !data) return res.status(404).json({ error: "Report not found" });

  let fitPicUrls = [];
  try {
    fitPicUrls = await resolveFitPicUrls(data.fit_pics);
  } catch (fitPicError) {
    console.error("identity fit pic url error:", fitPicError);
  }

  const report =
    normalizeIdentityReport(data.full_report) ||
    normalizeIdentityReport(data.free);

  return res.status(200).json({
    report,
    title: data.title ?? null,
    typeCode: data.type_code ?? null,
    fitPicUrls,
  });
}
