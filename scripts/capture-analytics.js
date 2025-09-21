import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const url = process.env.APP_URL || 'http://localhost:5173';
  const analyticsPath = '/analytics';
  const outDir = 'scripts/__captures__';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const consoleMessages = [];
  page.on('console', msg => {
    try {
      const args = msg.args ? msg.args.map(a => a.toString()) : [msg.text()];
      consoleMessages.push({ type: msg.type(), text: msg.text(), args });
    } catch (e) {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    }
  });
  page.on('pageerror', err => consoleMessages.push({ type: 'pageerror', text: err.message }));

  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});

  // Try to navigate to Analytics route either by clicking a link or by direct path
  try {
    await page.goto(url + analyticsPath, { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (e) {
    // ignore
  }

  // Wait briefly for SPA hydration
  await new Promise((res) => setTimeout(res, 1200));

  const screenshotPath = `${outDir}/analytics-screenshot.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const logPath = `${outDir}/analytics-console.log`;
  fs.writeFileSync(logPath, JSON.stringify(consoleMessages, null, 2));

  console.log('screenshot:', screenshotPath);
  console.log('console log:', logPath);

  await browser.close();
})();
