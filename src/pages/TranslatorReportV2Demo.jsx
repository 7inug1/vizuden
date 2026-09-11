// "보는 보고서" 데모 (dev 전용) — 진단은 산문, 처방은 카드, 실행은 룩 보드(실물 이미지), 끝은 스타일 카드+편지
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import Footer from '../components/Footer';
import { C } from '../components/report/theme';

const serif = 'Georgia, "Times New Roman", serif';

function SubLabel({ children }) {
  return <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accent, fontWeight: 600, marginBottom: 10 }}>{children}</div>;
}
function Lead({ children }) {
  return <p style={{ fontSize: 17.5, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.55, color: C.ink, margin: '0 0 12px' }}>{children}</p>;
}
function Body({ children }) {
  return <p style={{ fontSize: 15, lineHeight: 1.85, color: '#44403c', margin: '0 0 18px' }}>{children}</p>;
}
function Gap({ h = 72 }) { return <div style={{ height: h }} />; }

function SectionHead({ num, en, ko }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, borderBottom: `1.5px solid ${C.ink}`, paddingBottom: 8, marginBottom: 26 }}>
      <span style={{ fontFamily: serif, fontSize: 13, letterSpacing: '0.18em', color: C.ink }}>{String(num).padStart(2, '0')}</span>
      <span style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.faint }}>{en}</span>
      <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: C.ink }}>{ko}</span>
    </div>
  );
}

// ── 룩 보드 — 스타일리스트가 옷을 늘어놓은 테이블 ──────────────
function LookBoard({ look, index }) {
  const total = look.items.reduce((s, it) => s + (it.price || 0), 0);
  const cols = look.items.length >= 4 ? 2 : look.items.length;
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 3px 18px rgba(60,45,30,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '16px 20px 0' }}>
        <span style={{ fontFamily: serif, fontSize: 12, letterSpacing: '0.2em', color: C.ink }}>LOOK {String(index + 1).padStart(2, '0')}</span>
        <span style={{ fontSize: 13.5, fontWeight: 700 }}>{look.name}</span>
      </div>
      <div style={{ padding: '14px 20px 0', fontSize: 13.5, color: C.sub, lineHeight: 1.6 }}>{look.caption}</div>

      {/* 플랫레이 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10, padding: '16px 20px' }}>
        {look.items.map((it, i) => (
          <a key={i} href={it.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ position: 'relative', background: '#f8f7f4', borderRadius: 12, overflow: 'hidden', aspectRatio: '1 / 1' }}>
              <img src={it.image} alt={it.name} loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.style.display = 'none'; }} />
              <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', background: 'rgba(28,25,23,0.82)', color: '#f5f2ed', borderRadius: 999, padding: '3px 9px' }}>{it.role}</span>
            </div>
            <div style={{ padding: '7px 2px 0' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.brand || it.mall || it.name}</div>
              <div style={{ fontSize: 12, color: C.sub }}>{it.price ? `${it.price.toLocaleString()}원` : ''}</div>
            </div>
          </a>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '4px 20px 16px', borderTop: `1px dashed ${C.line}`, marginTop: 2, paddingTop: 12 }}>
        <span style={{ fontSize: 11.5, letterSpacing: '0.1em', color: C.faint }}>이 코디 완성가</span>
        <span style={{ fontFamily: serif, fontSize: 17, fontWeight: 700, color: C.ink }}>₩{total.toLocaleString()}</span>
      </div>
    </div>
  );
}

// ── 스타일 카드 — 공유용 한 장 (9:16 느낌) ─────────────────────
function StyleCard({ r, char }) {
  return (
    <div style={{ width: 300, margin: '0 auto', background: C.ink, borderRadius: 22, padding: '30px 24px 24px', color: '#F5F2ED', textAlign: 'center', boxShadow: '0 16px 48px rgba(28,25,23,0.28)' }}>
      <div style={{ fontFamily: serif, fontSize: 11, letterSpacing: '0.34em', color: 'rgba(245,242,237,0.55)', marginBottom: 22 }}>VIZUDEN</div>
      {char && <img src={char} alt="" style={{ width: 110, height: 110, objectFit: 'contain', margin: '0 auto 18px', display: 'block', filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.35))' }} onError={(e) => { e.target.style.display = 'none'; }} />}
      <div style={{ fontSize: 10.5, letterSpacing: '0.26em', color: '#9A7259', fontWeight: 600, marginBottom: 10 }}>STYLE IDENTITY</div>
      <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 6 }}>{r.naming.name}</div>
      <div style={{ fontSize: 12.5, color: 'rgba(245,242,237,0.6)', marginBottom: 20 }}>{r.naming.tagline}</div>

      {/* 코어 팔레트 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
        {r.system.colors.core.map((c, i) => (
          <div key={i} style={{ width: 26, height: 26, borderRadius: '50%', background: c.hex, border: '1.5px solid rgba(245,242,237,0.25)' }} title={c.name} />
        ))}
      </div>

      {/* 처방 3줄 압축 */}
      <div style={{ textAlign: 'left', borderTop: '1px solid rgba(245,242,237,0.15)', paddingTop: 16 }}>
        {r.rules.map((rule, i) => (
          <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'baseline', marginBottom: i < r.rules.length - 1 ? 9 : 0 }}>
            <span style={{ fontFamily: serif, fontSize: 12, fontWeight: 700, color: '#9A7259', flexShrink: 0 }}>{i + 1}</span>
            <span style={{ fontSize: 11.5, lineHeight: 1.55, color: 'rgba(245,242,237,0.85)' }}>{rule}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, fontSize: 9.5, letterSpacing: '0.2em', color: 'rgba(245,242,237,0.35)' }}>STYLE TRANSLATOR · No.{r.issue.no}</div>
    </div>
  );
}

