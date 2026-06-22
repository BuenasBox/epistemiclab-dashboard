const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://epistemiclab.dpdns.org';
const TIMEOUT = 30000;
const visited = new Set();
const pages = [];

async function crawl() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('response', (response) => {
    console.log(`${response.status()} ${response.url()}`);
  });

  const queue = [BASE_URL];

  while (queue.length > 0) {
    const url = queue.shift();

    if (visited.has(url)) continue;
    visited.add(url);

    try {
      console.log(`\n📄 Rastreando: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle', timeout: TIMEOUT });

      const pageData = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          h1: document.querySelector('h1')?.textContent || 'N/A',
          description: document.querySelector('meta[name="description"]')?.getAttribute('content') || 'N/A',
          links: Array.from(document.querySelectorAll('a[href]'))
            .map(a => ({
              text: a.textContent.trim(),
              href: a.getAttribute('href'),
              target: a.getAttribute('target')
            }))
            .filter(l => l.href && !l.href.startsWith('javascript:'))
        };
      });

      pages.push(pageData);

      for (const link of pageData.links) {
        let href = link.href;

        if (href.startsWith('/')) {
          href = BASE_URL + href;
        } else if (href.startsWith('.')) {
          const base = url.substring(0, url.lastIndexOf('/'));
          href = new URL(href, base + '/').href;
        }

        const urlObj = new URL(href);
        href = urlObj.origin + urlObj.pathname + urlObj.search;
        href = href.replace(/#.*$/, '');

        if (href.startsWith(BASE_URL) && !visited.has(href) && queue.length < 500) {
          queue.push(href);
          console.log(`  ↳ Detectado: ${href}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error en ${url}: ${error.message}`);
      pages.push({
        url,
        title: 'ERROR',
        error: error.message
      });
    }
  }

  await browser.close();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(__dirname, `crawl-report-${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(pages, null, 2));

  const csvPath = path.join(__dirname, `crawl-report-${timestamp}.csv`);
  const csvContent = convertToCSV(pages);
  fs.writeFileSync(csvPath, csvContent);

  console.log(`\n✅ Rastreo completado. ${visited.size} páginas encontradas.`);
  console.log(`📊 JSON: ${reportPath}`);
  console.log(`📊 CSV: ${csvPath}`);
}

function convertToCSV(data) {
  const headers = ['URL', 'Título', 'H1', 'Descripción', 'Enlaces salientes'];
  const rows = data.map(p => [
    p.url,
    `"${p.title}"`,
    `"${p.h1}"`,
    `"${p.description}"`,
    p.links ? p.links.length : 0
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

crawl().catch(console.error);