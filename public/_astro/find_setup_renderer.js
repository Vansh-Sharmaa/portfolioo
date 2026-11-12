import fs from 'fs';
const files = fs.readdirSync('D:/portfolio3d/_research').filter(f => f.endsWith('.js'));
files.forEach(f => {
  const content = fs.readFileSync('D:/portfolio3d/_research/' + f, 'utf8');
  if (content.includes('setupRenderer')) {
    console.log('Found setupRenderer in:', f);
  }
});
