import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const asUrl = s => `data:text/javascript;base64,${Buffer.from(s).toString('base64')}`;
const { saveTranslatorReport } = await import(asUrl(await readFile(new URL('../api/_lib/saveTranslatorReport.js', import.meta.url), 'utf8')));
const stream = await import(asUrl((await readFile(new URL('../src/lib/translatorReportStream.js', import.meta.url), 'utf8')).replace("'react'", JSON.stringify(import.meta.resolve('react')))));

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
