import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 5190;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.bin': 'application/octet-stream',
  '.glb': 'model/gltf-binary',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  let filePath = '';

  if (url === '/' || url === '/index.html') {
    filePath = 'D:/portfolio3d/_research/fojcik.html';
  } else if (url.startsWith('/_astro/')) {
    const filename = url.replace('/_astro/', '');
    filePath = 'D:/portfolio3d/_research/' + filename;
  } else if (url.startsWith('/fonts/')) {
    const filename = url.replace('/fonts/', '');
    filePath = 'D:/portfolio3d/assets/fonts/' + filename;
  } else if (url === '/glitch-portrait-quadtree.bin') {
    filePath = 'D:/portfolio3d/assets/models/glitch-portrait-quadtree.bin';
  } else if (url === '/city-block.glb') {
    filePath = 'D:/portfolio3d/assets/models/city-block.glb';
  } else if (url.startsWith('/models/')) {
    const filename = url.replace('/models/', '');
    filePath = 'D:/portfolio3d/assets/models/' + filename;
  } else if (url === '/og.jpg') {
    filePath = 'D:/portfolio3d/_research/og.jpg';
  } else {
    filePath = 'D:/portfolio3d/_research' + url;
  }

  if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    console.log('404:', url, '->', filePath);
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('Test server up on', PORT);
});
