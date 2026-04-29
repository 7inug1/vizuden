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

Object.values(types).forEach((t) => {
  const { code, nameKo, nameEn, description, keywords } = t;
  const title = `나만의 비주얼 정체성 진단 — 내 타입은 ${nameKo} (${nameEn})`;
  const desc = `내 타입은 ${description} (${keywords.join(', ')})`.slice(0, 155);
  const ogImage = `${BASE_URL}/api/og-png?type=${code}`;
  const ogUrl = `${BASE_URL}/type/result/${code}`;

  const html = template
    // <title>
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    // og:title
    .replace(
      /(<meta property="og:title" content=")[^"]*(")/,
      `$1${title}$2`
    )
    // og:description
    .replace(
      /(<meta property="og:description" content=")[^"]*(")/,
      `$1${desc}$2`
    )
    // og:image
    .replace(
      /(<meta property="og:image" content=")[^"]*(")/,
      `$1${ogImage}$2`
    )
    // twitter:title
    .replace(
      /(<meta name="twitter:title" content=")[^"]*(")/,
      `$1${title}$2`
    )
    // twitter:description
    .replace(
      /(<meta name="twitter:description" content=")[^"]*(")/,
      `$1${desc}$2`
    )
    // twitter:image
    .replace(
      /(<meta name="twitter:image" content=")[^"]*(")/,
      `$1${ogImage}$2`
    );

  const dir = path.join(root, 'dist/type/result', code);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8');
  count++;
  console.log(`  ✓ /type/result/${code}`);
});

console.log(`\n${count}개 유형 HTML 생성 완료.`);
