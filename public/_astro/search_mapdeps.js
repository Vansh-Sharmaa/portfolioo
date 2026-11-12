import fs from 'fs';
const code = fs.readFileSync('D:/portfolio3d/_research/layout.astro_astro_type_script_index_2_lang.BGGVC-cu.js', 'utf8');
const idx = code.indexOf('mapDeps');
console.log('mapDeps idx:', idx);
if (idx !== -1) {
  console.log(code.slice(Math.max(0, idx - 50), idx + 400));
}
