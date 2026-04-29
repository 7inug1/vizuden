// Vercel Edge Function — PNG OG 이미지
// 한국어 폰트: Google Fonts에서 필요한 글자만 동적 로드

import { ImageResponse } from '@vercel/og';
import { createElement as h } from 'react';

export const config = { runtime: 'edge' };

const types = {
  'ICMT': { ko1: '안 꾸민 척',           ko2: '제일 신경 쓰는 사람',       en1: 'Tries Hardest',            en2: 'to Look Effortless',          code: 'I · C · M · T' },
  'ICMN': { ko1: '오늘 무드',            ko2: '딱 맞게 입는 사람',          en1: 'Always Dressed',           en2: 'for the Mood',                code: 'I · C · M · N' },
  'ICET': { ko1: '옷장이',               ko2: '미술관인 사람',              en1: 'Treats Their Closet',      en2: 'Like a Museum',               code: 'I · C · E · T' },
  'ICEN': { ko1: '나중에 보면 내가',      ko2: '제일 먼저 입었던 사람',      en1: 'Always First,',            en2: 'Never Following',             code: 'I · C · E · N' },
  'IDMT': { ko1: '디테일 신경 안 써주면', ko2: '서운한 사람',               en1: 'Gets Sad When Friends',    en2: 'Miss the Details',            code: 'I · D · M · T' },
  'IDMN': { ko1: '심플한데',             ko2: '어제랑 다른 사람',           en1: 'Minimal but Always',       en2: 'Different the Next Day',      code: 'I · D · M · N' },
  'IDET': { ko1: '옷장이',               ko2: '타임머신인 사람',            en1: 'Dresses Like',             en2: "It's a Different Era",        code: 'I · D · E · T' },
  'IDEN': { ko1: '오늘 기분대로',         ko2: '입는 사람',                 en1: 'Dresses by Mood',          en2: 'Every Day',                   code: 'I · D · E · N' },
  'RCMT': { ko1: '어디 가도',            ko2: '제일 어울리는 사람',         en1: 'Always the Best Style',    en2: 'in Any Crowd',                code: 'R · C · M · T' },
  'RCMN': { ko1: '과하지도 모자라지도',   ko2: '않게 입는 사람',            en1: 'Never Too Much,',          en2: 'Never Too Little',            code: 'R · C · M · N' },
  'RCET': { ko1: '그 자리에서',          ko2: '제일 기억에 남는 사람',      en1: 'The One You Remember',     en2: 'After the Party',             code: 'R · C · E · T' },
  'RCEN': { ko1: '내가 입으면',          ko2: '다 따라 입는 사람',          en1: 'The One Everyone',         en2: 'Follows After',               code: 'R · C · E · N' },
  'RDMT': { ko1: '어디서든',             ko2: '어색하지 않은 사람',         en1: 'Never Out',                en2: 'of Place',                    code: 'R · D · M · T' },
  'RDMN': { ko1: '옆에 있으면',          ko2: '나도 편해지는 사람',         en1: 'The Comfy Look That',      en2: 'Makes Everyone Feel at Ease', code: 'R · D · M · N' },
  'RDET': { ko1: '그 옷 어디서 샀어?',   ko2: '제일 많이 듣는 사람',        en1: 'Always Gets Asked',        en2: "'Where'd You Get That?'",     code: 'R · D · E · T' },
  'RDEN': { ko1: '트렌드 소식',          ko2: '제일 빠른 그 친구',          en1: 'First to Know,',           en2: 'First to Wear',               code: 'R · D · E · N' },
};

let _koFont = null;

async function loadKoFont() {
  if (_koFont) return _koFont;
  try {
    _koFont = await fetch('https://vizuden.com/fonts/noto-kr-subset.ttf')
      .then(r => r.arrayBuffer());
  } catch (e) {
    console.error('KO font load failed:', e);
  }
  return _koFont;
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const typeCode = searchParams.get('type');
  const t = types[typeCode];

  const W = 1200, H = 630;

  const koFont = await loadKoFont();
  const fonts = koFont
    ? [{ name: 'NotoKR', data: koFont, weight: 300, style: 'normal' }]
    : [];
  const koFamily = fonts.length ? 'NotoKR, sans-serif' : 'sans-serif';

  try {
    if (!t) {
      return new ImageResponse(
        h('div', {
          style: {
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#F5F2ED', gap: '12px',
          },
        },
          h('div', { style: { fontSize: 120, fontWeight: 700, color: '#111', letterSpacing: '-4px', lineHeight: 1 } }, 'VIZUDEN'),
          h('div', { style: { fontSize: 28, color: '#a8a29e', letterSpacing: '5px', fontFamily: koFamily } }, 'Visual Identity Quiz'),
        ),
        { width: W, height: H, fonts }
      );
    }

    const charUrl = `https://vizuden.com/characters/${typeCode}.png`;

    return new ImageResponse(
      h('div', {
        style: {
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'row',
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#F5F2ED',
          padding: '0 80px',
          boxSizing: 'border-box',
          gap: '40px',
        },
      },
        // 왼쪽 텍스트 영역
        h('div', {
          style: {
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            width: '560px', padding: '60px 0',
            height: '100%',
          },
        },
          h('div', { style: { fontSize: 18, letterSpacing: '8px', color: '#a8a29e' } }, 'VIZUDEN'),
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px' } },
            h('div', { style: { fontSize: 22, letterSpacing: '4px', color: '#a8a29e', fontFamily: koFamily } }, '나는'),
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: '2px' } },
              h('div', { style: { fontSize: 54, fontWeight: 300, color: '#111111', lineHeight: 1.2, fontFamily: koFamily } }, t.ko1),
              h('div', { style: { fontSize: 54, fontWeight: 300, color: '#111111', lineHeight: 1.2, fontFamily: koFamily } }, t.ko2),
            ),
            h('div', { style: { display: 'flex', flexDirection: 'column' } },
              h('div', { style: { fontSize: 19, fontWeight: 300, color: '#a8a29e', lineHeight: 1.5 } }, t.en1),
              h('div', { style: { fontSize: 19, fontWeight: 300, color: '#a8a29e', lineHeight: 1.5 } }, t.en2),
            ),
          ),
          h('div', { style: { fontSize: 18, color: '#c4bfba', letterSpacing: '2px' } }, 'vizuden.com'),
        ),
        // 오른쪽 캐릭터 영역
        h('div', {
          style: {
            width: '360px', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          },
        },
          h('img', {
            src: charUrl,
            style: { width: '340px', height: '460px', objectFit: 'contain', objectPosition: 'center' },
          }),
        ),
      ),
      { width: W, height: H, fonts }
    );
  } catch (err) {
    console.error('og-png error:', err);
    // 에러 시 최소 fallback 이미지 반환
    return new ImageResponse(
      h('div', {
        style: {
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#F5F2ED',
        },
      },
        h('div', { style: { fontSize: 96, fontWeight: 700, color: '#111', letterSpacing: '-3px' } }, 'VIZUDEN'),
      ),
      { width: W, height: H }
    );
  }
}
