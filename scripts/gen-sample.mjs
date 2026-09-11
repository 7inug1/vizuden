// 인물 샘플 보고서 생성 — 인물 조사(로컬 인터뷰/웹검색)를 근거로
// "그 인물이 설문을 채웠다면" + 실제 정체성 조사를 주입해 보고서 JSON 생성.
// 사용: node scripts/gen-sample.mjs <personaInputFile.json>
import fs from 'fs';
import path from 'path';
import os from 'os';
import { pathToFileURL } from 'url';
import Anthropic from '@anthropic-ai/sdk';

// api/_lib은 api/package.json 때문에 CJS로 취급됨 → 내용 그대로 temp .mjs로 복사해 ESM import
const tmp = path.join(os.tmpdir(), `vzd-prompt-${Date.now()}.mjs`);
fs.writeFileSync(tmp, fs.readFileSync(path.resolve('api/_lib/translatorPrompt.js'), 'utf8'));
const { SYSTEM_PROMPT, buildAnswerText } = await import(pathToFileURL(tmp).href);
fs.unlinkSync(tmp);

// .env.local 로드
const env = Object.fromEntries(
  fs.readFileSync(path.resolve('.env.local'), 'utf8')
    .split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const inputPath = process.argv[2];
if (!inputPath) { console.error('usage: node scripts/gen-sample.mjs <input.json>'); process.exit(1); }
const persona = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
// persona: { id, name, research: "조사 텍스트", answers: [{id,question,answer?,selected?}] }

function parseJson(text) {
  const s = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try { return JSON.parse(s); } catch {
    const a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a !== -1 && b > a) return JSON.parse(s.slice(a, b + 1));
    throw new Error('invalid JSON');
  }
}

const now = new Date();
const month = now.getMonth() + 1;
const seasonLabel = month >= 3 && month <= 5 ? '봄' : month >= 6 && month <= 8 ? '여름' : month >= 9 && month <= 11 ? '가을' : '겨울';

const researchNote = `\n\n[실존 인물 보고서 — 매우 중요]\n이 보고서의 대상은 실존 인물 "${persona.name}"이다. 아래는 그 사람에 대한 실제 조사(인터뷰·기사)다. 일반론 절대 금지 — 이 사람만의 구체적 맥락(실제 삶·정체성·즐겨 입는 브랜드·태도)에 근거해서만 쓸 것.\n\n${persona.research}\n\n[활용]\n- identity/mirror/direction/closing 전부 위 조사에서 나온 이 사람 고유의 정체성으로 채울 것.\n- brands에는 이 사람이 실제 언급한 브랜드를 우선 반영하되, 그 브랜드를 왜 좋아하는지(조사에 나온 이유)와 연결.\n- "다른 배우 보고서에 그대로 넣어도 말이 되면 실패" — 오직 ${persona.name}에게서만 나올 수 있는 문장을 쓸 것.`;

const seasonNote = `\n\n[현재 계절: 한국 기준 ${seasonLabel}]`;
const userMessage = `[설문 응답]\n\n${buildAnswerText(persona.answers)}${researchNote}${seasonNote}`;

console.error(`▶ 생성 시작: ${persona.name} (${persona.id})`);
const msg = await anthropic.messages.create({
  model: 'claude-opus-4-8',
  max_tokens: 9000,
  system: SYSTEM_PROMPT,
  messages: [{ role: 'user', content: userMessage }],
});

let raw = msg.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
// <analysis> 블록 제거
raw = raw.replace(/<analysis>[\s\S]*?<\/analysis>/i, '').trim();
const report = parseJson(raw);

const outPath = path.resolve(`src/data/samples/${persona.id}.json`);
fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
console.error(`✓ 저장: ${outPath}`);
console.error(`  subtitle: ${report.subtitle}`);
console.error(`  moods: ${(report.brands?.moods || []).map((m) => m.label).join(' / ')}`);
