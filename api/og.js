// Vercel Node.js Serverless Function — SVG OG 이미지 반환

const types = {
  'ICMT': { nameEn: 'Tries Hardest to Look Effortless',              code: 'I · C · M · T' },
  'ICMN': { nameEn: 'Always Dressed for the Mood',                   code: 'I · C · M · N' },
  'ICET': { nameEn: 'Treats Their Closet Like a Museum',             code: 'I · C · E · T' },
  'ICEN': { nameEn: 'Always First, Never Following',                 code: 'I · C · E · N' },
  'IDMT': { nameEn: 'Gets Sad When Friends Miss the Details',        code: 'I · D · M · T' },
  'IDMN': { nameEn: 'Minimal but Always Different the Next Day',     code: 'I · D · M · N' },
  'IDET': { nameEn: "Dresses Like It's a Different Era",             code: 'I · D · E · T' },
  'IDEN': { nameEn: 'Dresses by Mood Every Day',                     code: 'I · D · E · N' },
  'RCMT': { nameEn: 'Always the Best Style in Any Crowd',            code: 'R · C · M · T' },
  'RCMN': { nameEn: 'Never Too Much, Never Too Little',              code: 'R · C · M · N' },
  'RCET': { nameEn: 'The One You Remember After the Party',          code: 'R · C · E · T' },
  'RCEN': { nameEn: 'The One Everyone Follows After',                code: 'R · C · E · N' },
  'RDMT': { nameEn: 'Never Out of Place',                            code: 'R · D · M · T' },
  'RDMN': { nameEn: 'The Comfy Look That Makes Everyone Feel at Ease', code: 'R · D · M · N' },
  'RDET': { nameEn: "Always Gets Asked 'Where'd You Get That?'",     code: 'R · D · E · T' },
  'RDEN': { nameEn: 'First to Know, First to Wear',                  code: 'R · D · E · N' },
};

module.exports = function handler(req, res) {
  const url = new URL(req.url, 'https://vizuden.com');
  const typeCode = url.searchParams.get('type');
  const t = types[typeCode];

  let svg;

  if (!t) {
    // 기본 이미지 — 유형 없을 때
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#ffffff"/>
  <text
    x="600" y="340"
    font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
    font-size="96" font-weight="700"
    text-anchor="middle" letter-spacing="-3"
    fill="#111111">VIZUDEN</text>
  <text
    x="600" y="410"
    font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
    font-size="20" font-weight="300"
    text-anchor="middle" letter-spacing="3"
    fill="#a8a29e">Visual Identity Quiz</text>
</svg>`;
  } else {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#F5F2ED"/>
  <text
    x="88" y="124"
    font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
    font-size="11" font-weight="400"
    letter-spacing="5" fill="#b8b0a8">VIZUDEN</text>
  <text
    x="88" y="290"
    font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
    font-size="15" font-weight="300"
    letter-spacing="4" fill="#b8b0a8">I AM</text>
  <text
    x="88" y="400"
    font-family="Georgia, Times New Roman, serif"
    font-size="76" font-weight="300"
    letter-spacing="-1" fill="#111111">${t.nameEn}</text>
  <text
    x="88" y="490"
    font-family="Courier New, Courier, monospace"
    font-size="15" letter-spacing="5"
    fill="#b8b0a8">${t.code}</text>
</svg>`;
  }

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
  res.end(svg);
};
