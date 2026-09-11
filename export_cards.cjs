const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const htmlPath = path.resolve(__dirname, 'content/carousel_01_brand.html');
  const outDir  = path.resolve(__dirname, 'content/carousel_01_export');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const ctx  = await browser.newContext({ deviceScaleFactor: 2.5 });
  const page = await ctx.newPage();

  await page.setViewportSize({ width: 900, height: 800 });
  await page.goto(`file://${htmlPath}`);
  await page.waitForLoadState('networkidle');

  // 폰트 로딩 대기
  await page.waitForTimeout(2000);

  // 상단 레이블 숨김
  await page.addStyleTag({ content: `
    .page-header, [class*="page-header"] { display: none !important; }
  ` });

  const cards = await page.$$('.card');
  console.log(`총 ${cards.length}장 export 시작...\n`);

  for (let i = 0; i < cards.length; i++) {
    const num = String(i + 1).padStart(2, '0');
    const filename = path.join(outDir, `card_${num}.png`);
    await cards[i].screenshot({ path: filename });
    console.log(`  ✓ card_${num}.png`);
  }

  await browser.close();
  console.log(`\n완료! ${outDir} 에 ${cards.length}장 저장됨.`);
})();
