import fs from 'fs';
import path from 'path';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDir('D:/portfolio3d/public/_astro');
ensureDir('D:/portfolio3d/public/fonts');
ensureDir('D:/portfolio3d/public/models');

// 1. Copy all _research/*.js and wasm files to public/_astro/
const researchFiles = fs.readdirSync('D:/portfolio3d/_research');
let jsCount = 0;
researchFiles.forEach(f => {
  if (f.endsWith('.js') || f.endsWith('.wasm')) {
    fs.copyFileSync('D:/portfolio3d/_research/' + f, 'D:/portfolio3d/public/_astro/' + f);
    jsCount++;
  }
});
console.log('Copied', jsCount, 'modules to public/_astro/');

// 2. Copy fonts to public/fonts/
const fontFiles = fs.readdirSync('D:/portfolio3d/assets/fonts');
fontFiles.forEach(f => {
  fs.copyFileSync('D:/portfolio3d/assets/fonts/' + f, 'D:/portfolio3d/public/fonts/' + f);
});
console.log('Copied', fontFiles.length, 'fonts to public/fonts/');

// 3. Copy models to public/models/ and root
fs.copyFileSync('D:/portfolio3d/assets/models/glitch-portrait-quadtree.bin', 'D:/portfolio3d/public/glitch-portrait-quadtree.bin');
fs.copyFileSync('D:/portfolio3d/assets/models/city-block.glb', 'D:/portfolio3d/public/city-block.glb');

const modelFiles = fs.readdirSync('D:/portfolio3d/assets/models');
modelFiles.forEach(f => {
  fs.copyFileSync('D:/portfolio3d/assets/models/' + f, 'D:/portfolio3d/public/models/' + f);
});
console.log('Copied models to public/models/ and public root');
