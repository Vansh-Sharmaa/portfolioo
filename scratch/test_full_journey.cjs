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
    '--remote-debugging-port=9231',
    '--window-size=1600,1000',
    '--user-data-dir=' + tmpDir,
    '--disable-gpu-sandbox',
    'http://127.0.0.1:5173/'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  const targets = await new Promise((res, rej) => http.get('http://127.0.0.1:9231/json', r => {
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

  console.log('Waiting for BIOS screen...');
  await new Promise(r => setTimeout(r, 3000));

  // Click the START button on the BIOS loading screen
  console.log('Clicking START on loading screen...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        // Find button or text with START or click document
        const btns = Array.from(document.querySelectorAll('button, div, span, a'));
        const startBtn = btns.find(b => b.innerText && b.innerText.trim().toUpperCase() === 'START');
        if (startBtn) {
          startBtn.click();
          return 'Clicked startBtn';
        }
        document.body.click();
        return 'Clicked body';
      })()
    `
  });

  // Wait for 3D room to enter and reach desk view
  console.log('Waiting for room to load and settle...');
  await new Promise(r => setTimeout(r, 5000));

  // Ensure camera is at desk view
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        if (window.application && window.application.camera) {
          // If in room, transition or check state
          if (window.application.camera.transitionTo) {
            window.application.camera.transitionTo('desk', 1000);
          }
        }
      })()
    `
  });
  await new Promise(r => setTimeout(r, 2500));

  // Screenshot desk view
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/live_desk_with_fresh.png', Buffer.from(shot1.data, 'base64'));
  fs.writeFileSync('C:\\Users\\XALTA\\.gemini\\antigravity\\brain\\0080564b-e9c5-4ea5-a5fe-4fc1bbf6ede0\\live_desk_with_fresh.png', Buffer.from(shot1.data, 'base64'));
  console.log('Live desk screenshot saved');

  chrome.kill();
  ws.close();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (e) {}
}

testWithFreshProfile().catch(console.error);

