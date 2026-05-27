import { chromium } from '/Users/platon/.npm-global/lib/node_modules/playwright/index.js';
import fs from 'fs';

const BASE = 'http://localhost:3000';
const EMAIL = 'admin@farline.cz';
const PASS = 'changeme';
const VIEWPORTS = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

const issues = [];
const log = (page, msg, sev = 'warn') => {
  console.log(`[${sev.toUpperCase()}][${page}] ${msg}`);
  issues.push({ page, msg, sev });
};

async function login(pg) {
  await pg.goto(BASE + '/login');
  await pg.waitForSelector('input[type="email"]', { timeout: 10000 });
  await pg.fill('input[type="email"]', EMAIL);
  await pg.fill('input[type="password"]', PASS);
  await pg.click('button[type="submit"]');
  await pg.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await pg.waitForTimeout(800);
}

async function checkOverflow(pg, label, vpName) {
  const bad = await pg.evaluate(() => {
    const w = document.documentElement.clientWidth;
    return [...document.querySelectorAll('*')]
      .filter(el => { const r = el.getBoundingClientRect(); return r.right > w + 4 && r.height > 0; })
      .slice(0, 4)
      .map(el => el.tagName.toLowerCase() + (el.className ? '.' + el.className.toString().split(' ')[0] : ''));
  });
  if (bad.length) log(label, `Overflow @${vpName}: ${bad.join(', ')}`, 'error');
}

async function shot(pg, name) {
  await pg.screenshot({ path: `/tmp/farline-audit/${name}.png`, fullPage: true });
}

const browser = await chromium.launch({ headless: true });
console.log('=== FARLINE AUDIT ===');

// ── DASHBOARD ──
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: vp });
  const pg = await ctx.newPage();
  const errs = []; pg.on('console', m => { if (m.type()==='error') errs.push(m.text().slice(0,80)); });
  await login(pg);
  await pg.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 15000 });
  await pg.waitForTimeout(600);
  await shot(pg, `dashboard-${vp.name}`);
  await checkOverflow(pg, 'dashboard', vp.name);
  if (errs.length) log('dashboard', `console errors @${vp.name}: ${errs[0]}`, 'error');
  await ctx.close();
}
console.log('[OK] Dashboard done');

// ── NABIDKY ──
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: vp });
  const pg = await ctx.newPage();
  await login(pg);
  await pg.goto(BASE + '/nabidky', { waitUntil: 'networkidle', timeout: 15000 });
  await pg.waitForTimeout(600);
  await shot(pg, `nabidky-${vp.name}`);
  await checkOverflow(pg, 'nabidky', vp.name);
  await ctx.close();
}
console.log('[OK] Nabidky done');

// ── KATALOG ──
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: vp });
  const pg = await ctx.newPage();
  await login(pg);
  await pg.goto(BASE + '/katalog', { waitUntil: 'networkidle', timeout: 15000 });
  await pg.waitForTimeout(600);
  await shot(pg, `katalog-${vp.name}`);
  await checkOverflow(pg, 'katalog', vp.name);
  await ctx.close();
}
console.log('[OK] Katalog done');

