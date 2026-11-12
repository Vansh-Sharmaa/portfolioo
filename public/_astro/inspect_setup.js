import fs from 'fs';
const code = fs.readFileSync('D:/portfolio3d/_research/layout.astro_astro_type_script_index_2_lang.BGGVC-cu.js', 'utf8');
const idx = code.indexOf('setupRenderer');
console.log('Snippet around setupRenderer in layout script:');
console.log(code.slice(Math.max(0, idx - 100), idx + 400));
