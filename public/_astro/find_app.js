import fs from 'fs';
const code = fs.readFileSync('D:/portfolio3d/_research/scene.CKFAM6Pw.js', 'utf8');
const appIdx = code.indexOf('id="app"');
console.log('id=app idx:', appIdx);
const appMatches = [...code.matchAll(/#app|\.app|querySelector\([^)]*app[^)]*\)/gi)].map(m => m[0]);
console.log('App matches:', appMatches);
