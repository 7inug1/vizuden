import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = process.env.SUPABASE_IDENTITY_FITPIC_BUCKET || "identity-fitpics";

function sanitizeSegment(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9-_.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const files = Array.isArray(req.body?.files) ? req.body.files : [];
    if (files.length === 0) return res.status(400).json({ error: "files are required" });
    if (files.length > 3) return res.status(400).json({ error: "too many files" });

    const uploads = await Promise.all(files.map(async (file, idx) => {
      const safeName = sanitizeSegment(file?.name || `fitpic-${idx + 1}`) || `fitpic-${idx + 1}`;
      const contentType = String(file?.contentType || "image/jpeg");
      const path = `temp/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUploadUrl(path);

      if (error) throw error;

      return {
        path,
        token: data.token,
        contentType,
      };
    }));

    return res.status(200).json({ bucket: BUCKET, uploads });
  } catch (error) {
    console.error("identity-fitpic-upload error:", error);
    return res.status(500).json({ error: error.message });
  }
}
