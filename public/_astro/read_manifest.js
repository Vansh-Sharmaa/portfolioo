import fs from 'fs';

const manifest = JSON.parse(fs.readFileSync('D:/portfolio3d/_research/pipeline-manifest.json', 'utf8'));
console.log('Manifest keys:', Object.keys(manifest));
if (Array.isArray(manifest)) {
  console.log('Array length:', manifest.length);
  console.log('Sample item:', manifest[0]);
} else {
  console.log('Sample content:', JSON.stringify(manifest).slice(0, 1000));
}
