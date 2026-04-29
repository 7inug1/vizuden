import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalizeFullReport(raw) {
  if (!raw) return null;

  let source = raw;
  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      return null;
    }
  }

  if (source?.full && typeof source.full === "object") {
    source = source.full;
  }

  const problemSource = source.problem ?? source;
  const transformationSource = source.transformation ?? source;

  const normalized = {
    problem: {
      headline: problemSource?.headline ?? problemSource?.title ?? null,
      reasons: Array.isArray(problemSource?.reasons) ? problemSource.reasons.filter(Boolean) : [],
    },
    transformation: {
      criteria: Array.isArray(transformationSource?.criteria) ? transformationSource.criteria.filter(Boolean) : [],
    },
  };

  return normalized.problem.headline ? normalized : null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { paymentKey, orderId, amount } = req.body;

  // orderId 형식: bp_{reportId}_{timestamp}
  const parts = orderId?.split("_");
  const reportId = parts?.[1];

  if (!reportId || !paymentKey || !amount) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  try {
    // Toss API 결제 최종 승인
    const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    if (!tossRes.ok) {
      const err = await tossRes.json();
      return res.status(400).json({ error: err.message || "Payment confirmation failed" });
    }

    // Supabase에 결제 완료 기록 + full_report 반환
    const { data, error } = await supabase
      .from("reports")
      .update({ paid_at: new Date().toISOString(), payment_key: paymentKey })
      .eq("id", reportId)
      .select("full_report, free")
      .single();

    if (error || !data) throw error || new Error("Report not found");

    return res.status(200).json({ full: normalizeFullReport(data.full_report), free: data.free });
  } catch (e) {
    console.error("payment-verify error:", e);
    return res.status(500).json({ error: e.message });
  }
}
