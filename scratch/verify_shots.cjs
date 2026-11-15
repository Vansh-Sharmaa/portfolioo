const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');
const { spawn } = require('child_process');

async function run() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--window-size=1600,1000',
    '--disable-gpu-sandbox',
    '--disk-cache-size=1',
    'http://127.0.0.1:5173/?nocache=' + Date.now()
  ]);

  await new Promise(r => setTimeout(r, 2500));

  const targets = await new Promise((res, rej) => http.get('http://127.0.0.1:9227/json', r => {
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
  await send('Page.enable');
  await send('Runtime.enable');

  console.log('Waiting for initial room load...');
  await new Promise(r => setTimeout(r, 4000));

  // Click start pill to enter desk view
  await send('Runtime.evaluate', {
    expression: 'document.getElementById("room-start-pill") ? document.getElementById("room-start-pill").click() : null'
  });

  console.log('Transitioning to desk...');
  await new Promise(r => setTimeout(r, 3000));

  // Screenshot 1: Desk view
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/verify_desk_view.png', Buffer.from(shot1.data, 'base64'));
  fs.writeFileSync('C:\\Users\\XALTA\\.gemini\\antigravity\\brain\\0080564b-e9c5-4ea5-a5fe-4fc1bbf6ede0\\verify_desk_view.png', Buffer.from(shot1.data, 'base64'));
  console.log('Desk view saved');

  // Let's also crop the badge area from desk view to inspect closely
  chrome.kill();
  ws.close();
}
run().catch(console.error);

