const { chromium } = require('/Users/platon/.npm-global/lib/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'https://farline-platforma-nabidky.vercel.app';
const OUT = '/tmp/farline-audit';
fs.mkdirSync(OUT, { recursive: true });

const issues = [];
const ok  = (msg) => console.log(`  ✓ ${msg}`);
const err = (page, msg) => { console.log(`  ✗ [${page}] ${msg}`); issues.push({ page, msg, sev: 'error' }); };
const wrn = (page, msg) => { console.log(`  △ [${page}] ${msg}`); issues.push({ page, msg, sev: 'warn' }); };

async function checkOverflow(pg, label, vp) {
  const bad = await pg.evaluate(() => {
    const w = document.documentElement.clientWidth;
    return [...document.querySelectorAll('*')].filter(el => {
      const r = el.getBoundingClientRect();
      return r.right > w + 5 && r.height > 2 && r.width > 2 && r.left > -200;
    }).slice(0, 3).map(el =>
      el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ').filter(c=>c&&!c.includes('['))[0] : '')
    );
  });
  if (bad.length) err(label, `Overflow @${vp}: ${bad.join(', ')}`);
  return bad.length;
}

async function shot(pg, name, full = true) {
  await pg.screenshot({ path: path.join(OUT, name + '.png'), fullPage: full });
}

async function run() {
  const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });

  // ─── LOGIN ONCE ───
  console.log('\n[1] Authenticating on Vercel...');
  const authCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const authPg = await authCtx.newPage();
  await authPg.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 30000 });
  await authPg.fill('input[type="email"]', 'admin@farline.cz');
  await authPg.fill('input[type="password"]', 'admin123');
  await authPg.click('button[type="submit"]');
  await authPg.waitForTimeout(6000);
  await authPg.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
  if (authPg.url().includes('/login')) { err('login', 'Login failed'); await browser.close(); return; }
  ok('Authenticated: ' + authPg.url().replace(BASE,''));

  // Get data
  const offerData = await authPg.evaluate(async () => {
    try { return await (await fetch('/api/offers')).json(); } catch(e) { return {}; }
  });
  const offers = offerData.offers || [];
  const firstOffer = offers[0];
  const sharedOffer = offers.find(o => o.shareEnabled && o.shareId);
  console.log(`  Offers: ${offers.length}, shared: ${sharedOffer ? sharedOffer.shareId.slice(0,8) : 'none'}`);

  await authCtx.storageState({ path: path.join(OUT, 'auth.json') });
  await authCtx.close();

  // ─── VIEWPORT MATRIX ───
  const VPS = [
    { name: 'mobile-375',  width: 375,  height: 812 },
    { name: 'tablet-768',  width: 768,  height: 1024 },
    { name: 'desktop-1440',width: 1440, height: 900 },
  ];
  const PAGES = [
    { p: '/',         n: 'dashboard' },
    { p: '/nabidky',  n: 'nabidky' },
    { p: '/katalog',  n: 'katalog' },
  ];
  if (firstOffer) PAGES.push({ p: `/nabidky/${firstOffer.id}`, n: 'offer-editor' });

  console.log('\n[2] Viewport matrix (3 pages × 3 sizes)...');
  for (const def of PAGES) {
    process.stdout.write(`  ${def.n.padEnd(14)}: `);
    for (const vp of VPS) {
      const ctx = await browser.newContext({ viewport: vp, storageState: path.join(OUT,'auth.json') });
      const pg  = await ctx.newPage();
      const cerrs = []; pg.on('console', m => { if (m.type()==='error') cerrs.push(m.text()); });
      try {
        await pg.goto(BASE + def.p, { waitUntil: 'networkidle', timeout: 30000 });
        await pg.waitForTimeout(800);
        await shot(pg, `${def.n}-${vp.name}`);
        const ov = await checkOverflow(pg, def.n, vp.name);
        const fe = cerrs.filter(e => !e.includes('favicon') && !e.includes('ERR_ABORTED') && !e.includes('ResizeObserver'));
        if (fe.length) err(def.n, `JS error @${vp.name}: ${fe[0].slice(0,70)}`);
        process.stdout.write(ov > 0 ? '✗' : '✓');
      } catch(e) { err(def.n, `load @${vp.name}: ${e.message.slice(0,50)}`); process.stdout.write('E'); }
      await ctx.close();
    }
    console.log('');
  }

  // ─── DEEP CHECKS ───
  console.log('\n[3] Deep feature checks...');

  // Check API errors on dashboard
  {
    const ctx = await browser.newContext({ storageState: path.join(OUT,'auth.json'), viewport: { width: 1440, height: 900 } });
    const pg = await ctx.newPage();
    const apiErrs = [];
    pg.on('response', r => { if (r.status()>=500 && r.url().includes(BASE)) apiErrs.push(`${r.status()} ${r.url().replace(BASE,'')}`); });
    await pg.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 20000 });
    await pg.waitForTimeout(1000);
    if (apiErrs.length) err('dashboard', `5xx API calls: ${apiErrs.join(', ')}`);
    else ok('Dashboard: no 5xx API errors');
    await ctx.close();
  }

  // Mobile sidebar drawer
  {
    const ctx = await browser.newContext({ storageState: path.join(OUT,'auth.json'), viewport: { width: 375, height: 812 } });
    const pg = await ctx.newPage();
    await pg.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 20000 });
    await pg.waitForTimeout(500);
    const burger = pg.locator('[aria-label="Otevřít menu"]').first();
    if (await burger.isVisible()) {
      await burger.click(); await pg.waitForTimeout(400);
      await shot(pg, 'sidebar-drawer-open', false);
      const closeBtn = pg.locator('[aria-label="Zavřít menu"]').first();
      if (await closeBtn.isVisible()) ok('Sidebar drawer: X button visible');
      else wrn('sidebar', 'X close button not visible in open drawer');
      const backdrop = await pg.$('.backdrop-blur-sm');
      if (backdrop) ok('Sidebar drawer: backdrop overlay present');
      // Close and verify sidebar hidden
      await closeBtn.click().catch(()=>{});
      await pg.waitForTimeout(400);
      await shot(pg, 'sidebar-drawer-closed', false);
    } else err('sidebar', 'Hamburger button not found on mobile');
    await ctx.close();
  }

  // Toggles (DPH / hideCode)
  if (firstOffer) {
    const ctx = await browser.newContext({ storageState: path.join(OUT,'auth.json'), viewport: { width: 1440, height: 900 } });
    const pg = await ctx.newPage();
    await pg.goto(BASE + `/nabidky/${firstOffer.id}`, { waitUntil: 'networkidle', timeout: 25000 });
    await pg.waitForTimeout(1000);
    const toggleBtns = await pg.$$('button:has(span.rounded-full)');
    if (toggleBtns.length === 0) { err('toggles', 'No toggle buttons found'); }
    else {
      for (let i = 0; i < Math.min(2, toggleBtns.length); i++) {
        const pill = await toggleBtns[i].$('span.rounded-full');
        if (!pill) continue;
        const bgBefore = await pill.evaluate(el => el.style.backgroundColor);
        await toggleBtns[i].click();
        await pg.waitForTimeout(300);
        const bgAfter = await pill.evaluate(el => el.style.backgroundColor);
        if (bgBefore !== bgAfter) ok(`Toggle ${i+1}: visual state changes (${bgBefore}→${bgAfter})`);
        else err('toggles', `Toggle ${i+1}: background doesn't change on click`);
        await toggleBtns[i].click(); await pg.waitForTimeout(200); // reset
      }
    }
    await ctx.close();
  }

  // SummaryBlock on mobile
  if (firstOffer) {
    const ctx = await browser.newContext({ storageState: path.join(OUT,'auth.json'), viewport: { width: 375, height: 812 } });
    const pg = await ctx.newPage();
    await pg.goto(BASE + `/nabidky/${firstOffer.id}`, { waitUntil: 'networkidle', timeout: 25000 });
    await pg.waitForTimeout(800);
    // Find SummaryBlock by looking for grid with tabular-nums
    const docW = 375;
    const overflowingEls = await pg.evaluate((w) => {
      return [...document.querySelectorAll('.tabular-nums')].filter(el => {
        const r = el.getBoundingClientRect();
        return r.right > w + 5;
      }).length;
    }, docW);
    if (overflowingEls > 0) err('summary-block', `${overflowingEls} tabular-nums elements overflow on mobile`);
    else ok('SummaryBlock: no overflow on mobile 375px');
    await shot(pg, 'offer-editor-mobile-375');
    await ctx.close();
  }

  // Public offer page
  if (sharedOffer) {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const pg = await ctx.newPage();
    await pg.goto(BASE + `/nabidka/${sharedOffer.shareId}`, { waitUntil: 'networkidle', timeout: 25000 });
    await pg.waitForTimeout(800);
    await shot(pg, 'public-offer-mobile-375');
    const ov = await checkOverflow(pg, 'public-offer', 'mobile-375');
    if (ov === 0) ok('Public offer: no overflow on mobile');
    const pdfBtn = await pg.$('button:has-text("PDF")');
    if (pdfBtn) ok('Public offer: PDF button found');
    else wrn('public-offer', 'PDF button not found');
    const commentForm = await pg.$('form');
    if (commentForm) ok('Public offer: comment form found');
    else err('public-offer', 'Comment form missing');
    await ctx.close();

    // Desktop too
    const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const pg2 = await ctx2.newPage();
    await pg2.goto(BASE + `/nabidka/${sharedOffer.shareId}`, { waitUntil: 'networkidle', timeout: 25000 });
    await pg2.waitForTimeout(800);
    await shot(pg2, 'public-offer-desktop-1440');
    await checkOverflow(pg2, 'public-offer-desktop', 'desktop-1440');
    await ctx2.close();
  } else {
    wrn('public-offer', 'No shared offer to test');
  }

  // Product form modal (bottom sheet on mobile)
  {
    const ctx = await browser.newContext({ storageState: path.join(OUT,'auth.json'), viewport: { width: 375, height: 812 } });
    const pg = await ctx.newPage();
    await pg.goto(BASE + '/katalog', { waitUntil: 'networkidle', timeout: 20000 });
    await pg.waitForTimeout(600);
    const btn = pg.locator('button', { hasText: 'Přidat produkt' }).first();
    if (await btn.isVisible()) {
      await btn.click(); await pg.waitForTimeout(700);
      await shot(pg, 'product-form-mobile', false);
      await checkOverflow(pg, 'product-form-modal', 'mobile-375');
      const modal = await pg.$('.rounded-t-2xl');
      if (modal) {
        const box = await modal.boundingBox();
        ok(`Product form modal: bottom sheet at Y=${Math.round(box?.y)}px`);
      } else wrn('product-form', 'Bottom-sheet class not found on modal');
    }
    await ctx.close();
  }

  // Offer editor - mobile full flow
  if (firstOffer) {
    const ctx = await browser.newContext({ storageState: path.join(OUT,'auth.json'), viewport: { width: 375, height: 812 } });
    const pg = await ctx.newPage();
    await pg.goto(BASE + `/nabidky/${firstOffer.id}`, { waitUntil: 'networkidle', timeout: 25000 });
    await pg.waitForTimeout(1000);
    await checkOverflow(pg, 'offer-editor-mobile', 'mobile-375');
    // Check aside panel visible
    const asideH = await pg.$eval('aside', el => el.offsetHeight).catch(()=>0);
    if (asideH > 80) ok(`Aside panel visible on mobile: ${asideH}px`);
    else wrn('offer-editor', `Aside panel small on mobile: ${asideH}px`);
    // Check name input
    const nameInput = await pg.$('input.text-2xl, input.sm\\:text-4xl, input[class*="text-2"]');
    if (nameInput) ok('Offer name input: responsive text size');
    await shot(pg, 'offer-editor-mobile-full', false);
    await ctx.close();
  }

  await browser.close();

  // ─── REPORT ───
  console.log('\n' + '═'.repeat(55));
  console.log('  FARLINE AUDIT REPORT');
  console.log('═'.repeat(55));
  const errs = issues.filter(i => i.sev === 'error');
  const wrns = issues.filter(i => i.sev === 'warn');
  console.log(`  Errors: ${errs.length}   Warnings: ${wrns.length}`);
  if (errs.length) {
    console.log('\n  ERRORS (must fix):');
    errs.forEach(i => console.log(`    ✗ [${i.page}] ${i.msg}`));
  }
  if (wrns.length) {
    console.log('\n  WARNINGS (nice to fix):');
    wrns.forEach(i => console.log(`    △ [${i.page}] ${i.msg}`));
  }
  if (!errs.length && !wrns.length) console.log('\n  All clear! No issues found.');
  console.log('\n  Screenshots: ' + OUT);
  console.log('═'.repeat(55));
  fs.writeFileSync(path.join(OUT,'report.json'), JSON.stringify(issues, null, 2));
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
