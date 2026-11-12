import fs from 'fs';
const files = fs.readdirSync('D:/portfolio3d/_research').filter(f => f.endsWith('.js'));
const wasmFiles = new Set();
files.forEach(f => {
  const content = fs.readFileSync('D:/portfolio3d/_research/' + f, 'utf8');
  const matches = content.match(/["'][^"']*\.wasm[^"']*["']/g) || [];
  matches.forEach(m => wasmFiles.add(m));
});
console.log('Wasm files:', [...wasmFiles]);
