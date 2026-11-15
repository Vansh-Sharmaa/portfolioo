const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('Launching headless Chrome...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--window-size=1600,1000',
    '--disable-gpu-sandbox',
    'http://127.0.0.1:5173/'
  ]);

  await sleep(2500);

  const targets = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9227/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  function send(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      const handler = (event) => {
        const raw = typeof event.data === 'string' ? event.data : event.data.toString();
        const res = JSON.parse(raw);
        if (res.id === msgId) {
          ws.removeEventListener('message', handler);
          resolve(res.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');

  console.log('Waiting for initial 3D scene to load...');
  await sleep(5000);

  // Take screenshot of initial desk view
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\XALTA\\.gemini\\antigravity\\brain\\0080564b-e9c5-4ea5-a5fe-4fc1bbf6ede0\\verify_desk_initial.png', Buffer.from(shot1.data, 'base64'));
  console.log('Screenshot saved: verify_desk_initial.png');

  // Trigger camera enter monitor
  console.log('Triggering enterMonitor camera transition...');
  await send('Runtime.evaluate', {
    expression: `
      if (window.application && window.application.camera) {
        window.application.camera.trigger('enterMonitor');
      }
    `
  });

  await sleep(3000);

  // Take screenshot of zoomed monitor showing 3D cylinder portfolio
  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\XALTA\\.gemini\\antigravity\\brain\\0080564b-e9c5-4ea5-a5fe-4fc1bbf6ede0\\verify_monitor_cylinder.png', Buffer.from(shot2.data, 'base64'));
  console.log('Screenshot saved: verify_monitor_cylinder.png');

  // Check iframe src
  const iframeSrc1 = await send('Runtime.evaluate', {
    expression: `
      const iframe = document.querySelector('iframe');
      iframe ? iframe.src : 'no iframe';
    `,
    returnByValue: true
  });
  console.log('Initial iframe.src:', iframeSrc1.result.value);

  // Trigger toggleOS message
  console.log('Sending toggleOS message to parent...');
  await send('Runtime.evaluate', {
    expression: `
      window.postMessage({ type: 'toggleOS' }, '*');
    `
  });

  await sleep(3500);

  const iframeSrc2 = await send('Runtime.evaluate', {
    expression: `
      const iframe = document.querySelector('iframe');
      iframe ? iframe.src : 'no iframe';
    `,
    returnByValue: true
  });
  console.log('After toggleOS, iframe.src:', iframeSrc2.result.value);

  // Take screenshot of monitor showing Retro OS
  const shot3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\XALTA\\.gemini\\antigravity\\brain\\0080564b-e9c5-4ea5-a5fe-4fc1bbf6ede0\\verify_monitor_retro_os.png', Buffer.from(shot3.data, 'base64'));
  console.log('Screenshot saved: verify_monitor_retro_os.png');

  // Trigger toggleOS again to switch back to 3D cylinder portfolio!
  console.log('Sending toggleOS message again to return to 3D cylinder portfolio...');
  await send('Runtime.evaluate', {
    expression: `
      window.postMessage({ type: 'toggleOS' }, '*');
    `
  });

  await sleep(3500);

  const iframeSrc3 = await send('Runtime.evaluate', {
    expression: `
      const iframe = document.querySelector('iframe');
      iframe ? iframe.src : 'no iframe';
    `,
    returnByValue: true
  });
  console.log('After second toggleOS, iframe.src:', iframeSrc3.result.value);

  // Take screenshot of monitor showing 3D cylinder portfolio again
  const shot4 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\XALTA\\.gemini\\antigravity\\brain\\0080564b-e9c5-4ea5-a5fe-4fc1bbf6ede0\\verify_monitor_returned_cylinder.png', Buffer.from(shot4.data, 'base64'));
  console.log('Screenshot saved: verify_monitor_returned_cylinder.png');

  chrome.kill();
  ws.close();
  console.log('Verification finished successfully!');
}

run().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
