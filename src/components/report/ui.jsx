// 보고서 UI 파츠 — 프리미티브·차트·카드·스켈레톤·스트리밍 위젯
import { useState, useEffect } from 'react';
import { Shirt, Footprints, Watch } from 'lucide-react';
import { C, PALETTE } from './theme';
import { splitSearch } from './utils';

export function ActionBar({ isStreaming }) {
  const [copied, setCopied] = useState(false);
  const [bottom, setBottom] = useState(20);
  // footer가 보이면 그 위에서 멈추도록 bottom 보정
  useEffect(() => {
    if (isStreaming) return;
    const update = () => {
      const f = document.getElementById('report-footer');
      if (!f) return;
      const top = f.getBoundingClientRect().top;
      setBottom(Math.max(20, window.innerHeight - top + 14));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [isStreaming]);
  if (isStreaming) return null;
  return (
    <div className="no-print" style={{
      position: 'fixed', bottom, left: '50%', transform: 'translateX(-50%)', zIndex: 40,
      display: 'inline-flex',
      background: C.paper, border: `1px solid ${C.line}`,
      borderRadius: 999, padding: '5px 6px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      whiteSpace: 'nowrap',
    }}>
      <button
        onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 11, fontWeight: 600, padding: '5px 11px', borderRadius: 999, cursor: 'pointer',
          border: 'none', background: 'transparent', color: C.ink,
        }}
      >
        {copied
          ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>복사됨</>
          : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>보고서 링크 복사</>
        }
      </button>
    </div>
  );
}

// ── 섹션 fade-in 래퍼 ───────────────────────────────────────────
export function FadeIn({ children, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(12px)', transition: 'opacity 0.5s ease, transform 0.5s ease' }}>
      {children}
    </div>
  );
}

// ── 공통 ────────────────────────────────────────────────────────
export function SHead({ num, eyebrow, name }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, borderBottom: `1.5px solid ${C.ink}`, paddingBottom: 14, marginBottom: 22 }}>
      <div style={{ fontFamily: 'Georgia,serif', fontSize: 62, fontWeight: 400, lineHeight: 0.78, color: C.ink, flexShrink: 0 }}>{String(num).padStart(2, '0')}</div>
      <div style={{ flex: 1, paddingBottom: 4, minWidth: 0 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.accent, fontWeight: 600, marginBottom: 5 }}>{eyebrow}</div>
        <div style={{ fontSize: 25, fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
      </div>
    </div>
  );
}
export function Lead({ children }) {
  return <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.5, letterSpacing: '-0.01em', margin: '0 0 16px', color: C.ink }}>{children}</div>;
}
export function Body({ children, style }) {
  return <p style={{ fontSize: 16, lineHeight: 1.75, color: '#3f3a34', margin: '0 0 16px', ...style }}>{children}</p>;
}
export function SubLabel({ children }) {
  return <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.sub, margin: '8px 0 10px' }}>{children}</div>;
}

export const SUB_ANCHORS = { '예산': 'sub-budget', '무드 & 브랜드': 'sub-brands', '상황별 코디': 'sub-tpo', '컬러': 'sub-color', '핏 & 실루엣': 'sub-fit' };
export function SubSectionHead({ name, num }) {
  return (
    <div id={SUB_ANCHORS[name]} style={{ borderTop: `1px solid ${C.line}`, paddingTop: 24, marginTop: 44, marginBottom: 18, scrollMarginTop: 24 }}>
      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: C.ink, display: 'flex', alignItems: 'baseline', gap: 10 }}>
        {num && <span style={{ fontFamily: 'Georgia,serif', fontSize: 13, fontWeight: 400, color: C.accent }}>{num}</span>}
        {name}
      </div>
    </div>
  );
}

export function AxisRow({ leftLabel, rightLabel, value }) {
  const pct = Math.max(0, Math.min(100, value ?? 50));
  // 마운트 시 0 → 값으로 차오르는 모션
  const [v, setV] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setV(pct), 120);
    return () => clearTimeout(t);
  }, [pct]);
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ height: 5, background: '#e7e2da', borderRadius: 99, position: 'relative', marginBottom: 7 }}>
        <div style={{ position: 'absolute', top: 0, height: 5, borderRadius: 99, background: C.ink, width: `${v}%`, transition: `width 0.9s ${ease}` }} />
        <div style={{ position: 'absolute', top: '50%', width: 11, height: 11, borderRadius: '50%', background: C.ink, transform: 'translate(-50%,-50%)', border: `2px solid ${C.paper}`, left: `${v}%`, transition: `left 0.9s ${ease}` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.sub }}>
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

