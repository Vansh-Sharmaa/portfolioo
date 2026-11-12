import fs from 'fs';
const html = fs.readFileSync('D:/portfolio3d/_research/fojcik.html', 'utf8');
const panels = [...html.matchAll(/<div data-project-panel[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g)].map(m => m[0]);
console.log('Project panels found:', panels.length);
if (panels[0]) {
  console.log('--- PANEL 1 ---');
  console.log(panels[0].slice(0, 1500));
}
