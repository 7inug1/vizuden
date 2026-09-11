// 빌드 후 실행: 16개 유형별 static HTML 생성
// 각 HTML은 index.html과 동일하되 OG 메타태그만 유형에 맞게 교체
// Vercel은 static 파일을 rewrite보다 우선 서빙 → 크롤러가 유형별 OG 메타를 읽을 수 있음

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

// types.js에서 직접 읽기 (Node ESM)
const { types } = await import(path.join(root, 'src/data/types.js'));

const template = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf-8');
const BASE_URL = process.env.VIZUDEN_SITE_URL || 'https://vizuden.com';

let count = 0;

// 처방전 페이지용 static HTML 생성 (/prescription, /prescription/result)
const prescriptionTitle = 'VIZUDEN 스타일 처방전 — AI 진단 보고서';
const prescriptionDesc = '커리어·취향·라이프스타일을 분석한 나만의 스타일 AI 보고서. 지금 바로 받아보세요.';
const prescriptionOgImage = `${BASE_URL}/api/og-png?page=prescription`;

for (const slug of ['prescription', 'prescription/result']) {
  const html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${prescriptionTitle}</title>`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/,  `$1${BASE_URL}/${slug}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/,       `$1${prescriptionTitle}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/,  `$1${prescriptionDesc}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/,        `$1${prescriptionOgImage}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/,       `$1${prescriptionTitle}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/,  `$1${prescriptionDesc}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/,        `$1${prescriptionOgImage}$2`);

  const dir = path.join(root, 'dist', slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8');
  console.log(`  ✓ /${slug}`);
  count++;
}

// 번역서 샘플 페이지
const translatorSamples = [
  { id: 'teo-yoo',     name: '유태오',   title: '글로벌 노마드' },
  { id: 'bong-taegyu', name: '봉태규',   title: '정답 밖의 사람' },
  { id: 'steven-yeun', name: '스티븐 연', title: '어디에도 속하지 않은 사람' },
  { id: 'do-yoon',     name: '김도윤',   title: '조용한 무게감' },
];

for (const s of translatorSamples) {
  const pageTitle = `${s.name}의 스타일 번역서 — ${s.title} | VIZUDEN`;
  const pageDesc  = `${s.name}의 정체성을 스타일 언어로 번역한 보고서. VIZUDEN 스타일 번역서.`;
  const ogImage   = `${BASE_URL}/api/og-png?page=translator-sample&persona=${s.id}`;
  const ogUrl     = `${BASE_URL}/translator/sample/${s.id}`;

  const html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${pageTitle}</title>`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/,          `$1${ogUrl}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/,        `$1${pageTitle}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/,  `$1${pageDesc}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/,        `$1${ogImage}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/,       `$1${pageTitle}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/,  `$1${pageDesc}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/,        `$1${ogImage}$2`);

  const dir = path.join(root, 'dist/translator/sample', s.id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8');
  console.log(`  ✓ /translator/sample/${s.id}`);
  count++;
}

Object.values(types).forEach((t) => {
  const { code, nameKo, nameEn, description, keywords } = t;
  const title = `나는 ${nameKo} — VIZUDEN 스타일 유형`;
  const desc = `${description} (${keywords.join(', ')})`.slice(0, 155);
  const ogImage = `${BASE_URL}/api/og-png?type=${code}`;
  const ogUrl = `${BASE_URL}/type/result/${code}`;

  const html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/,          `$1${ogUrl}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/,        `$1${title}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/,  `$1${desc}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/,        `$1${ogImage}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/,       `$1${title}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/,  `$1${desc}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/,        `$1${ogImage}$2`);

  const dir = path.join(root, 'dist/type/result', code);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8');
  count++;
  console.log(`  ✓ /type/result/${code}`);
});

console.log(`\n${count}개 유형 HTML 생성 완료.`);