export function ColorRow({ name, hex, desc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '5px 0', fontSize: 13.5, color: '#3f3a34', lineHeight: 1.55 }}>
      <div style={{ width: 18, height: 18, borderRadius: 3, border: '1px solid rgba(0,0,0,.12)', flexShrink: 0, marginTop: 1, background: hex || '#ccc' }} />
      <span><span style={{ fontWeight: 600 }}>{name}</span> <span style={{ color: C.sub }}>— {desc}</span></span>
    </div>
  );
}

// 제품 둘러보기 — 실제 상품 미리보기(즉시성) + 무신사 검색 칩(정확성)을 한 블록으로
export function ProductStrip({ terms = [], products }) {
  const musinsa = (q) => `https://www.musinsa.com/search/goods?keyword=${encodeURIComponent(q)}`;
  const fav = (d) => `https://www.google.com/s2/favicons?domain=${d}&sz=32`;
  const lk = { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, textDecoration: 'none', color: C.ink, border: `1px solid #ddd6cb`, borderRadius: 999, padding: '5px 11px', background: '#fff' };
  const uniq = [...new Set(terms.filter(Boolean))];
  if (!uniq.length) return null;
  const seen = new Set();
  const list = [];
  uniq.forEach((t) => {
    (products?.[t] || []).forEach((p) => {
      if (p?.link && !seen.has(p.link)) { seen.add(p.link); list.push(p); }
    });
  });
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.faint, marginBottom: 8 }}>제품 둘러보기</div>
      {list.length > 0 && (
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, marginBottom: 9, WebkitOverflowScrolling: 'touch' }}>
          {list.slice(0, 8).map((p, i) => (
            <a key={i} href={p.link} target="_blank" rel="noreferrer" style={{ width: 118, flexShrink: 0, textDecoration: 'none', color: C.ink }}>
              <div style={{ width: 118, height: 118, borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.line}`, background: '#fff', marginBottom: 6 }}>
                <img src={p.image} alt="" loading="lazy" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; const box = e.target.parentElement; if (box) { box.style.background = '#efeae2'; } }} />
              </div>
              <div style={{ fontSize: 11.5, lineHeight: 1.4, color: '#3f3a34', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 3 }}>{p.title}</div>
              {p.price != null && <div style={{ fontSize: 12.5, fontWeight: 700 }}>{p.price.toLocaleString()}원</div>}
              {(p.brand || p.mall) && <div style={{ fontSize: 10, color: C.faint, marginTop: 1 }}>{p.brand || p.mall}</div>}
            </a>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {uniq.map((t, i) => (
          <a key={i} href={musinsa(t)} target="_blank" rel="noreferrer" style={lk}>
            <img src={fav('musinsa.com')} alt="" style={{ width: 13, height: 13 }} />
            <span>{t}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export function MoodAccordion({ mood, defaultOpen, products }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const fav = (d) => `https://www.google.com/s2/favicons?domain=${d}&sz=32`;
  const musinsa = (q) => `https://www.musinsa.com/search/goods?keyword=${encodeURIComponent(q)}`;
  // 핀터레스트 검색 페이지는 로그아웃 시 로그인 벽 → 구글 이미지로 우회 (핀터레스트풍 결과 그대로, 로그인 불필요)
  const pin = (q) => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${q} pinterest`)}`;
  // 태그가 아니라 키워드 검색 — 지어낸 태그의 빈 결과 문제 회피, 무드 서술형 쿼리 가능
  const insta = (t) => t.includes(' ') ? `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(t)}` : `https://www.instagram.com/explore/tags/${t}/`;
  const lk = { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, textDecoration: 'none', color: C.ink, border: `1px solid #ddd6cb`, borderRadius: 999, padding: '6px 12px 6px 9px', background: '#fff' };
  return (
    <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 16, marginBottom: 14, overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '17px 20px', cursor: 'pointer' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{mood.label}</div>
          {mood.budget_hint && (
            <div style={{ fontSize: 11, color: C.accent, marginTop: 2 }}>{mood.budget_hint}</div>
          )}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: C.accent, fontWeight: 600, flexShrink: 0 }}>
          {open ? '접기' : '펼쳐보기'}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .25s', color: C.accent }}><path d="M6 9l6 6 6-6" /></svg>
        </div>
      </div>
      {open && (
        <div style={{ padding: '0 20px 20px' }}>
          {mood.desc && <div style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.66, marginBottom: 14 }}>{mood.desc}</div>}
          <div style={{ fontSize: 11, color: C.faint, marginBottom: 8 }}>레퍼런스 탐색</div>
          <div style={{ display: 'flex', gap: 7, marginBottom: 14 }}>
            {mood.pinterest && <a href={pin(mood.pinterest)} target="_blank" rel="noreferrer" style={lk}><img src={fav('google.com')} alt="" style={{ width: 14, height: 14 }} />Google</a>}
            {mood.instagram && <a href={insta(mood.instagram)} target="_blank" rel="noreferrer" style={lk}><img src={fav('instagram.com')} alt="" style={{ width: 14, height: 14 }} />Instagram</a>}
          </div>
          {/* 브랜드 */}
          {(mood.brands ?? []).length > 0 && (
            <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.faint, marginBottom: 8 }}>브랜드</div>
          )}
          {(mood.brands ?? []).map((b, i) => {
            const bname = String(b?.name ?? '').trim();
            if (!bname) return null; // 이름 없는 브랜드 항목은 건너뜀 (크래시 방지)
            const tierLabel = { below: '예산 절약', match: '예산 적합', above: '예산 이상' }[b.tier];
            const tierColor = { below: '#6B9E8E', match: C.accent, above: '#9B8BA6' }[b.tier];
            const cleanDomain = b.domain ? b.domain.replace(/^https?:\/\//, '').replace(/\/$/, '') : null;
            const NameTag = cleanDomain ? 'a' : 'div';
            const nameProps = cleanDomain
              ? { href: `https://${cleanDomain}`, target: '_blank', rel: 'noreferrer', style: { fontSize: 15, fontWeight: 700, color: C.ink, textDecoration: 'underline', textDecorationColor: '#c9bfb5', textUnderlineOffset: 3 } }
              : { style: { fontSize: 15, fontWeight: 700 } };
            return (
              <div key={i} style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 12, padding: '14px 15px', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <NameTag {...nameProps}>{bname}</NameTag>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'center' }}>
                    {b.price_range && <span style={{ fontSize: 11, color: C.sub, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 999, padding: '2px 8px' }}>{b.price_range}</span>}
                    {tierLabel && <span style={{ fontSize: 11, fontWeight: 600, color: tierColor, background: `${tierColor}18`, borderRadius: 999, padding: '2px 8px' }}>{tierLabel}</span>}
                  </div>
                </div>
                {b.reason && <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.66 }}>{b.reason}</div>}
                {/* 브랜드별 탐색 — 구글 착장 이미지 + 인스타 브랜드 태그(실존 태그만: 영문 3자 이상) */}
                {(() => {
                  // 쿼리는 영문만 — 한글이 섞이면 국내 쇼핑몰풍 결과로 무드가 희석됨
                  const asciiName = ((bname.match(/[A-Za-z0-9&'.\- ]+/g) || []).join(' ').replace(/\s+/g, ' ').trim()) || bname;
                  const gimg = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${asciiName} menswear outfit`)}`;
                  const tag = (bname.match(/[A-Za-z0-9]+/g) || []).join('').toLowerCase();
                  const instaUrl = tag.length >= 3 ? `https://www.instagram.com/explore/tags/${tag}/` : null;
                  const sk = { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, textDecoration: 'none', color: C.sub, border: `1px solid ${C.line}`, borderRadius: 999, padding: '4px 10px 4px 8px', background: C.bg };
                  return (
                    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                      <a href={gimg} target="_blank" rel="noreferrer" style={sk}>
                        <img src={fav('google.com')} alt="" style={{ width: 12, height: 12 }} />Google
                      </a>
                      {instaUrl && (
                        <a href={instaUrl} target="_blank" rel="noreferrer" style={sk}>
                          <img src={fav('instagram.com')} alt="" style={{ width: 12, height: 12 }} />#{tag}
                        </a>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}
          {/* 제품 추천 — 무신사 카테고리 검색 (브랜드와 분리). 구버전 호환: brand.items 폴백 */}
          {(() => {
            const shopItems = (mood.shop_items?.length ? mood.shop_items : (mood.brands ?? []).flatMap(b => b.items || []));
            const uniq = [...new Set(shopItems.flatMap(splitSearch))];
            if (!uniq.length) return null;
            return (
              <div style={{ marginTop: 6 }}>
                <ProductStrip terms={uniq} products={products} />
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export function PantsIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12v3H6z" />
      <path d="M6 6v15h4l2-10 2 10h4V6" />
    </svg>
  );
}
export function JacketIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3l3 2.5L15 3l5 3-2 3.5.8 11.5H5.2L6 9.5 4 6z" />
      <path d="M12 5.5V21" />
    </svg>
  );
}
export function catMeta(category) {
  const c = String(category || '').toLowerCase();
  if (/bottom|하의|팬츠|슬랙스|바지|데님|진/.test(c)) return { Icon: PantsIcon, label: '하의' };
  if (/outer|아우터|자켓|재킷|코트|점퍼|블레이저/.test(c)) return { Icon: JacketIcon, label: '아우터' };
  if (/shoes|신발|슈즈|로퍼|스니커|부츠/.test(c)) return { Icon: Footprints, label: '신발' };
  if (/acc|액세|모자|가방|벨트|시계/.test(c)) return { Icon: Watch, label: '액세서리' };
  return { Icon: Shirt, label: '상의' };
}

export function TpoCard({ occ, products }) {
  const musinsa = (q) => `https://www.musinsa.com/search/goods?keyword=${encodeURIComponent(q)}`;
  const fav = (d) => `https://www.google.com/s2/favicons?domain=${d}&sz=32`;
  const lk = { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, textDecoration: 'none', color: C.ink, border: `1px solid #ddd6cb`, borderRadius: 999, padding: '5px 11px', background: '#fff' };
  // 신버전(items) 우선, 없으면 구버전(formula 문자열) 폴백 — 괄호(색상) 분리
  const items = Array.isArray(occ.items) && occ.items.length
    ? occ.items
    : (occ.formula ?? []).map((f, i) => {
        const colorM = String(f).match(/\(([^)]*)\)/);
        const color = colorM ? colorM[1].trim() : null;
        const base = String(f).replace(/\([^)]*\)/g, '').trim(); // 괄호 제거
        const search = splitSearch(base)[0] || base;             // 첫 옵션만
        return { category: i === 0 ? 'top' : i === 1 ? 'bottom' : 'shoes', name: base, color, search };
      });
  return (
    <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: '18px 20px', minWidth: 0, overflow: 'hidden' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.accent, fontWeight: 600, marginBottom: 6 }}>{occ.tag}</div>
      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: occ.season_note ? 6 : 10 }}>{occ.name}</div>
      {occ.season_note && (
        <div style={{ fontSize: 12, color: C.accent, background: `${C.accent}12`, borderRadius: 8, padding: '5px 10px', marginBottom: 10, lineHeight: 1.5 }}>
          {occ.season_note}
        </div>
      )}
      {items.length > 0 && (() => {
        // 이 코디 완성가 — 아이템별 최저가 합산
        const termOf = (it) => it.search || splitSearch(it.name)[0] || it.name;
        const cheapest = (t) => (products?.[t] || []).reduce((m, p) => (p.price && p.price < m ? p.price : m), Infinity);
        const priced = items.map((it) => cheapest(termOf(it))).filter((v) => v !== Infinity);
        const outfitTotal = priced.reduce((a, b) => a + b, 0);
        const allPriced = priced.length === items.length;
        return (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.faint }}>스타일 조합</div>
            {outfitTotal > 0 && (
              <div style={{ fontSize: 12, color: C.sub }}>
                {allPriced ? '완성가' : '일부'} <span style={{ fontWeight: 700, color: C.ink, fontSize: 13.5 }}>{outfitTotal.toLocaleString()}원</span>
                <span style={{ fontSize: 10, color: C.faint }}> ~부터</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {items.map((it, i) => {
              const { Icon, label } = catMeta(it.category);
              const price = cheapest(termOf(it));
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: '9px 12px' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fff', border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.sub, flexShrink: 0 }}>
                    <Icon size={17} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: C.faint, marginBottom: 1 }}>{label}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                      {it.name}
                      {it.color && <span style={{ fontSize: 11, fontWeight: 600, color: C.accent, background: `${C.accent}15`, borderRadius: 999, padding: '1px 8px' }}>{it.color}</span>}
                    </div>
                  </div>
                  {price !== Infinity && <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, flexShrink: 0 }}>{price.toLocaleString()}원~</div>}
                </div>
              );
            })}
          </div>
          <ProductStrip terms={items.map((it) => it.search || splitSearch(it.name)[0] || it.name)} products={products} />
        </>
        );
      })()}
      {occ.note && <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.65, marginTop: 10 }}>{occ.note}</div>}
    </div>
  );
}

