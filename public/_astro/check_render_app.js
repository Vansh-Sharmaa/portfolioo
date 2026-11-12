import fs from 'fs';
const code = fs.readFileSync('D:/portfolio3d/_research/render-app.C2JM9TBK.js', 'utf8');
console.log('render-app length:', code.length);
console.log('render-app mapDeps:', code.slice(0, 400));
