import fs from 'fs';

const html = fs.readFileSync('D:/portfolio3d/_research/fojcik.html', 'utf8');

// Let's inspect the entire visual structure:
// 1. What does the Hero contain?
const heroMatch = html.match(/<section[^>]*hero[^>]*>([\s\S]*?)<\/section>/i) || html.match(/<section[^>]*data-intro[^>]*>([\s\S]*?)<\/section>/i);
if (heroMatch) {
  console.log('--- HERO SECTION ---');
  console.log(heroMatch[0].slice(0, 1500));
}

// 2. What are the main overlay elements in the body?
const allDivs = [...html.matchAll(/<(?:header|nav|section|main|aside|footer|div)[^>]+(?:class|id|data-)[^>]*>/g)].map(m => m[0]);
console.log('--- KEY CONTAINER TAGS ---');
console.log(allDivs.filter(d => d.includes('data-') || d.includes('header') || d.includes('fixed') || d.includes('absolute')).slice(0, 30));
