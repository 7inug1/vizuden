// 외부 검색 — Tavily(추구미·날씨·에디토리얼) + 네이버 쇼핑 상품 resolve
import { itemPriceCap } from "./translatorPrompt.js";
export async function searchReferenceStyle(name) {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return null;
  const run = async (query, max) => {
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: key, query, search_depth: 'basic', max_results: max }),
      });
      const data = await res.json();
      if (!data.results?.length) return '';
      return data.results.map(r => `[${r.title}] ${r.content}`).join('\n');
    } catch { return ''; }
  };
  // 1) 스타일·브랜드  2) 매력·이미지(사람들이 왜 끌리는지)
  const [style, appeal] = await Promise.all([
    run(`${name} 패션 스타일 브랜드 착장 즐겨 입는 옷`, 4),
    run(`${name} 매력 이미지 분위기 스타일 아이콘 왜 좋아하는지 페르소나`, 4),
  ]);
  const combined = [
    style && `■ 스타일·브랜드\n${style}`,
    appeal && `■ 매력·이미지 (사람들이 끌리는 지점)\n${appeal}`,
  ].filter(Boolean).join('\n\n');
  return combined ? combined.slice(0, 2600) : null;
}

export async function searchCurrentWeatherContext(month) {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return null;
  try {
    const query = `한국 ${month}월 날씨 패션 스타일 추천 ${new Date().getFullYear()}`;
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: key,
        query,
        search_depth: 'basic',
        max_results: 3,
        topic: 'news',
      }),
    });
    const data = await res.json();
    if (!data.results?.length) return null;
    return data.results.map(r => `[${r.title}] ${r.content}`).join('\n').slice(0, 1000);
  } catch {
    return null;
  }
}

// ── 네이버 쇼핑: 검색어 → 실제 상품 (이미지·가격·링크) ──────────
// maxPrice: 사용자 예산 기반 상한 — 700만원 브리오니 같은 아웃라이어 컷
export async function searchNaverProducts(term, maxPrice = 300000) {
  const id = process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret) return null;
  try {
    const q = encodeURIComponent(`남자 ${term}`);
    const res = await fetch(`https://openapi.naver.com/v1/search/shop.json?query=${q}&display=10&sort=sim`, {
      headers: { "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data.items) || !data.items.length) return null;
    const mapped = data.items.map((it) => ({
      title: String(it.title || "").replace(/<[^>]*>/g, ""),
      link: it.link,
      image: it.image,
      price: Number(it.lprice) || null,
      mall: it.mallName || null,
      brand: it.brand || null,
    }));
    const inRange = mapped.filter((p) => p.price && p.price >= 5000 && p.price <= maxPrice);
    const pool = inRange.length ? inRange : mapped.filter((p) => p.price && p.price >= 5000);
    // 브랜드 등록 상품 우선 (스마트스토어 잡화 밀어내기) — 그룹 내에서는 정확도순 유지
    const sorted = [...pool].sort((a, b) => (b.brand ? 1 : 0) - (a.brand ? 1 : 0));
    return sorted.slice(0, 3);
  } catch {
    return null;
  }
}


export function extractProductTerms(text) {
  const out = new Set();
  for (const m of text.matchAll(/"search"\s*:\s*"((?:[^"\\]|\\.)*)"/g)) out.add(m[1].trim());
  for (const m of text.matchAll(/"shop_items"\s*:\s*\[([^\]]*)\]/g)) {
    for (const s of m[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)) out.add(s[1].trim());
  }
  return [...out].filter(Boolean);
}

// 보고서의 남은 검색어를 resolve해서 report.products에 부착 (스트리밍 중 만든 맵과 병합)
export async function enrichWithProducts(report, budget = 300000, existing = {}) {
  const terms = new Set();
  (report?.brands?.moods ?? []).forEach((m) =>
    (m.shop_items ?? []).forEach((t) => t && terms.add(String(t).trim()))
  );
  (report?.tpo?.occasions ?? []).forEach((o) =>
    (o.items ?? []).forEach((it) => it?.search && terms.add(String(it.search).trim()))
  );
  const cap = itemPriceCap(budget);
  const remaining = [...terms].filter((t) => t && !existing[t]).slice(0, 12);
  const results = await Promise.all(remaining.map((t) => searchNaverProducts(t, cap)));
  const products = { ...existing };
  remaining.forEach((t, i) => { if (results[i]?.length) products[t] = results[i]; });
  if (Object.keys(products).length) report.products = products;
}

// 니치 에디토리얼·매거진 추천 (최신 드롭·컬래버·셀럽 착장 등) 검색
export async function searchEditorialTrends(seasonLabel, moodHint) {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return null;
  try {
    const year = new Date().getFullYear();
    const query = `${year} ${seasonLabel} 남자 패션 ${moodHint || ''} 신상 브랜드 컬래버 추천 에디토리얼 매거진`.trim();
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: key, query, search_depth: 'basic', max_results: 4, topic: 'news' }),
    });
    const data = await res.json();
    if (!data.results?.length) return null;
    return data.results.map(r => `[${r.title}] ${r.content}`).join('\n').slice(0, 1400);
  } catch {
    return null;
  }
}
