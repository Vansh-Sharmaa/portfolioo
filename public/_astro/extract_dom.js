import fs from 'fs';
const html = fs.readFileSync('D:/portfolio3d/_research/fojcik.html', 'utf8');

// Extract the body tag and its direct children
const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
if (bodyMatch) {
  const bodyContent = bodyMatch[1];
  console.log('Body length:', bodyContent.length);

  // Let's strip out the inline scripts and see what DOM structure is left
  const cleanedDom = bodyContent.replace(/<script[\s\S]*?<\/script>/gi, '');
  fs.writeFileSync('D:/portfolio3d/_research/fojcik_dom_structure.html', cleanedDom);
  console.log('Saved fojcik_dom_structure.html, length:', cleanedDom.length);
}
