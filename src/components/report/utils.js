// "A 또는 B" · "A/B" · "A, B" 처럼 묶인 검색어를 개별 검색어로 분리
export function splitSearch(s) {
  return String(s || '')
    .split(/\s*(?:또는|혹은|\/|,|·|&|\bor\b)\s*/i)
    .map((t) => t.trim())
    .filter(Boolean);
}
