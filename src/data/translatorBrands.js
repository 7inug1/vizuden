/**
 * VIZUDEN 스타일 번역서 전용 큐레이션 브랜드 목록
 * tags: 스타일 필터링에 사용되는 키워드 (identity keywords와 매칭)
 * tier: 1=입문, 2=중간, 3=고급, 4=럭셔리
 * musinsa: 무신사 검색 가능 여부
 */
export const TRANSLATOR_BRANDS = [
  // ── 미니멀 / 일본 ──────────────────────────────────────────────
  { name: 'Auralee',            tags: ['minimal', 'japanese', 'quiet luxury', '절제', '내면'], tier: 3, musinsa: true },
  { name: 'Comoli',             tags: ['minimal', 'japanese', 'workwear', '절제', '장인'], tier: 3, musinsa: true },
  { name: 'orSlow',             tags: ['workwear', 'japanese', 'americana', 'minimal', '일상'], tier: 2, musinsa: true },
  { name: 'Lemaire',            tags: ['minimal', 'european', 'quiet luxury', '절제', '여행'], tier: 3, musinsa: true },
  { name: 'Margaret Howell',    tags: ['minimal', 'british', 'classic', '절제', '기능미'], tier: 3, musinsa: false },
  { name: 'Norse Projects',     tags: ['minimal', 'scandinavian', 'outdoor', '기능미', '일상'], tier: 2, musinsa: true },
  { name: 'A.P.C.',             tags: ['minimal', 'french', 'classic', '일상', '절제'], tier: 2, musinsa: true },
  { name: 'COS',                tags: ['minimal', '일상', '절제'], tier: 1, musinsa: false },
  { name: 'Arket',              tags: ['minimal', 'scandinavian', '일상'], tier: 1, musinsa: false },

  // ── 아메카지 / 헤리티지 워크웨어 ──────────────────────────────
  { name: 'Engineered Garments', tags: ['workwear', 'americana', 'amekaji', '헤리티지', '탐험'], tier: 2, musinsa: true },
  { name: 'KAPITAL',             tags: ['amekaji', 'heritage', 'western', '헤리티지', '탐험', '노마드'], tier: 3, musinsa: true },
  { name: 'Needles',             tags: ['amekaji', 'workwear', 'heritage', '헤리티지'], tier: 2, musinsa: true },
  { name: 'visvim',              tags: ['amekaji', 'heritage', 'western', 'handcraft', '헤리티지', '노마드', '장인'], tier: 4, musinsa: true },
  { name: 'RRL',                 tags: ['western', 'americana', 'heritage', 'workwear', '웨스턴', '헤리티지', '노마드'], tier: 3, musinsa: false },
  { name: 'Filson',              tags: ['heritage', 'workwear', 'outdoor', 'americana', '헤리티지', '탐험'], tier: 2, musinsa: false },
  { name: 'Carhartt WIP',        tags: ['workwear', 'americana', '일상', '기능미'], tier: 1, musinsa: true },
  { name: "Levi's Vintage Clothing", tags: ['americana', 'heritage', 'denim', '헤리티지'], tier: 2, musinsa: false },
  { name: 'Pendleton',           tags: ['western', 'americana', 'heritage', '웨스턴', '헤리티지'], tier: 2, musinsa: false },
  { name: 'Stetson',             tags: ['western', 'americana', 'heritage', '웨스턴', '노마드', '헤리티지'], tier: 2, musinsa: false },

  // ── 다크 / 아방가르드 ──────────────────────────────────────────
  { name: 'Fear of God',         tags: ['dark', 'minimal', 'workwear', 'americana', '어두운 미니멀', '노마드', '내면'], tier: 4, musinsa: true },
  { name: 'Rick Owens',          tags: ['dark', 'avant-garde', '어두운 미니멀', '경계 없음'], tier: 4, musinsa: true },
  { name: 'Julius',              tags: ['dark', 'avant-garde', '어두운 미니멀'], tier: 4, musinsa: false },
  { name: 'Ann Demeulemeester',  tags: ['dark', 'avant-garde', '어두운 미니멀', '내면'], tier: 4, musinsa: false },
  { name: 'Yohji Yamamoto',      tags: ['dark', 'avant-garde', 'japanese', '어두운 미니멀', '절제', '내면'], tier: 4, musinsa: false },
  { name: 'Comme des Garçons',   tags: ['avant-garde', 'japanese', '실험', '경계 없음'], tier: 4, musinsa: true },
  { name: 'Maison Margiela',     tags: ['avant-garde', 'minimal', 'deconstructed', '절제', '실험'], tier: 4, musinsa: true },

  // ── 클래식 / 테일러드 ─────────────────────────────────────────
  { name: "Drake's",             tags: ['classic', 'british', 'tailored', '클래식', '장인'], tier: 3, musinsa: false },
  { name: 'Corridor',            tags: ['classic', 'americana', 'tailored', '클래식'], tier: 2, musinsa: false },
  { name: 'Sunspel',             tags: ['classic', 'british', 'minimal', '클래식', '절제'], tier: 2, musinsa: false },
  { name: 'Oliver Spencer',      tags: ['classic', 'british', 'tailored'], tier: 2, musinsa: false },
  { name: 'De Bonne Facture',    tags: ['classic', 'french', 'tailored', '장인', '절제'], tier: 3, musinsa: false },

  // ── 아웃도어 / 기능성 ─────────────────────────────────────────
  { name: "Arc'teryx",           tags: ['outdoor', 'functional', 'technical', '기능미', '탐험'], tier: 3, musinsa: true },
  { name: 'Snow Peak',           tags: ['outdoor', 'japanese', 'functional', '기능미', '탐험', '노마드'], tier: 3, musinsa: true },
  { name: 'Patagonia',           tags: ['outdoor', 'functional', 'americana', '기능미', '탐험'], tier: 2, musinsa: true },
  { name: 'Goldwin',             tags: ['outdoor', 'japanese', 'minimal', 'functional', '기능미'], tier: 3, musinsa: true },
  { name: 'Norrøna',             tags: ['outdoor', 'scandinavian', 'technical', '탐험'], tier: 3, musinsa: false },

  // ── 컨템포러리 / 스트리트 ─────────────────────────────────────
  { name: 'Acne Studios',        tags: ['contemporary', 'scandinavian', 'minimal', '절제'], tier: 3, musinsa: true },
  { name: 'Stone Island',        tags: ['technical', 'italian', 'contemporary', '기능미'], tier: 3, musinsa: true },
  { name: 'CP Company',          tags: ['technical', 'italian', 'contemporary', '기능미'], tier: 3, musinsa: true },
  { name: 'Stüssy',              tags: ['streetwear', 'americana', 'surf', '일상'], tier: 1, musinsa: true },
  { name: 'Our Legacy',          tags: ['minimal', 'scandinavian', 'contemporary', '절제', '실험'], tier: 3, musinsa: true },
  { name: 'Jacquemus',           tags: ['contemporary', 'french', 'minimal'], tier: 3, musinsa: false },

  // ── 한국 브랜드 ───────────────────────────────────────────────
  { name: 'RECTO',               tags: ['contemporary', 'minimal', '클래식', '일상'], tier: 2, musinsa: true },
  { name: 'POTTERY',             tags: ['minimal', 'workwear', '일상', '절제'], tier: 2, musinsa: true },
  { name: 'NOHANT',              tags: ['contemporary', 'minimal', '일상'], tier: 2, musinsa: true },
  { name: 'IISE',                tags: ['contemporary', 'korean', 'streetwear', '실험'], tier: 2, musinsa: true },
  { name: 'THISISNEVERTHAT',     tags: ['streetwear', 'contemporary', '일상'], tier: 1, musinsa: true },

  // ── 럭셔리 ────────────────────────────────────────────────────
  { name: 'Loro Piana',          tags: ['quiet luxury', 'italian', 'minimal', '절제', '장인'], tier: 4, musinsa: false },
  { name: 'Brunello Cucinelli',  tags: ['quiet luxury', 'italian', 'classic', '절제'], tier: 4, musinsa: false },
  { name: 'Bottega Veneta',      tags: ['quiet luxury', 'italian', 'minimal', '절제'], tier: 4, musinsa: true },
  { name: 'Loewe',               tags: ['craft', 'spanish', 'contemporary', '장인'], tier: 4, musinsa: true },
  { name: 'Hermès',              tags: ['quiet luxury', 'french', 'heritage', '장인', '헤리티지'], tier: 4, musinsa: false },
];

