import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const asUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;

test('empty or invalid production limit uses the three-intake default', async () => {
  const original = process.env.TRANSLATOR_DAILY_LIMIT;
  try {
    const source = await readFile(new URL('../api/_lib/dailyLimit.js', import.meta.url), 'utf8');
    for (const [configured, expected] of [['', 3], ['invalid', 3], ['-1', 3], ['4', 4], ['0', 0]]) {
      process.env.TRANSLATOR_DAILY_LIMIT = configured;
      const { DAILY_LIMIT } = await import(asUrl(`${source}\n// test value: ${configured}`));
      assert.equal(DAILY_LIMIT, expected, `configured value ${JSON.stringify(configured)}`);
    }
  } finally {
    if (original === undefined) delete process.env.TRANSLATOR_DAILY_LIMIT;
    else process.env.TRANSLATOR_DAILY_LIMIT = original;
  }
});

test('a public devMode flag cannot bypass the free intake limit', async () => {
  let used = 3;
  const inserts = [];
  const deps = {
    applyConsultingOwnerFilter: () => null,
    getAuthenticatedUser: async () => null,
    getGuestSessionId: (req) => req.headers['x-guest-session-id'] || null,
    supabase: {
      from: () => ({
        insert: (row) => {
          inserts.push(row);
          return { select: () => ({ single: async () => ({ data: { id: 'test-intake' }, error: null }) }) };
        },
      }),
    },
    DAILY_LIMIT: 3,
    codeIsValid: async () => false,
    ipHash: () => 'test-hash',
    usedToday: async () => used,
  };
  globalThis.__dailyLimitTestDeps = deps;
  try {
    const source = await readFile(new URL('../api/translator-intake.js', import.meta.url), 'utf8');
    const rewritten = source
      .replace(/import \{[\s\S]*?\} from "\.\/_lib\/consultingAccess\.js";/, 'const { applyConsultingOwnerFilter, getAuthenticatedUser, getGuestSessionId, supabase } = globalThis.__dailyLimitTestDeps;')
      .replace(/import \{ DAILY_LIMIT, codeIsValid, ipHash, usedToday \} from "\.\/_lib\/dailyLimit\.js";/, 'const { DAILY_LIMIT, codeIsValid, ipHash, usedToday } = globalThis.__dailyLimitTestDeps;');
    const { default: handler } = await import(asUrl(rewritten));
    const request = { method: 'POST', headers: { 'x-guest-session-id': 'test-guest' }, body: { answers: [{ id: 'test', answer: 'yes' }], devMode: true } };
    const respond = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(payload) { this.body = payload; return this; } });

    const denied = respond();
    await handler(request, denied);
    assert.equal(denied.statusCode, 429);
    assert.equal(denied.body.error, 'daily_limit');
    assert.equal(inserts.length, 0);

    used = 2;
    const allowed = respond();
    await handler(request, allowed);
    assert.equal(allowed.statusCode, 200);
    assert.equal(inserts.length, 1);
  } finally {
    delete globalThis.__dailyLimitTestDeps;
  }
});
