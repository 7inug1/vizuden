import crypto from "node:crypto";

/** 베타 코드 없이 제출할 수 있는 최근 24시간 인테이크 수. */
const configuredLimit = process.env.TRANSLATOR_DAILY_LIMIT?.trim();
const parsedLimit = configuredLimit ? Number(configuredLimit) : 3;
export const DAILY_LIMIT = Number.isSafeInteger(parsedLimit) && parsedLimit >= 0 ? parsedLimit : 3;

/** 요청한 곳을 해시로 남긴다. 원본 IP 는 저장하지 않는다 —
 *  세는 데는 해시로 충분하고, 남겨 두면 지킬 것이 늘어난다. */
export function ipHash(req) {
  const raw =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown";
  const salt = process.env.IP_HASH_SALT ?? "vizuden";
  return crypto.createHash("sha256").update(`${salt}:${raw}`).digest("hex").slice(0, 32);
}

/** 지난 24시간에 이 곳에서 만든 인테이크 수. */
export async function usedToday(supabase, hash) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("consulting_intakes")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", hash)
    .gte("created_at", since);
  if (error) {
    // 세지 못하면 막지 않는다. 카운터 고장으로 서비스가 멈추는 편이 더 나쁘다.
    console.error("usedToday failed:", error);
    return 0;
  }
  return count ?? 0;
}

/** 베타 코드가 살아 있는지. 한도를 넘겼을 때만 확인한다. */
export async function codeIsValid(supabase, code) {
  if (typeof code !== "string" || !code.trim()) return false;
  const { data, error } = await supabase
    .from("consulting_codes")
    .select("is_active")
    .eq("code", code.trim())
    .maybeSingle();
  return !error && Boolean(data?.is_active);
}