export function DonutChart({ allocation = [], total = 0 }) {
  const [hot, setHot] = useState(null);
  const cx = 100, cy = 100, ro = 90, ri = 56;
  const polar = (a, r) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  function arc(s, e) {
    const a0 = s * 2 * Math.PI - Math.PI / 2, a1 = e * 2 * Math.PI - Math.PI / 2;
    const o0 = polar(a0, ro), o1 = polar(a1, ro), i0 = polar(a0, ri), i1 = polar(a1, ri);
    const lg = e - s > 0.5 ? 1 : 0;
    return `M ${o0.x} ${o0.y} A ${ro} ${ro} 0 ${lg} 1 ${o1.x} ${o1.y} L ${i1.x} ${i1.y} A ${ri} ${ri} 0 ${lg} 0 ${i0.x} ${i0.y} Z`;
  }
  let acc = 0;
  const slices = allocation.map((d, i) => { const s = acc, e = acc + (d.pct ?? 0) / 100; acc = e; return { ...d, s, e, color: PALETTE[i % PALETTE.length] }; });
  const totalStr = total >= 10000 ? `${(total / 10000).toFixed(0)}만원` : `${total.toLocaleString()}원`;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24, animation: 'donutIn 0.7s cubic-bezier(0.22,1,0.36,1)' }}>
        <style>{`@keyframes donutIn { from { opacity: 0; transform: scale(0.92) rotate(-8deg); } to { opacity: 1; transform: scale(1) rotate(0); } }`}</style>
        <svg width="240" height="240" viewBox="0 0 200 200">
          {slices.map((sl, i) => <path key={i} d={arc(sl.s, sl.e)} fill={sl.color} style={{ opacity: hot !== null && hot !== i ? 0.35 : 1, transition: 'opacity .15s', cursor: 'pointer' }} onMouseEnter={() => setHot(i)} onMouseLeave={() => setHot(null)} />)}
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize={9} fill={C.sub}>총 예산</text>
          <text x={cx} y={cy + 13} textAnchor="middle" fontSize={14} fill={C.ink} fontWeight={700}>{totalStr}</text>
        </svg>
      </div>
      <div>
        {slices.map((sl, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, padding: '10px 0', borderBottom: `1px solid ${C.line}`, background: hot === i ? '#efe9df' : 'transparent', transition: 'background .15s', cursor: 'pointer' }} onMouseEnter={() => setHot(i)} onMouseLeave={() => setHot(null)}>
            <span style={{ width: 10, height: 10, borderRadius: 3, flexShrink: 0, background: sl.color }} />
            <span style={{ flex: 1, fontWeight: 600 }}>{sl.cat}<span style={{ fontSize: 12, color: C.sub, fontWeight: 400, display: 'block' }}>{sl.note}</span></span>
            <span style={{ color: C.sub, fontSize: 12 }}>{sl.pct}%</span>
            {total > 0 && <span style={{ fontWeight: 600, fontSize: 13, minWidth: 70, textAlign: 'right' }}>{Math.round((sl.pct / 100) * total).toLocaleString()}원</span>}
          </div>
        ))}
        {total > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, padding: '10px 0', borderTop: `1.5px solid ${C.ink}` }}>
            <span style={{ width: 10, flexShrink: 0 }} />
            <span style={{ flex: 1, fontWeight: 700, color: C.ink }}>합계</span>
            <span style={{ color: C.sub, fontSize: 12 }}>100%</span>
            <span style={{ fontWeight: 700, fontSize: 13, minWidth: 70, textAlign: 'right' }}>{total.toLocaleString()}원</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 스켈레톤 ────────────────────────────────────────────────────
