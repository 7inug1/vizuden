/** 저장된 행까지 확인한 뒤에만 호출자가 완료 이벤트를 보낼 수 있다. */
export async function saveTranslatorReport(db, intakeId, report, generatedAt) {
  const { data, error } = await db.from("consulting_intakes")
    .update({ report, report_generated_at: generatedAt })
    .eq("id", intakeId)
    .select("id")
    .single();
  if (error || !data?.id) {
    throw new Error("보고서를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
}
