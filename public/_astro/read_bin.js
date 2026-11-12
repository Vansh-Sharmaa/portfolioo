import fs from 'fs';

const buf = fs.readFileSync('D:/portfolio3d/assets/models/glitch-portrait-quadtree.bin');
console.log('Buffer length:', buf.byteLength);

// Let's inspect the first 64 bytes
const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
console.log('uint32 at 0:', view.getUint32(0, true));
console.log('uint32 at 4:', view.getUint32(4, true));
console.log('uint32 at 8:', view.getUint32(8, true));
console.log('uint32 at 12:', view.getUint32(12, true));
console.log('uint32 at 16:', view.getUint32(16, true));

// Search for any string headers in the buffer
const str = buf.toString('latin1');
const matches = [...str.matchAll(/[a-zA-Z0-9_\-\.\/]{4,50}/g)].map(m => m[0]);
console.log('Strings found in bin:', matches.slice(0, 20));
