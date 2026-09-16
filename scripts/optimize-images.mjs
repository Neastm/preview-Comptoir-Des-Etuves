import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const pages = ['.', 'en', 'es'].flatMap(dir => fs.readdirSync(dir).filter(f => /\.(html|css|js|xml)$/.test(f)).map(f => path.join(dir, f)));
const corpus = pages.map(f => fs.readFileSync(f, 'utf8').replace(/(?:%[0-9a-f]{2})+/gi, value => decodeURIComponent(value))).join('\n');
const images = fs.readdirSync('images').filter(f => fs.statSync(path.join('images', f)).isFile());
const unused = images.filter(name => !corpus.includes(name));
if (process.argv.includes('--plan')) {
  fs.writeFileSync('.tmp-image-plan.json', JSON.stringify({images, unused}, null, 2));
  console.log(JSON.stringify({images: images.length, unused}, null, 2));
  process.exit(0);
}

let saved = 0;
const backupIndex = process.argv.indexOf('--backup');
const backup = backupIndex >= 0 ? process.argv[backupIndex + 1] : null;
if (!backup || !images.every(name => fs.existsSync(path.join(backup, name)))) {
  throw new Error('Provide --backup with the folder containing a copy of every remaining original image.');
}
for (const name of images.filter(f => !unused.includes(f))) {
  const source = path.join('images', name);
  if (fs.statSync(source).size < 120_000) continue;
  const outputName = name.replace(/\.[^.]+$/, '.webp');
  const output = path.join('images', outputName);
  const input = fs.readFileSync(source);
  const hero = name.includes('detoure');
  const sticker = name.includes('sticker');
  const width = sticker ? 384 : hero ? 1100 : 1200;
  const buffer = await sharp(input).rotate().resize({width, withoutEnlargement: true}).webp({quality: hero ? 88 : 82, alphaQuality: 100, effort: 6}).toBuffer();
  if (buffer.length >= input.length && outputName === name) continue;
  fs.writeFileSync(output, buffer);
  saved += input.length - buffer.length;
  for (const file of pages) {
    let html = fs.readFileSync(file, 'utf8');
    html = html.split(name).join(outputName).split(encodeURIComponent(name)).join(encodeURIComponent(outputName));
    if (name.endsWith('.png')) html = html.replace(new RegExp(`(href="[^"]*${outputName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*type=")image/png`, 'g'), '$1image/webp');
    fs.writeFileSync(file, html);
  }
  console.log(`${name}: ${Math.round(input.length/1024)} → ${Math.round(buffer.length/1024)} KB`);
  if (outputName !== name) fs.unlinkSync(source);
}
console.log(`Saved ${(saved / 1024 / 1024).toFixed(2)} MB on referenced images.`);
