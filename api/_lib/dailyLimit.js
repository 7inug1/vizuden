import crypto from "node:crypto";

/** 하루에 몇 건까지 허용할지.
 *
 *  인테이크 1건이 보고서 1건이고, 보고서 1건이 Claude 호출 1회다
 *  (translator-report 에 멱등 가드가 있어 다시 열어도 재생성하지 않는다).
 *  그래서 여기서 세면 값이 잡힌다.
 *
 *  베타 코드는 이 한도를 넘기는 열쇠로만 남긴다 — 코드가 없어도 하루 몇 번은
 *  써볼 수 있어야 방문자가 결과물을 확인할 수 있다.
 */
export const DAILY_LIMIT = Number(process.env.TRANSLATOR_DAILY_LIMIT ?? 3);

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
