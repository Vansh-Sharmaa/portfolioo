import fs from 'fs';
const files = fs.readdirSync('D:/portfolio3d/_research').filter(f => f.endsWith('.js'));
const found = new Set();
files.forEach(f => {
  const content = fs.readFileSync('D:/portfolio3d/_research/' + f, 'utf8');
  const matches = content.match(/["'][^"']*\.(splat|ply|spz|ksplat|bin|glb)[^"']*["']/gi) || [];
  matches.forEach(m => found.add(m));
});
console.log('3D model and splat files found across all scripts:', [...found]);
