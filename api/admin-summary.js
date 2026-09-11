import { getAuthenticatedUser, supabase } from "./_lib/auth.js";

const ADMIN_USER_IDS = new Set([
  "bb212db4-994c-42b2-951b-c6a860ec09ec",
]);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method not allowed" });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user || !ADMIN_USER_IDS.has(user.id)) {
      return res.status(403).json({ error: "forbidden" });
    }

    const [
      reportsCountRes,
      typeCountRes,
      consultingCountRes,
      feedbackCountRes,
      usersRes,
      typeRowsRes,
      prescriptionRowsRes,
      consultingRowsRes,
      feedbackRowsRes,
      reportsRecentRes,
      consultingRecentRes,
      feedbackRecentRes,
      consultingStatusRes,
    ] = await Promise.all([
      supabase.from("reports").select("*", { count: "exact", head: true }),
      supabase.from("type_completions").select("*", { count: "exact", head: true }),
      supabase.from("consulting_intakes").select("*", { count: "exact", head: true }),
      supabase.from("feedback").select("*", { count: "exact", head: true }),
      supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabase
        .from("type_completions")
        .select("user_id, type_code, created_at")
        .not("user_id", "is", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("reports")
        .select("id, user_id, kind, title, created_at")
        .eq("kind", "prescription")
        .not("user_id", "is", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("consulting_intakes")
        .select("id, user_id, status, review_unlocked, created_at")
        .not("user_id", "is", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("feedback")
        .select("user_id, page_type, created_at")
        .not("user_id", "is", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("reports")
        .select("id, kind, user_id, guest_session_id, type_code, title, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("consulting_intakes")
        .select("id, user_id, guest_session_id, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("feedback")
        .select("id, page_type, category, message, created_at, user_id, guest_session_id")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("consulting_intakes")
        .select("status")
        .limit(1000),
    ]);

    const statusCounts = {};
    for (const row of consultingStatusRes.data ?? []) {
      const status = row?.status || "submitted";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    }

    const users = usersRes?.data?.users ?? [];
    const typeRows = typeRowsRes.data ?? [];
    const prescriptionRows = prescriptionRowsRes.data ?? [];
    const consultingRows = consultingRowsRes.data ?? [];
    const feedbackRows = feedbackRowsRes.data ?? [];

    const accountMap = new Map();
    for (const userRow of users) {
      accountMap.set(userRow.id, {
        userId: userRow.id,
        email: userRow.email ?? null,
        displayName:
          userRow.user_metadata?.name ||
          userRow.user_metadata?.full_name ||
          userRow.user_metadata?.display_name ||
          null,
        typeCode: null,
        typeCount: 0,
        prescriptionCount: 0,
        latestReportId: null,
        latestPrescriptionTitle: null,
        consultingCount: 0,
        latestConsultingIntakeId: null,
        latestConsultingStatus: null,
        latestConsultingReviewUnlocked: false,
        feedbackCount: 0,
        recentActivityAt: null,
      });
    }

    function bumpRecent(entry, createdAt) {
      if (!createdAt) return;
      if (!entry.recentActivityAt || new Date(createdAt).getTime() > new Date(entry.recentActivityAt).getTime()) {
        entry.recentActivityAt = createdAt;
      }
    }

    for (const row of typeRows) {
      const entry = accountMap.get(row.user_id);
      if (!entry) continue;
      entry.typeCount += 1;
      if (!entry.typeCode) entry.typeCode = row.type_code || null;
      bumpRecent(entry, row.created_at);
    }

    for (const row of prescriptionRows) {
      const entry = accountMap.get(row.user_id);
      if (!entry) continue;
      entry.prescriptionCount += 1;
      if (!entry.latestReportId) {
        entry.latestReportId = row.id;
        entry.latestPrescriptionTitle = row.title || null;
      }
      bumpRecent(entry, row.created_at);
    }

    for (const row of consultingRows) {
      const entry = accountMap.get(row.user_id);
      if (!entry) continue;
      entry.consultingCount += 1;
      if (!entry.latestConsultingIntakeId) {
        entry.latestConsultingIntakeId = row.id;
        entry.latestConsultingStatus = row.status || "submitted";
        entry.latestConsultingReviewUnlocked = !!row.review_unlocked;
      }
      bumpRecent(entry, row.created_at);
    }

    for (const row of feedbackRows) {
      const entry = accountMap.get(row.user_id);
      if (!entry) continue;
      entry.feedbackCount += 1;
      bumpRecent(entry, row.created_at);
    }

    const accounts = [...accountMap.values()].sort((a, b) => {
      const aTime = a.recentActivityAt ? new Date(a.recentActivityAt).getTime() : 0;
      const bTime = b.recentActivityAt ? new Date(b.recentActivityAt).getTime() : 0;
      return bTime - aTime;
    });

    return res.status(200).json({
      counts: {
        reports: reportsCountRes.count ?? 0,
        typeCompletions: typeCountRes.count ?? 0,
        consultingIntakes: consultingCountRes.count ?? 0,
        feedback: feedbackCountRes.count ?? 0,
      },
      statusCounts,
      accounts,
      recent: {
        reports: reportsRecentRes.data ?? [],
        consultingIntakes: consultingRecentRes.data ?? [],
        feedback: feedbackRecentRes.data ?? [],
      },
    });
  } catch (error) {
    console.error("admin-summary error:", error);
    return res.status(500).json({ error: error?.message || "server error" });
  }
}
