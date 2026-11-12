const fs = require('fs');
const code = fs.readFileSync('./_research/scene.CKFAM6Pw.js', 'utf8');

// search for class names or key functions
const regex = /(class\s+\w+|function\s+\w+|const\s+\w+\s*=\s*(?:class|\([^)]*\)\s*=>))/g;
let m;
const symbols = [];
while ((m = regex.exec(code)) !== null && symbols.length < 50) {
  symbols.push(m[0]);
}
console.log('Sample symbols in scene.js:', symbols.slice(0, 30));

const splat = fs.readFileSync('./_research/splat-scan.DBSfySb4.js', 'utf8');
console.log('splat-scan preview:', splat.slice(0, 1000));