// ── OFFER EDITOR ──
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const pg = await ctx.newPage();
  await login(pg);
  const data = await pg.evaluate(async () => (await (await fetch('/api/offers')).json()));
  const offer = data.offers?.[0];
  if (offer) {
    await pg.goto(BASE + '/nabidky/' + offer.id, { waitUntil: 'networkidle', timeout: 20000 });
    await pg.waitForTimeout(800);
    await shot(pg, 'offer-editor-mobile-375');
    await checkOverflow(pg, 'offer-editor', 'mobile-375');

    // Check toggle pills
    const pills = await pg.$$eval('span[style*="backgroundColor"], span[style*="background"]', els =>
      els.map(el => ({ w: el.offsetWidth, h: el.offsetHeight, bg: el.getAttribute('style') }))
    );
    console.log(`Toggle pill spans found: ${pills.length}`);
    if (pills.length === 0) log('offer-editor', 'No toggle pill elements found', 'warn');

    // Check aside visible
    const asideVisible = await pg.$eval('aside', el => el.offsetHeight > 0).catch(() => false);
    console.log(`Aside panel visible on mobile: ${asideVisible}`);
  } else {
    log('offer-editor', 'No offers to test', 'warn');
  }
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pg = await ctx.newPage();
  await login(pg);
  const data = await pg.evaluate(async () => (await (await fetch('/api/offers')).json()));
  const offer = data.offers?.[0];
  if (offer) {
    await pg.goto(BASE + '/nabidky/' + offer.id, { waitUntil: 'networkidle', timeout: 20000 });
    await pg.waitForTimeout(800);
    await shot(pg, 'offer-editor-desktop-1440');
    await checkOverflow(pg, 'offer-editor', 'desktop-1440');
  }
  await ctx.close();
}
console.log('[OK] Offer editor done');

// ── PUBLIC OFFER ──
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const pg = await ctx.newPage();
  await login(pg);
  const data = await pg.evaluate(async () => (await (await fetch('/api/offers')).json()));
  const offer = data.offers?.find(o => o.shareEnabled && o.shareId);
  await ctx.close();

  if (offer) {
    const pubCtx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const pubPg = await pubCtx.newPage();
    await pubPg.goto(BASE + '/nabidka/' + offer.shareId, { waitUntil: 'networkidle', timeout: 20000 });
    await pubPg.waitForTimeout(800);
    await shot(pubPg, 'public-offer-mobile-375');
    await checkOverflow(pubPg, 'public-offer', 'mobile-375');
    await pubCtx.close();

    const pubCtx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const pubPg2 = await pubCtx2.newPage();
    await pubPg2.goto(BASE + '/nabidka/' + offer.shareId, { waitUntil: 'networkidle', timeout: 20000 });
    await pubPg2.waitForTimeout(800);
    await shot(pubPg2, 'public-offer-desktop-1440');
    await pubCtx2.close();
    console.log('[OK] Public offer done');
  } else {
    log('public-offer', 'No shared offer to test', 'warn');
  }
}

// ── PRODUCT FORM MODAL ──
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const pg = await ctx.newPage();
  await login(pg);
  await pg.goto(BASE + '/katalog', { waitUntil: 'networkidle', timeout: 15000 });
  await pg.waitForTimeout(600);
  const btn = pg.locator('button', { hasText: 'Přidat produkt' }).first();
  if (await btn.isVisible()) {
    await btn.click();
    await pg.waitForTimeout(600);
    await pg.screenshot({ path: '/tmp/farline-audit/product-form-modal-mobile.png', fullPage: false });
    await checkOverflow(pg, 'product-form-modal', 'mobile-375');
    const modal = await pg.$('.rounded-t-2xl');
    if (modal) {
      const box = await modal.boundingBox();
      console.log(`[OK] Product form modal on mobile: width=${Math.round(box?.width)}, y=${Math.round(box?.y)}`);
      if (box && box.y < 50) log('product-form-modal', 'Modal starts too high (not bottom-sheet)', 'warn');
    } else {
      log('product-form-modal', 'Bottom-sheet class not found', 'warn');
    }
  }
  await ctx.close();
}

await browser.close();

// ── REPORT ──
console.log('\n=== RESULTS ===');
const errors = issues.filter(i => i.sev === 'error');
const warns = issues.filter(i => i.sev === 'warn');
console.log(`Errors: ${errors.length}  |  Warnings: ${warns.length}`);
errors.forEach(i => console.log(`  ERROR  [${i.page}] ${i.msg}`));
warns.forEach(i => console.log(`  WARN   [${i.page}] ${i.msg}`));
fs.writeFileSync('/tmp/farline-audit/report.json', JSON.stringify(issues, null, 2));
