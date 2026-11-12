import fs from 'fs';
const html = fs.readFileSync('D:/portfolio3d/_research/fojcik.html', 'utf8');
const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]);
console.log('Inline styles count:', styles.length, 'total chars:', styles.reduce((a,b)=>a+b.length, 0));
const cssLinks = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi)].map(m => m[0]);
console.log('CSS links:', cssLinks);