// 섹션 헤더(정적)는 바로 보여주고 본문만 skeleton — 스트리밍되면서 채워진다
export function SectionSkeleton({ num, eyebrow, name, lines = 4, anchor = false }) {
  return (
    <section id={anchor ? 'frontier-anchor' : undefined} style={{ marginTop: 0 }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      <SHead num={num} eyebrow={eyebrow} name={name} />
      <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
        <div style={{ width: '56%', height: 22, background: C.line, borderRadius: 4, marginBottom: 20 }} />
        {Array(lines).fill(0).map((_, i) => (
          <div key={i} style={{ height: 15, background: C.line, borderRadius: 4, marginBottom: 11, width: i === lines - 1 ? '62%' : '100%' }} />
        ))}
      </div>
    </section>
  );
}

// 저장된 보고서 불러오는 중 — 전체 골격
export function FullSkeleton() {
  return (
    <>
      <SectionSkeleton num={1} eyebrow="Identity" name="당신은 이런 사람입니다" lines={5} />
      <div style={{ height: 64 }} />
      <SectionSkeleton num={2} eyebrow="Direction" name="스타일 방향" lines={5} />
      <div style={{ height: 64 }} />
      <SectionSkeleton num={3} eyebrow="Styling" name="무드, 브랜드, 코디" lines={6} />
    </>
  );
}

// 고정 헤더(NoticeBar + SiteHeader) 높이만큼 보정해서 스크롤 — 제목 라인이 헤더 바로 아래 딱 오게
export function scrollToAnchor(id, gap = 12) {
  const el = document.getElementById(id);
  if (!el) return;
  const noticeH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--notice-bar-height')) || 0;
  const header = document.querySelector('header');
  const headerH = header ? header.getBoundingClientRect().height : 0;
  const offset = noticeH + headerH - gap;
  const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

export const FRONTIER_LABELS = {
  identity: '당신을 읽는 중',
  direction: '스타일 방향 잡는 중',
  brands: '무드 & 브랜드 고르는 중',
  tpo: '상황별 코디 짜는 중',
  color: '컬러 매칭 중',
  fit: '핏 분석 중',
  conclusion: '마무리하는 중',
};

// 익명 로딩 티저 — 다음 섹션 제목을 미리 노출하지 않는 얇은 로딩 표시
export function LoadingTeaser({ anchor = false }) {
  return (
    <div id={anchor ? 'frontier-anchor' : undefined} style={{ padding: '4px 0', animation: 'pulse 1.5s ease-in-out infinite' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      <div style={{ height: 13, background: C.line, borderRadius: 4, marginBottom: 9, width: '68%' }} />
      <div style={{ height: 13, background: C.line, borderRadius: 4, width: '42%' }} />
    </div>
  );
}

// 로딩 중 하위 섹션 skeleton
export function SubSectionSkeleton({ name, anchor = false, lines = 3 }) {
  return (
    <div id={anchor ? 'frontier-anchor' : undefined}>
      <SubSectionHead name={name} />
      <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        {Array(lines).fill(0).map((_, i) => (
          <div key={i} style={{ height: 14, background: C.line, borderRadius: 4, marginBottom: 10, width: i === lines - 1 ? '55%' : '100%' }} />
        ))}
      </div>
    </div>
  );
}

// 스트리밍 중 하단 고정 pill — 현재 로딩 섹션으로 스크롤 (+자동 따라가기 재개)
export function StreamingScrollPill({ frontier, onReengage }) {
  const label = FRONTIER_LABELS[frontier];
  if (!label) return null;
  const scrollToFrontier = () => { onReengage?.(); scrollToAnchor('frontier-anchor'); };
  return (
    <div className="no-print" style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 45 }}>
      <style>{`@keyframes blink{0%,100%{opacity:0.2}50%{opacity:0.9}}`}</style>
      <button
        onClick={scrollToFrontier}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 9,
          background: C.ink, color: '#f3efe8', border: 'none',
          borderRadius: 999, padding: '10px 15px', cursor: 'pointer',
          fontSize: 12.5, fontWeight: 600, letterSpacing: '-0.01em',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)', whiteSpace: 'nowrap',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.7 }}>
          <path d="M6 1.5v9M3 7.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>{label}</span>
        <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: '#a8a29e', animation: `blink 1.2s ${i * 0.22}s infinite ease-in-out` }} />
          ))}
        </span>
      </button>
    </div>
  );
}

