import fs from 'fs';
const code = fs.readFileSync('D:/portfolio3d/_research/layout.astro_astro_type_script_index_2_lang.BGGVC-cu.js', 'utf8');
const mapDeps = code.match(/__vite__mapDeps\s*=\s*\([^)]*\)\s*=>[^{]*\[([^\]]+)\]/);
console.log('mapDeps in layout script:\n', mapDeps ? mapDeps[1] : 'not found');