/**
 * identity keywords 배열을 기반으로 관련 브랜드 필터링
 * @param {string[]} keywords - identity/style keywords
 * @param {number} limit - 반환할 최대 브랜드 수
 */
export function filterBrandsByKeywords(keywords = [], limit = 25) {
  if (!keywords.length) return TRANSLATOR_BRANDS.slice(0, limit);

  const lowerKeywords = keywords.map((k) => k.toLowerCase());

  const scored = TRANSLATOR_BRANDS.map((brand) => {
    const score = brand.tags.reduce((acc, tag) => {
      const lowerTag = tag.toLowerCase();
      return acc + lowerKeywords.filter((kw) => lowerTag.includes(kw) || kw.includes(lowerTag)).length;
    }, 0);
    return { brand, score };
  });

  // 매칭 점수 내림차순, 동점이면 tier 오름차순
  scored.sort((a, b) => b.score - a.score || a.brand.tier - b.brand.tier);

  // 점수 0인 것도 일부 포함 (다양성 확보)
  const matched   = scored.filter((s) => s.score > 0).slice(0, Math.floor(limit * 0.75));
  const fallbacks = scored.filter((s) => s.score === 0).slice(0, limit - matched.length);

  return [...matched, ...fallbacks].map((s) => s.brand);
}
