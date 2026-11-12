import fs from 'fs';
const html = fs.readFileSync('D:/portfolio3d/_research/fojcik.html', 'utf8');
const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]);
fs.writeFileSync('D:/portfolio3d/_research/fojcik_extracted.css', styles.join('\n\n'));
console.log('Saved fojcik_extracted.css, size:', fs.statSync('D:/portfolio3d/_research/fojcik_extracted.css').size);
