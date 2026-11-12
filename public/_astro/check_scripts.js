import fs from 'fs';
const html = fs.readFileSync('D:/portfolio3d/_research/fojcik.html', 'utf8');
const scriptSrcs = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m => m[1]);
console.log('Script tags in fojcik.html:');
scriptSrcs.forEach(src => {
  const localName = src.replace('/_astro/', '').replace('/', '');
  const exists = fs.existsSync('D:/portfolio3d/_research/' + localName);
  console.log(src, '->', localName, exists ? 'EXISTS' : 'MISSING');
});
