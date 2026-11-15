const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');

async function run() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9228',
    '--window-size=1600,1000',
    '--disable-gpu-sandbox',
    'http://127.0.0.1:5173/'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const targets = await new Promise((res, rej) => http.get('http://127.0.0.1:9228/json', r => {
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

  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  ws.on('message', data => {
    const msg = JSON.parse(data.toString());
    if (msg.method === 'Network.requestWillBeSent') {
      const url = msg.params.request.url;
      if (url.includes('.jpg') || url.includes('.png') || url.includes('.glb')) {
        console.log('[NETWORK REQUEST]:', url);
      }
    }
  });

  await new Promise(r => setTimeout(r, 5000));

  chrome.kill();
  ws.close();
}
run().catch(console.error);

