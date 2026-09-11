// Vercel Edge Function — PNG OG 이미지

import { ImageResponse } from '@vercel/og';
import { createElement as h } from 'react';

export const config = { runtime: 'edge' };

const types = {
  'ICMT': { ko1: '안 꾸민 척',           ko2: '제일 신경 쓰는 사람',       en: 'Tries Hardest to Look Effortless',     code: 'I · C · M · T' },
  'ICMN': { ko1: '오늘 무드',            ko2: '딱 맞게 입는 사람',          en: 'Always Dressed for the Mood',          code: 'I · C · M · N' },
  'ICET': { ko1: '옷장이',               ko2: '미술관인 사람',              en: 'Treats Their Closet Like a Museum',    code: 'I · C · E · T' },
  'ICEN': { ko1: '나중에 보면 내가',      ko2: '제일 먼저 입었던 사람',      en: 'Always First, Never Following',        code: 'I · C · E · N' },
  'IDMT': { ko1: '디테일 신경 안 써주면', ko2: '서운한 사람',               en: 'Gets Sad When Friends Miss the Details', code: 'I · D · M · T' },
  'IDMN': { ko1: '심플한데',             ko2: '어제랑 다른 사람',           en: 'Minimal but Always Different',         code: 'I · D · M · N' },
  'IDET': { ko1: '옷장이',               ko2: '타임머신인 사람',            en: "Dresses Like It's a Different Era",    code: 'I · D · E · T' },
  'IDEN': { ko1: '오늘 기분대로',         ko2: '입는 사람',                 en: 'Dresses by Mood Every Day',            code: 'I · D · E · N' },
  'RCMT': { ko1: '어디 가도',            ko2: '제일 어울리는 사람',         en: 'Always the Best Style in Any Crowd',   code: 'R · C · M · T' },
  'RCMN': { ko1: '과하지도 모자라지도',   ko2: '않게 입는 사람',            en: 'Never Too Much, Never Too Little',     code: 'R · C · M · N' },
  'RCET': { ko1: '그 자리에서',          ko2: '제일 기억에 남는 사람',      en: 'The One You Remember After the Party', code: 'R · C · E · T' },
  'RCEN': { ko1: '내가 입으면',          ko2: '다 따라 입는 사람',          en: 'The One Everyone Follows After',       code: 'R · C · E · N' },
  'RDMT': { ko1: '어디서든',             ko2: '어색하지 않은 사람',         en: 'Never Out of Place',                   code: 'R · D · M · T' },
  'RDMN': { ko1: '옆에 있으면',          ko2: '나도 편해지는 사람',         en: 'The Comfy Look That Makes Everyone Feel at Ease', code: 'R · D · M · N' },
  'RDET': { ko1: '그 옷 어디서 샀어?',   ko2: '제일 많이 듣는 사람',        en: "Always Gets Asked 'Where'd You Get That?'", code: 'R · D · E · T' },
  'RDEN': { ko1: '트렌드 소식',          ko2: '제일 빠른 그 친구',          en: 'First to Know, First to Wear',         code: 'R · D · E · N' },
};

const TRANSLATOR_SAMPLES = {
  'teo-yoo':     { name: '유태오',    title: '글로벌 노마드',              charCode: 'IDMT' },
  'bong-taegyu': { name: '봉태규',    title: '정답 밖의 사람',             charCode: 'RDMT' },
  'steven-yeun': { name: '스티븐 연', title: '어디에도 속하지 않은 사람', charCode: 'ICMT' },
};

const KOPUB_URL = 'https://vizuden.com/fonts/kopub-dotum-medium.otf';

let _font = null;

