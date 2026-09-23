import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const asUrl = s => `data:text/javascript;base64,${Buffer.from(s).toString('base64')}`;
const promptUrl = asUrl(await readFile(new URL('../api/_lib/translatorPrompt.js', import.meta.url), 'utf8'));
const { parseBudgetFromAnswers, itemPriceCap } = await import(promptUrl);
const searches = await import(asUrl((await readFile(new URL('../api/_lib/translatorSearches.js', import.meta.url), 'utf8')).replace('"./translatorPrompt.js"', JSON.stringify(promptUrl))));
const { saveTranslatorReport } = await import(asUrl(await readFile(new URL('../api/_lib/saveTranslatorReport.js', import.meta.url), 'utf8')));
const stream = await import(asUrl((await readFile(new URL('../src/lib/translatorReportStream.js', import.meta.url), 'utf8')).replace("'react'", JSON.stringify(import.meta.resolve('react')))));

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

test('saving requires an actual updated row; errors and zero rows reject', async () => {
  for (const response of [{data:{id:'one'},error:null},{data:null,error:{message:'offline'}},{data:null,error:null}]) {
    const chain={update:()=>chain,eq:()=>chain,select:()=>chain,single:async()=>response};
    const db={from:()=>chain};
    if(response.data) await saveTranslatorReport(db,'one',{closing:{}},'2026-09-23');
    else await assert.rejects(saveTranslatorReport(db,'one',{},'2026-09-23'),/저장/);
  }
});

async function runStream(events) {
  const previous=globalThis.fetch;
  globalThis.fetch=async()=>new Response(events.map(e=>typeof e==='string'?e:`data: ${JSON.stringify(e)}\n\n`).join(''),{headers:{'Content-Type':'text/event-stream'}});
  try {
    await stream.startStream('test',null,'test');
    await new Promise(resolve=>setTimeout(resolve,120));
    return stream.getConsultingReportStream();
  } finally {globalThis.fetch=previous;}
}

test('server storage error remains an error even after closing text arrives',async()=>{
  const result=await runStream([{type:'delta',text:'{"closing":{"body":"complete-looking text"}}'},{type:'error',error:'save failed'}]);
  assert.equal(result.status,'error');
});
test('EOF without persistence acknowledgement is not completion',async()=>{
  const result=await runStream([{type:'delta',text:'{"closing":{"body":"complete-looking text"}}'}]);
  assert.equal(result.status,'error');
});
test('saved final report completes normally',async()=>{
  const report={closing:{body:'saved'}};
  const result=await runStream([{type:'done',report,reportNo:1}]);
  assert.equal(result.status,'done'); assert.deepEqual(result.report,report);
});
test('keepalive comments are ignored until the saved report arrives',async()=>{
  const report={closing:{body:'saved'}};
  const result=await runStream([': keepalive\n\n',': keepalive\n\n',{type:'done',report,reportNo:1}]);
  assert.equal(result.status,'done'); assert.deepEqual(result.report,report);
});
test('failing to close the connection after the saved report is still completion',async()=>{
  const previous=globalThis.fetch;
  const report={closing:{body:'saved'}};
  const chunk=new TextEncoder().encode(`data: ${JSON.stringify({type:'done',report,reportNo:1})}\n\n`);
  globalThis.fetch=async()=>({ok:true,body:{getReader:()=>{let sent=false;return{read:async()=>sent?{done:true}:(sent=true,{done:false,value:chunk}),cancel:async()=>{throw new Error('already closed');}};}}});
  try {
    await stream.startStream('test',null,'test');
    await new Promise(resolve=>setTimeout(resolve,120));
    const result=stream.getConsultingReportStream();
    assert.equal(result.status,'done'); assert.deepEqual(result.report,report);
  } finally {globalThis.fetch=previous;}
});
