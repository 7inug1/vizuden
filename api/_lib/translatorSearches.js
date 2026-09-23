// 외부 검색 — Tavily(추구미·날씨·에디토리얼)
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