async function loadFont() {
  if (_font) return _font;
  try { _font = await fetch(KOPUB_URL).then(r => r.arrayBuffer()); }
  catch (e) { console.error('Font load failed:', e); }
  return _font;
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const typeCode = searchParams.get('type');
  const page     = searchParams.get('page');
  const t        = types[typeCode];

  const W = 1200, H = 630;

  const fontData = await loadFont();
  const fonts = fontData ? [{ name: 'KoPub', data: fontData, weight: 500, style: 'normal' }] : [];
  const f = (extra = {}) => ({ fontFamily: 'KoPub, sans-serif', fontWeight: 500, ...extra });
  const ko = f;
  const la = f;

  // 공통 레이아웃 스타일
  const wrap   = { width: '100%', height: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F2ED', padding: '0 80px', boxSizing: 'border-box', gap: 40 };
  const leftCol = (w) => ({ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: w, padding: '64px 0', height: '100%' });
  const rightCol = { flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' };
  const charImg  = (code) => h('img', { src: `https://vizuden.com/characters/${code}.png`, style: { width: '320px', height: '440px', objectFit: 'contain' } });
  const vizLabel = la({ fontSize: 22, letterSpacing: '6px', color: '#2c2926' });

  try {

    // ── 번역서 샘플 ──────────────────────────────────────────────
    if (page === 'translator-sample') {
      const persona = searchParams.get('persona') ?? '';
      const s = TRANSLATOR_SAMPLES[persona];
      const titleLen = s?.title?.length ?? 0;
      const titleSize = titleLen <= 7 ? 60 : titleLen <= 12 ? 50 : 42;

      return new ImageResponse(
        h('div', { style: wrap },
          h('div', { style: leftCol('580px') },
            h('div', { style: vizLabel }, 'VIZUDEN'),
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: 20 } },
              s && h('div', { style: ko({ fontSize: 22, color: '#9C8E84' }) }, s.name),
              h('div', { style: ko({ fontSize: titleSize, color: '#111', lineHeight: 1.2 }) },
                s ? s.title : '스타일 번역서'),
            ),
            h('div', { style: ko({ fontSize: 15, color: '#9C8E84' }) }, 'AI 스타일 번역서'),
          ),
          s ? h('div', { style: rightCol }, charImg(s.charCode)) : h('div', { style: { flex: 1 } }),
        ),
        { width: W, height: H, fonts }
      );
    }

    // ── 처방전 ───────────────────────────────────────────────────
    if (page === 'prescription') {
      return new ImageResponse(
        h('div', { style: wrap },
          h('div', { style: leftCol('580px') },
            h('div', { style: vizLabel }, 'VIZUDEN'),
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
              h('div', { style: la({ fontSize: 15, letterSpacing: '5px', color: '#9C8E84' }) }, 'AI STYLE REPORT'),
              h('div', { style: { display: 'flex', flexDirection: 'column', gap: 4 } },
                h('div', { style: ko({ fontSize: 72, color: '#111', lineHeight: 1.15 }) }, '스타일'),
                h('div', { style: ko({ fontSize: 72, color: '#111', lineHeight: 1.15 }) }, '처방전'),
              ),
            ),
            h('div', { style: ko({ fontSize: 15, color: '#9C8E84' }) }, 'AI 스타일 보고서'),
          ),
          h('div', { style: rightCol }, charImg('RDMT')),
        ),
        { width: W, height: H, fonts }
      );
    }

    // ── 메인 (기본) ──────────────────────────────────────────────
    if (!t) {
      // 우측 컬럼 680px, 패딩 후 662×570px 사용
      // 4행: ROW_H=245, OVERLAP=132 → 245+3×113=584px ≤ 570+여유
      const ROW = ['RCMT','RCET','RCEN'];
      // contain: 모든 캐릭터 동일 높이(350px), 클립 없음, 중앙 정렬
      const CHAR_H = 350;
      return new ImageResponse(
        h('div', { style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'row', backgroundColor: '#F5F2ED' } },
          h('div', { style: { width: '520px', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '68px 0 68px 72px' } },
            h('div', { style: f({ fontSize: 24, letterSpacing: '7px', color: '#2c2926' }) }, 'VIZUDEN'),
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
              h('div', { style: f({ fontSize: 44, color: '#111', lineHeight: 1.3, whiteSpace: 'nowrap' }) }, '남자들을 위한'),
              h('div', { style: f({ fontSize: 44, color: '#111', lineHeight: 1.3, whiteSpace: 'nowrap' }) }, '맞춤형 스타일링 서비스'),
              h('div', { style: f({ fontSize: 17, color: '#9C8E84', marginTop: 8 }) }, '스타일 유형 · 스타일 번역서 · 스타일 코칭'),
            ),
            h('div', { style: { height: 1 } }),
          ),
          // 우측: 상하 중앙, 좌우 패딩 → 전체 여백 확보
          h('div', { style: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 28 } },
            ...ROW.map(code =>
              h('img', {
                src: `https://vizuden.com/characters/og/${code}.png`,
                style: { flex: 1, height: CHAR_H, objectFit: 'contain', objectPosition: 'center' },
              })
            ),
          ),
        ),
        { width: W, height: H, fonts }
      );
    }

    // ── 유형 결과 ────────────────────────────────────────────────
    return new ImageResponse(
      h('div', { style: wrap },
        h('div', { style: leftCol('560px') },
          h('div', { style: vizLabel }, 'VIZUDEN'),
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
            h('div', { style: ko({ fontSize: 20, color: '#9C8E84' }) }, '나는'),
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: 2 } },
              h('div', { style: ko({ fontSize: 56, color: '#111', lineHeight: 1.2 }) }, t.ko1),
              h('div', { style: ko({ fontSize: 56, color: '#111', lineHeight: 1.2 }) }, t.ko2),
            ),
            h('div', { style: la({ fontSize: 17, color: '#a8a29e', lineHeight: 1.5 }) }, t.en),
          ),
          h('div', { style: la({ fontSize: 15, color: '#b8b0a8', letterSpacing: '4px' }) }, t.code),
        ),
        h('div', { style: rightCol }, charImg(typeCode)),
      ),
      { width: W, height: H, fonts }
    );

  } catch (err) {
    console.error('og-png error:', err);
    return new ImageResponse(
      h('div', { style: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F2ED' } },
        h('div', { style: { fontSize: 96, color: '#111' } }, 'VIZUDEN'),
      ),
      { width: W, height: H }
    );
  }
}
