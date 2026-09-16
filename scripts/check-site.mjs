import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';

const files = ['.', 'en', 'es'].flatMap(dir => fs.readdirSync(dir).filter(f => f.endsWith('.html')).map(f => path.join(dir, f)));
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  if (path.basename(file) === 'index.html') {
    const meta = await sharp('images/Burger Montagnard.webp').metadata();
    assert(html.includes(`property="og:image:width" content="${meta.width}"`), file + ' OG width');
    assert(html.includes(`property="og:image:height" content="${meta.height}"`), file + ' OG height');
  }
  assert.equal((html.match(/<h1\b/g) || []).length, 1, file + ' h1');
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(match[1]);
  for (const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
    const url = match[1].replace(/&amp;/g, '&');
    if (/^(?:https?:|tel:|mailto:|#|\/)/.test(url)) continue;
    const target = decodeURIComponent(url.split(/[?#]/)[0]);
    if (target) assert(fs.existsSync(path.resolve(path.dirname(file), target)), file + ': missing ' + target);
  }
  if (file !== '404.html') {
    assert(html.includes('footer-languages'), file + ' languages');
    assert(html.includes('footer-categories'), file + ' categories');
    assert(html.includes('rel="canonical"'), file + ' canonical');
  }
}
const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
assert.equal((sitemap.match(/<lastmod>2026-09-16<\/lastmod>/g) || []).length, 30);
console.log(`Checked ${files.length} HTML pages: local links, JSON-LD, headings, footers and sitemap OK.`);
const imageBytes = fs.readdirSync('images').reduce((sum, file) => sum + fs.statSync(path.join('images', file)).size, 0);
console.log(`Images: ${(imageBytes / 1024 / 1024).toFixed(2)} MB total.`);
