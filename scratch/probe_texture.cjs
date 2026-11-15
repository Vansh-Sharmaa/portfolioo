const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');
const { spawn } = require('child_process');

async function debugTextureCoords() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9233',
    '--window-size=1600,1000',
    '--disable-gpu-sandbox',
    'http://127.0.0.1:5173/'
  ]);

  await new Promise(r => setTimeout(r, 2500));
  const targets = await new Promise((res, rej) => http.get('http://127.0.0.1:9233/json', r => {
    let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej));

  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));

  let msgId = 1;
  function send(method, params = {}) {
    return new Promise(resolve => {
      const id = msgId++;
      const handler = (evt) => {
        const res = JSON.parse(evt.data);
        if (res.id === id) {
          ws.removeEventListener('message', handler);
          resolve(res.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Runtime.enable');
  await send('Page.enable');

  console.log('Waiting for room to load...');
  await new Promise(r => setTimeout(r, 4000));

  await send('Runtime.evaluate', {
    expression: "document.querySelector('.bios-start-button')?.click()"
  });
  await new Promise(r => setTimeout(r, 4000));

  await send('Runtime.evaluate', {
    expression: 'window.application.camera.trigger("enterDesk")'
  });
  await new Promise(r => setTimeout(r, 2500));

  // Now, in Three.js: inspect the monitor mesh and its texture
  const debugInfo = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const app = window.application;
        const mesh = app.scene.getObjectByName('monitor_base');
        if (!mesh) return 'No monitor_base';
        
        // Let's inspect the material and map
        const mat = mesh.material;
        const map = mat.map;
        
        // Find UV coordinates of the vertices near the bottom-left of the monitor
        const geom = mesh.geometry;
        const pos = geom.attributes.position;
        const uv = geom.attributes.uv;
        const uv2 = geom.attributes.uv2;
        
        // Search vertices with x in [-0.85, -0.4], y in [0.2, 0.55], z in [0.4, 0.6]
        const nearby = [];
        for (let i = 0; i < pos.count; i++) {
          const px = pos.getX(i);
          const py = pos.getY(i);
          const pz = pos.getZ(i);
          if (px < -0.3 && py > 0.25 && py < 0.55 && pz > 0.45) {
            nearby.push({
              index: i,
              pos: [px, py, pz],
              uv: [uv.getX(i), uv.getY(i)],
              uv2: uv2 ? [uv2.getX(i), uv2.getY(i)] : null
            });
          }
        }
        
        return {
          meshName: mesh.name,
          materialType: mat.type,
          mapSrc: map.image ? map.image.src : null,
          mapWidth: map.image ? map.image.width : null,
          mapHeight: map.image ? map.image.height : null,
          nearbyCount: nearby.length,
          nearby
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Debug info:', JSON.stringify(debugInfo.result.value, null, 2));

  // Now let's draw on the texture canvas in Chrome to pinpoint the badge!
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const app = window.application;
        const mesh = app.scene.getObjectByName('monitor_base');
        const img = mesh.material.map.image;
        
        // Create canvas from the image
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Let's inspect pixel colors at various candidate locations
        // We know nearby vertices have UV:
        // Let's read pixel color at u=0.405, v=0.673
        // If flipY=false: y = (1-v)*H = (1-0.673)*4096 = 1339
        // If flipY=true: y = v*4096 = 2756
        
        // Let's paint a bright MAGENTA rectangle at:
        // Box A: x=1500..1800, y=1300..1500
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(1500, 1300, 300, 200);
        
        // Box B: x=1500..1800, y=2600..2800 (CYAN)
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(1500, 2600, 300, 200);
        
        // Box C: x=2250..2450, y=1900..2000 (YELLOW)
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(2250, 1900, 200, 100);
        
        // Box D: x=900..1300, y=1300..1500 (RED)
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(900, 1300, 400, 200);

        // Update texture
        mesh.material.map.image = canvas;
        mesh.material.map.needsUpdate = true;
      })()
    `
  });

  await new Promise(r => setTimeout(r, 1000));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/texture_probe.png', Buffer.from(shot.data, 'base64'));
  fs.writeFileSync('C:\\Users\\XALTA\\.gemini\\antigravity\\brain\\0080564b-e9c5-4ea5-a5fe-4fc1bbf6ede0\\texture_probe.png', Buffer.from(shot.data, 'base64'));
  console.log('Probe screenshot saved');

  chrome.kill();
  ws.close();
}

debugTextureCoords().catch(console.error);

