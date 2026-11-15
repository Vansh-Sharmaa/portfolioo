const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');

async function check() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9229',
    '--window-size=1600,1000',
    '--disable-gpu-sandbox',
    'http://127.0.0.1:5173/'
  ]);

  await new Promise(r => setTimeout(r, 2000));
  const targets = await new Promise((res, rej) => http.get('http://127.0.0.1:9229/json', r => {
    let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej));

  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  let msgId = 1;
  function send(method, params = {}) {
    return new Promise(resolve => {
      const id = msgId++;
      const handler = (data) => {
        const res = JSON.parse(data.toString());
        if (res.id === id) {
          ws.off('message', handler);
          resolve(res.result);
        }
      };
      ws.on('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Runtime.enable');
  await new Promise(r => setTimeout(r, 3500));

  const res = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const app = window.application;
        if (!app) return { error: 'no application' };
        const tex = app.resources.items.texture.computerSetupTexture;
        const img = tex ? tex.image : null;
        
        // Let's also check all meshes in the scene and their textures
        const meshes = [];
        app.scene.traverse(obj => {
          if (obj.isMesh) {
            meshes.push({
              name: obj.name,
              materialMap: obj.material && obj.material.map ? obj.material.map.image.src : null
            });
          }
        });

        return {
          textureSrc: img ? img.src : null,
          imageWidth: img ? img.width : null,
          imageHeight: img ? img.height : null,
          meshes
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Texture & Mesh Info:', JSON.stringify(res.result.value, null, 2));

  chrome.kill();
  ws.close();
}
check().catch(console.error);

