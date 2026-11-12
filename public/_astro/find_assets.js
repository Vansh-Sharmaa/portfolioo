const fs = require('fs');
const code = fs.readFileSync('./_research/scene.CKFAM6Pw.js', 'utf8');
const splatCode = fs.readFileSync('./_research/splat-scan.DBSfySb4.js', 'utf8');
const renderApp = fs.readFileSync('./_research/render-app.C2JM9TBK.js', 'utf8');

function findAssets(txt) {
  const matches = txt.match(/["'][^"']+\.(?:ply|splat|glb|gltf|bin|png|jpg|webp|mp4|webm)["']/gi) || [];
  return [...new Set(matches)];
}

console.log('scene assets:', findAssets(code));
console.log('splatCode assets:', findAssets(splatCode));
console.log('renderApp assets:', findAssets(renderApp));
