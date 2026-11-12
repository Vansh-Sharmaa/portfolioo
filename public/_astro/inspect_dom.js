const fs = require('fs');
const html = fs.readFileSync('./_research/fojcik.html', 'utf8');

// Match sections and data attributes
const sections = [...html.matchAll(/<(?:section|header|footer|div|main)[^>]+(?:data-|id=|class=)[^>]*>/g)].map(m => m[0]);
console.log('Total key elements:', sections.length);

const dataAttrs = [...new Set(html.match(/data-[a-z0-9-]+/g) || [])];
console.log('Unique data attributes:', dataAttrs);

// Extract headings and navigation
const headings = [...html.matchAll(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gs)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
console.log('Headings:', headings);

// Look for data-scroll or section names
const majorSections = [...html.matchAll(/<(?:section|div)[^>]+data-(?:section|scene|project|hero|about|contact|work)[^>]*>/g)].map(m => m[0]);
console.log('Major sections:', majorSections);
