import fs from 'fs';
import https from 'https';

const files = fs.readdirSync('D:/portfolio3d/_research').filter(f => f.endsWith('.js'));
const astroDeps = new Set();

files.forEach(f => {
  const content = fs.readFileSync('D:/portfolio3d/_research/' + f, 'utf8');
  const matches = content.match(/_astro\/[a-zA-Z0-9_\-\.]+\.js/g) || [];
  matches.forEach(m => astroDeps.add(m.replace('_astro/', '')));
});

console.log('Total referenced _astro files:', astroDeps.size);
const missing = [];
astroDeps.forEach(dep => {
  if (!fs.existsSync('D:/portfolio3d/_research/' + dep)) {
    missing.push(dep);
  }
});
console.log('Missing _astro files:', missing);

if (missing.length > 0) {
  let done = 0;
  missing.forEach(dep => {
    https.get('https://fojcikdominik.com/_astro/' + dep, res => {
      if (res.statusCode === 200) {
        const stream = fs.createWriteStream('D:/portfolio3d/_research/' + dep);
        res.pipe(stream);
        stream.on('finish', () => {
          console.log('Downloaded', dep);
          done++;
        });
      } else {
        console.error('Failed to download', dep, res.statusCode);
      }
    });
  });
}
