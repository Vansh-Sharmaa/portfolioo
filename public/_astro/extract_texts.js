import fs from 'fs';
const html = fs.readFileSync('D:/portfolio3d/_research/fojcik.html', 'utf8');

const matches = [
  ...html.matchAll(/>([^<>{}\n]{3,80})</g)
].map(m => m[1].trim()).filter(t => t.length > 2 && !t.startsWith('var ') && !t.startsWith('function'));

console.log('Unique visible text nodes count:', [...new Set(matches)].length);
console.log('Sample text nodes:\n', [...new Set(matches)].slice(0, 35));
