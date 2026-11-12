import fs from 'fs';
const dom = fs.readFileSync('D:/portfolio3d/_research/fojcik_dom_structure.html', 'utf8');

// Find all top-level tags inside body
const topTags = [...dom.matchAll(/<(header|nav|section|main|aside|footer|div)[^>]*>/g)].map(m => m[0]);
console.log('Top elements count:', topTags.length);
topTags.slice(0, 20).forEach(t => console.log('Tag:', t));
