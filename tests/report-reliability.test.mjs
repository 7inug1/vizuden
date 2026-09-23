import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const asUrl = s => `data:text/javascript;base64,${Buffer.from(s).toString('base64')}`;
const promptUrl = asUrl(await readFile(new URL('../api/_lib/translatorPrompt.js', import.meta.url), 'utf8'));
const { parseBudgetFromAnswers, itemPriceCap } = await import(promptUrl);
const searches = await import(asUrl((await readFile(new URL('../api/_lib/translatorSearches.js', import.meta.url), 'utf8')).replace('"./translatorPrompt.js"', JSON.stringify(promptUrl))));

test('all six budget choices produce their intended representative amount', () => {
  for (const [answer, expected] of [['10만원 미만',80000],['10~30만원',200000],['30~50만원',400000],['50~100만원',750000],['100~300만원',2000000],['300만원 이상',3000000]]) {
    assert.equal(parseBudgetFromAnswers([{id:'budget', selected:[answer]}]), expected, answer);
  }
  assert.equal(itemPriceCap(50000),50000);
});

test('shopping results never fall back to over-cap products', async () => {
  const previous = globalThis.fetch;
  const oldId=process.env.NAVER_CLIENT_ID, oldSecret=process.env.NAVER_CLIENT_SECRET;
  process.env.NAVER_CLIENT_ID='test'; process.env.NAVER_CLIENT_SECRET='test';
  try {
    globalThis.fetch=async()=>({ok:true,json:async()=>({items:[{title:'expensive',lprice:'150000'}]})});
    assert.deepEqual(await searches.searchNaverProducts('shirt',100000),[]);
    globalThis.fetch=async()=>({ok:true,json:async()=>({items:[{title:'valid',lprice:'100000'},{title:'expensive',lprice:'100001'},{title:'invalid',lprice:'0'}]})});
    assert.deepEqual((await searches.searchNaverProducts('shirt',100000)).map(p=>p.title),['valid']);
  } finally {
    globalThis.fetch=previous;
    if(oldId===undefined) delete process.env.NAVER_CLIENT_ID; else process.env.NAVER_CLIENT_ID=oldId;
    if(oldSecret===undefined) delete process.env.NAVER_CLIENT_SECRET; else process.env.NAVER_CLIENT_SECRET=oldSecret;
  }
});
