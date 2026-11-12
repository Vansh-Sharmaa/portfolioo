import http from 'http';
import fs from 'fs';
import path from 'path';

// Let's inspect the files ref3-01-hero.png and compare
console.log('Inspecting ref3 images in _research...');
const files = fs.readdirSync('D:/portfolio3d/_research').filter(f => f.startsWith('ref3-'));
console.log('Reference screenshots available:', files);
