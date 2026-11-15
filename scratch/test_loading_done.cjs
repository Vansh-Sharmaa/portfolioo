const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const WebSocket = require('ws');
const { spawn } = require('child_process');

async function testWithFreshProfile() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-fresh-'));
  console.log('Using fresh profile dir:', tmpDir);

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9232',
    '--window-size=1600,1000',
    '--user-data-dir=' + tmpDir,
    '--disable-gpu-sandbox',
    'http://127.0.0.1:5173/'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  const targets = await new Promise((res, rej) => http.get('http://127.0.0.1:9232/json', r => {
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

  await send('Page.enable');
  await send('Runtime.enable');

  console.log('Waiting for resources to load...');
  await new Promise(r => setTimeout(r, 3500));

  // Click .bios-start-button
  const clickRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.querySelector('.bios-start-button');
        if (btn) {
          btn.click();
          return 'Found and clicked .bios-start-button';
        }
        return 'No .bios-start-button found';
      })()
    `
  });
  console.log('Click result:', clickRes.result.value);

  // Wait for entrance camera animation (room overview -> desk view)
  console.log('Waiting for camera entrance animation (5.5s)...');
  await new Promise(r => setTimeout(r, 5500));

  // Take screenshot of desk
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/desk_clean_fresh.png', Buffer.from(shot1.data, 'base64'));
  fs.writeFileSync('C:\\Users\\XALTA\\.gemini\\antigravity\\brain\\0080564b-e9c5-4ea5-a5fe-4fc1bbf6ede0\\desk_clean_fresh.png', Buffer.from(shot1.data, 'base64'));
  console.log('Saved desk_clean_fresh.png');

  chrome.kill();
  ws.close();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (e) {}
}

testWithFreshProfile().catch(console.error);