const PERSONA_META = {
  son: { file: 'son-seokku-v2', who: '손석구 님의 스타일 아이덴티티', char: '/characters/ICMN.png' },
  me:  { file: 'jinwook-v2',    who: '신진욱 님의 스타일 아이덴티티', char: null },
};

export default function TranslatorReportV2Demo({ persona = 'son' }) {
  const meta = PERSONA_META[persona] || PERSONA_META.son;
  const [r, setR] = useState(null);
  useEffect(() => {
    import(`../data/samples/${meta.file}.json`).then((m) => setR(m.default));
  }, [meta.file]);

  if (!import.meta.env.DEV) return <Navigate to="/" replace />;
  if (!r) return <div style={{ minHeight: '100vh', background: C.bg }} />;

  const wrap = { margin: 0, background: C.bg, color: C.ink, fontFamily: '"Pretendard Variable",Pretendard,-apple-system,sans-serif', WebkitFontSmoothing: 'antialiased', lineHeight: 1.6, minHeight: '100vh' };
  const inner = { maxWidth: 660, margin: '0 auto', padding: '40px 26px 80px' };

  return (
    <div style={wrap}>
      <SiteHeader />
      <div style={inner}>

        {/* ── 표지 ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1.5px solid ${C.ink}`, borderBottom: `1px solid ${C.line}`, padding: '9px 2px', marginBottom: 52 }}>
          <span style={{ fontFamily: serif, fontSize: 11, letterSpacing: '0.22em' }}>STYLE TRANSLATOR</span>
          <span style={{ fontFamily: serif, fontSize: 11, letterSpacing: '0.1em', color: C.sub }}>{r.issue.season} · No.{r.issue.no}</span>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          {meta.char && <img src={meta.char} alt="" style={{ width: 150, height: 150, objectFit: 'contain', margin: '0 auto 24px', display: 'block', filter: 'drop-shadow(0 20px 28px rgba(60,45,30,.14))' }} onError={(e) => { e.target.style.display = 'none'; }} />}
          <div style={{ fontSize: 12, letterSpacing: '0.3em', color: C.sub, marginBottom: 14 }}>{meta.who}</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2, margin: '0 0 10px' }}>{r.naming.name}</h1>
          <div style={{ fontSize: 15, color: C.sub, fontWeight: 500 }}>{r.naming.tagline}</div>
        </div>

        <Gap h={76} />

        {/* ── 01 진단 — 산문 (감동은 글에서) ── */}
        <SectionHead num={1} en="Diagnosis" ko="당신을 읽었다" />

        {/* 사진 주석 — 실제 보고서에선 사용자가 올린 핏 사진 위에 */}
        {r.diagnosis.photo && (
          <div style={{ marginBottom: 30 }}>
            <SubLabel>제출하신 사진에서</SubLabel>
            <div style={{ maxWidth: 340, margin: '0 auto' }}>
              <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', boxShadow: '0 6px 24px rgba(60,45,30,0.12)' }}>
                <img src={r.diagnosis.photo.url} alt="" style={{ width: '100%', display: 'block' }} />
                {r.diagnosis.photo.points.map((pt, i) => (
                  <div key={i} style={{ position: 'absolute', left: `${pt.x}%`, top: `${pt.y}%`, transform: 'translate(-50%,-50%)', width: 24, height: 24, borderRadius: '50%', background: C.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, border: '2px solid rgba(255,255,255,0.9)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>{i + 1}</div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                {r.diagnosis.photo.points.map((pt, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 6 }}>
                    <span style={{ width: 17, height: 17, borderRadius: '50%', background: C.accent, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0, transform: 'translateY(2px)' }}>{i + 1}</span>
                    <span style={{ fontSize: 13.5, lineHeight: 1.6, color: '#44403c' }}>{pt.label}</span>
                  </div>
                ))}
                <div style={{ fontSize: 10.5, color: C.faint, marginTop: 8 }}>{r.diagnosis.photo.credit}</div>
              </div>
            </div>
          </div>
        )}

        <SubLabel>{r.diagnosis.observed.label}</SubLabel>
        <Lead>{r.diagnosis.observed.lead}</Lead>
        <Body>{r.diagnosis.observed.body}</Body>
        {/* 재질 한 끗 — 비교 이미지 */}
        {r.diagnosis.compare && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
            {[[r.diagnosis.compare.bad, '✕', '#b3492e', true], [r.diagnosis.compare.good, '✓', '#4a7c59', false]].map(([it, mark, color, gray], i) => it && (
              <div key={i} style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ position: 'relative', aspectRatio: '1 / 1', background: '#f8f7f4' }}>
                  <img src={it.image} alt={it.label} loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: gray ? 'grayscale(0.4) opacity(0.85)' : 'none' }}
                    onError={(e) => { e.target.style.display = 'none'; }} />
                  <span style={{ position: 'absolute', top: 8, left: 8, width: 22, height: 22, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>{mark}</span>
                </div>
                <div style={{ padding: '9px 11px' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>{it.label}</div>
                  <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.5, marginTop: 2 }}>{it.note}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <Gap h={26} />
        <SubLabel>{r.diagnosis.tension.label}</SubLabel>
        <Lead>{r.diagnosis.tension.lead}</Lead>
        <Body>{r.diagnosis.tension.body}</Body>
        <Gap h={22} />
        <SubLabel>{r.diagnosis.reference.label}</SubLabel>
        <div style={{ background: `${C.accent}0f`, border: `1px solid ${C.accent}33`, borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 15, lineHeight: 1.8, color: '#3f3a34' }}>{r.diagnosis.reference.body}</div>
        </div>

        <Gap h={76} />

        {/* ── 02 처방 ── */}
        <SectionHead num={2} en="Prescription" ko="처방 — 세 줄" />
        <div style={{ background: C.paper, border: `1.5px solid ${C.ink}`, borderRadius: 4, padding: '26px 24px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${C.line}`, paddingBottom: 10, marginBottom: 18 }}>
            <span style={{ fontFamily: serif, fontSize: 11, letterSpacing: '0.24em' }}>PRESCRIPTION</span>
            <span style={{ fontSize: 11, color: C.sub }}>다 잊어도, 이 세 가지만</span>
          </div>
          {r.rules.map((rule, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'baseline', marginBottom: i < r.rules.length - 1 ? 16 : 0 }}>
              <span style={{ fontFamily: serif, fontSize: 17, fontWeight: 700, color: C.accent, flexShrink: 0, lineHeight: 1 }}>{i + 1}</span>
              <span style={{ fontSize: 15.5, fontWeight: 650, lineHeight: 1.55, letterSpacing: '-0.01em' }}>{rule}</span>
            </div>
          ))}
          <div style={{ marginTop: 20, paddingTop: 12, borderTop: `1px dashed ${C.line}` }}>
            {r.system.dont.map((d, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ color: '#b3492e', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>✕</span>
                <span style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6 }}><b style={{ color: '#57514a' }}>{d.rule}</b> — {d.reason}</span>
              </div>
            ))}
          </div>
        </div>

        <Gap h={76} />

        {/* ── 03 룩 보드 — 보여주기 ── */}
        <SectionHead num={3} en="Looks" ko="이렇게 입으세요" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {(r.looks || []).map((look, i) => <LookBoard key={look.id} look={look} index={i} />)}
        </div>

        <Gap h={76} />

        {/* ── 04 컬러 — 이 색으로 사면 됩니다 ── */}
        <SectionHead num={4} en="Colors" ko="이 색으로 사면 됩니다" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {r.system.colors.core.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14, padding: '12px 14px' }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: c.hex, border: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{c.name}</div>
                <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.5 }}>{c.note}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {(c.products || []).map((p, j) => (
                  <a key={j} href={p.link} target="_blank" rel="noopener noreferrer">
                    <img src={p.image} alt={p.title} loading="lazy"
                      style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: `1px solid ${C.line}`, display: 'block' }}
                      onError={(e) => { e.target.style.display = 'none'; }} />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 12.5, color: C.sub }}>
          피할 색 — {r.system.colors.banned.map((b) => b.name).join(', ')}. 시선을 부르고 님의 무게와 어긋납니다.
        </div>

        <Gap h={76} />

        {/* ── 05 옷장 액션 ── */}
        <SectionHead num={5} en="Wardrobe" ko="지금 옷장에서" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[['유지', r.action.wardrobe.keep, C.ink], ['수선', r.action.wardrobe.tailor, C.accent], ['보내줄 것', r.action.wardrobe.release, '#b3492e']].map(([label, items, color], i) => (
            <div key={i} style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: '14px 13px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color, marginBottom: 8 }}>{label}</div>
              {items.map((t, j) => <div key={j} style={{ fontSize: 12.5, lineHeight: 1.6, color: '#44403c', marginBottom: 6 }}>{t}</div>)}
            </div>
          ))}
        </div>

        {/* 수선 다이어그램 + 보내줄 것 이미지 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
          <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14, padding: '16px 14px', display: 'flex', gap: 12, alignItems: 'center' }}>
            <svg width="74" height="110" viewBox="0 0 74 110" style={{ flexShrink: 0 }}>
              <path d="M14 6 h46 v10 h-46 z" fill="none" stroke={C.ink} strokeWidth="1.6" />
              <path d="M14 16 L11 104 h21 L36 42 L38 42 L42 104 h21 L60 16 Z" fill="none" stroke={C.ink} strokeWidth="1.6" strokeLinejoin="round" />
              <line x1="4" y1="88" x2="70" y2="88" stroke={C.accent} strokeWidth="1.4" strokeDasharray="4 3" />
              <text x="37" y="82" textAnchor="middle" fontSize="10" fontWeight="700" fill={C.accent}>−3cm</text>
            </svg>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.accent, marginBottom: 4 }}>수선 한 번</div>
              <div style={{ fontSize: 12, lineHeight: 1.65, color: '#44403c' }}>슬랙스 기장을 복사뼈에서 끊기게. 만 원으로 인상이 바뀝니다.</div>
            </div>
          </div>
          <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14, padding: '16px 14px' }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#b3492e', marginBottom: 10 }}>이제 그만</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(r.action.releaseImages || []).map((it, i) => (
                <div key={i} style={{ position: 'relative', width: 64, height: 64, borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.line}` }}>
                  <img src={it.image} alt={it.label} loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.55) opacity(0.8)' }}
                    onError={(e) => { e.target.style.display = 'none'; }} />
                  <svg width="64" height="64" viewBox="0 0 64 64" style={{ position: 'absolute', top: 0, left: 0 }}>
                    <line x1="10" y1="54" x2="54" y2="10" stroke="#b3492e" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: C.sub, marginTop: 8, lineHeight: 1.5 }}>님의 얼굴이 이미 로고입니다.</div>
          </div>
        </div>

        <Gap h={76} />

        {/* ── 편지 ── */}
        <div style={{ background: '#FBFAF7', border: `1px solid ${C.line}`, borderRadius: 4, padding: '34px 30px', boxShadow: '0 2px 14px rgba(60,45,30,0.05)' }}>
          <p style={{ fontSize: 15, lineHeight: 2.0, color: '#3f3a34', margin: '0 0 24px' }}>{r.letter.body}</p>
          <div style={{ borderLeft: `2.5px solid ${C.accent}`, paddingLeft: 16, margin: '0 0 24px' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accent, fontWeight: 600, marginBottom: 6 }}>혼자 쇼핑할 때, 이것만</div>
            <div style={{ fontSize: 15, fontWeight: 650, lineHeight: 1.6 }}>{r.letter.principle}</div>
          </div>
          <p style={{ fontSize: 14, color: C.sub, margin: '0 0 26px' }}>{r.letter.next}</p>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: serif, fontSize: 14, fontStyle: 'italic', color: C.ink }}>{r.letter.signed}</div>
            <div style={{ fontSize: 11.5, color: C.faint, marginTop: 4 }}>2026. 7. 3.</div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
