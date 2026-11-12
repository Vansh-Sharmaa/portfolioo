import fs from 'fs';
const css = fs.readFileSync('D:/portfolio3d/_research/fojcik_extracted.css', 'utf8');

// Find color definitions and root variables
const rootVars = css.match(/--[a-zA-Z0-9_-]+:[^;]+;/g) || [];
console.log('Sample root variables (first 25):', rootVars.slice(0, 25));

// Find key utility or component classes
const classNames = [...new Set(css.match(/\.[a-zA-Z0-9_\-\[\]:]+/g) || [])];
console.log('Total classes:', classNames.length);
console.log('Sample classes:', classNames.filter(c => c.includes('hero') || c.includes('intro') || c.includes('project') || c.includes('stage') || c.includes('grid')).slice(0, 20));