// 목차 — 스트리밍 완료 후 표시. 하위 섹션 항상 노출.
export function TableOfContents({ r }) {
  const scrollTo = (id) => scrollToAnchor(id);
  const items = [
    { id: 'sec-identity', num: '01', label: '당신은 이런 사람입니다' },
    { id: 'sec-direction', num: '02', label: '스타일 방향', subs: [
      (r.plan?.allocation?.length) && { id: 'sub-budget', label: '예산' },
    ].filter(Boolean) },
    { id: 'sec-styling', num: '03', label: '무드, 브랜드, 코디', subs: [
      r.brands && { id: 'sub-brands', label: '무드 & 브랜드' },
      r.tpo && { id: 'sub-tpo', label: '상황별 코디' },
    ].filter(Boolean) },
    { id: 'sec-colorfit', num: '04', label: '컬러와 핏', subs: [
      r.color && { id: 'sub-color', label: '컬러' },
      r.fit && { id: 'sub-fit', label: '핏 & 실루엣' },
    ].filter(Boolean) },
    { id: 'sec-conclusion', num: '05', label: '마무리' },
  ].filter((it) => it.id !== 'sec-direction' || r.direction)
   .filter((it) => it.id !== 'sec-styling' || r.brands || r.tpo)
   .filter((it) => it.id !== 'sec-colorfit' || r.color || r.fit);
  return (
    <div className="no-print" style={{ margin: '36px 0 8px', paddingLeft: 16, borderLeft: `1px solid ${C.line}` }}>
      <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.faint, marginBottom: 12 }}>목차</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {items.map((it) => (
          <div key={it.id}>
            <button onClick={() => scrollTo(it.id)}
              style={{ display: 'flex', alignItems: 'baseline', gap: 12, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
              <span style={{ fontFamily: 'Georgia,serif', fontSize: 13, color: C.accent, minWidth: 20 }}>{it.num}</span>
              <span style={{ fontSize: 14.5, color: C.sub, fontWeight: 500 }}>{it.label}</span>
            </button>
            {it.subs?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 7, paddingLeft: 32 }}>
                {it.subs.map((s) => (
                  <button key={s.id} onClick={() => scrollTo(s.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, fontSize: 13, color: C.faint }}>
                    · {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


// 예산 미니 위젯 — 무드·브랜드·코디(03) 섹션을 읽는 동안 하단 좌측에 고정.
// 브랜드/제품 추천을 보면서 예산 배분을 항상 시각적으로 연결해준다. 클릭 시 예산 섹션으로.
export function BudgetMiniWidget({ allocation = [], total = 0 }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = document.getElementById('sec-styling');
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setShow(e.isIntersecting), { rootMargin: '-10% 0px -20% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  if (!allocation.length || !show) return null;
  const cx = 18, cy = 18, ro = 16, ri = 9;
  const polar = (a, r) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  const arc = (s, e) => {
    const a0 = s * 2 * Math.PI - Math.PI / 2, a1 = e * 2 * Math.PI - Math.PI / 2;
    const o0 = polar(a0, ro), o1 = polar(a1, ro), i0 = polar(a0, ri), i1 = polar(a1, ri);
    const lg = e - s > 0.5 ? 1 : 0;
    return `M ${o0.x} ${o0.y} A ${ro} ${ro} 0 ${lg} 1 ${o1.x} ${o1.y} L ${i1.x} ${i1.y} A ${ri} ${ri} 0 ${lg} 0 ${i0.x} ${i0.y} Z`;
  };
  let acc = 0;
  const slices = allocation.map((d, i) => { const s = acc, e = acc + (d.pct ?? 0) / 100; acc = e; return { s, e, color: PALETTE[i % PALETTE.length] }; });
  const totalStr = total >= 10000 ? `${Math.round(total / 10000)}만원` : `${total.toLocaleString()}원`;
  return (
    <button
      onClick={() => scrollToAnchor('sub-budget')}
      className="no-print"
      style={{
        position: 'fixed', left: 14, bottom: 20, zIndex: 38,
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: C.paper, border: `1px solid ${C.line}`, borderRadius: 999,
        padding: '6px 12px 6px 7px', boxShadow: '0 4px 16px rgba(0,0,0,.12)', cursor: 'pointer',
      }}
    >
      <svg width="26" height="26" viewBox="0 0 36 36">
        {slices.map((sl, i) => <path key={i} d={arc(sl.s, sl.e)} fill={sl.color} />)}
      </svg>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: C.ink }}>예산 {totalStr}</span>
    </button>
  );
}

// 완료 토스트 — 스트리밍이 끝나면 새로 추가된 요소를 알려준다
export function DoneToast({ show }) {
  if (!show) return null;
  return (
    <div className="no-print" style={{
      position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 60,
      background: C.ink, color: '#f3efe8', borderRadius: 999, padding: '10px 18px',
      fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
      boxShadow: '0 6px 24px rgba(0,0,0,.28)', animation: 'toastIn .3s ease-out',
    }}>
      <style>{`@keyframes toastIn { from { opacity: 0; transform: translate(-50%, -10px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>
      번역 완성 — 요약·목차가 추가됐어요 ↑
    </div>
  );
}

// 본문 속 브랜드/용어에 점선 밑줄 + 탭 시 설명 툴팁 + 공식 사이트 링크
// refs: [{ term, note, domain? }]
export function RefText({ text, refs }) {
  const [openIdx, setOpenIdx] = useState(null);
  if (!text) return null;
  if (!Array.isArray(refs) || refs.length === 0) return <>{text}</>;
  const sorted = [...refs].sort((a, b) => (b.term?.length ?? 0) - (a.term?.length ?? 0));
  const re = new RegExp(`(${sorted.map((r) => r.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  const segs = text.split(re);
  return (
    <>
      {segs.map((seg, i) => {
        const ref = refs.find((r) => r.term === seg);
        if (!ref) return <span key={i}>{seg}</span>;
        const open = openIdx === i;
        return (
          <span
            key={i}
            style={{ position: 'relative', display: 'inline-block' }}
            onMouseEnter={() => setOpenIdx(i)}
            onMouseLeave={() => setOpenIdx(null)}
          >
            <span
              onClick={(e) => { e.stopPropagation(); setOpenIdx(open ? null : i); }}
              style={{ borderBottom: `1.5px dotted ${C.accent}`, fontWeight: 600, cursor: 'pointer', color: 'inherit' }}
            >{seg}<span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 13, height: 13, borderRadius: '50%', border: `1px solid ${C.accent}`, color: C.accent, fontSize: 9, fontWeight: 700, marginLeft: 3, transform: 'translateY(-1px)', lineHeight: 1 }}>?</span></span>
            {open && (
              <span style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, width: 232, background: C.ink, color: '#F5F2ED', borderRadius: 10, padding: '11px 13px', fontSize: 12, lineHeight: 1.65, zIndex: 40, boxShadow: '0 8px 24px rgba(0,0,0,0.28)', fontWeight: 400 }}>
                {ref.note}
                {ref.domain && (
                  <a href={`https://${ref.domain}`} target="_blank" rel="noreferrer"
                    style={{ display: 'block', marginTop: 8, color: '#D9B48F', textDecoration: 'underline', textUnderlineOffset: 2, lineHeight: 1.4 }}>
                    공식 사이트 ↗
                  </a>
                )}
              </span>
            )}
          </span>
        );
      })}
    </>
  );
}
