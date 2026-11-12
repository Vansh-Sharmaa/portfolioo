import fs from 'fs';
const code = fs.readFileSync('D:/portfolio3d/_research/scene.CKFAM6Pw.js', 'utf8');
const imports = [...code.matchAll(/import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/g)].map(m => ({
  module: m[2],
  symbols: m[1].split(',').map(s => s.trim()).filter(Boolean)
}));
console.log('Imports count:', imports.length);
imports.forEach(imp => {
  console.log(imp.module, imp.symbols.slice(0, 10));
});
