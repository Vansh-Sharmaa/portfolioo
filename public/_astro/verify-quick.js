/* Focused re-check: hero only (desktop + mobile) after portrait changes. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');

const ROOT = process.env.VROOT || 'D:/portfolio3d';
const OUT = 'D:/portfolio3d/_research/verify';
const PORT = Number(process.env.VPORT || 5174), CDP = Number(process.env.VCDP || 9232);
const SITE_URL = process.env.SITE_URL || `http://127.0.0.1:${PORT}/`;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PROFILE = process.env.VPROFILE || 'D:/portfolio3d/_research/chrome-verify10';
const sleep = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const base = path.resolve(ROOT);
  const f = path.resolve(base, '.' + p);
  if (!f.toLowerCase().startsWith(base.toLowerCase()) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(res);
});
const getJSON = url => new Promise((resolve, reject) => {
  http.get(url, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } }); }).on('error', reject);
});

(async () => {
  await new Promise(r => server.listen(PORT, '127.0.0.1', r));
  const chrome = spawn(CHROME, [
    '--headless=new', '--no-sandbox', '--disable-gpu-sandbox', '--enable-unsafe-swiftshader',
    '--use-gl=angle', '--use-angle=swiftshader', '--no-proxy-server', '--proxy-bypass-list=<-loopback>',
    '--remote-debugging-port=' + CDP, '--user-data-dir=' + PROFILE,
    '--window-size=1440,900', '--hide-scrollbars', 'about:blank'
  ], { stdio: 'ignore' });

  let ver = null;
  for (let i = 0; i < 40; i++) { try { ver = await getJSON(`http://127.0.0.1:${CDP}/json/version`); break; } catch (e) { await sleep(300); } }
  if (!ver) throw new Error('chrome did not start');
  const target = await new Promise((resolve, reject) => {
    const q = http.request({ hostname: '127.0.0.1', port: CDP, path: '/json/new?about:blank', method: 'PUT' }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } }); });
    q.on('error', reject); q.end();
  });
  const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false });
  await new Promise(r => ws.on('open', r));
  let id = 0; const pending = new Map(); const errs = [];
  ws.on('message', raw => {
    const m = JSON.parse(raw.toString());
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
    if (m.method === 'Runtime.exceptionThrown') errs.push('EXC ' + ((m.params.exceptionDetails.exception || {}).description || m.params.exceptionDetails.text || '').slice(0, 240));
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push('CONSOLE ' + (m.params.args || []).map(a => a.value || a.description).join(' ').slice(0, 240));
    if (m.method === 'Network.loadingFailed') errs.push('NET ' + m.params.errorText);
  });
  const s = (method, params = {}) => new Promise(resolve => { const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({ id: n, method, params })); });
  const ev = async expr => {
    const r = await s('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result && r.result.exceptionDetails) return { __err: (r.result.exceptionDetails.exception || {}).description || r.result.exceptionDetails.text };
    return r.result && r.result.result ? r.result.result.value : null;
  };
  const shot = async name => {
    const r = await s('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    if (r.result && r.result.data) { fs.writeFileSync(path.join(OUT, name), Buffer.from(r.result.data, 'base64')); console.log('  shot', name); }
  };
  const realClick = async selector => {
    const b = await ev(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    if (!b) return false;
    await s('Input.dispatchMouseEvent', { type: 'mousePressed', x: b.x, y: b.y, button: 'left', clickCount: 1 });
    await s('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b.x, y: b.y, button: 'left', clickCount: 1 });
    return true;
  };

  await s('Page.enable'); await s('Runtime.enable'); await s('Network.enable');
  await s('Page.addScriptToEvaluateOnNewDocument', {
    source: `window.__errs=[];addEventListener('error',e=>window.__errs.push(String(e.message||e.error)));addEventListener('unhandledrejection',e=>window.__errs.push(String(e.reason)));`
  });
  await s('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await s('Page.navigate', { url: SITE_URL });
  for (let i = 0; i < 50; i++) { if (await ev('document.readyState') === 'complete') break; await sleep(200); }
  await sleep(1200);
  for (let i = 0; i < 40; i++) { if (await ev(`document.querySelector('#gate').classList.contains('is-open')`)) break; await sleep(250); }
  await realClick('[data-motion="off"]');
  await sleep(1700);
  console.log('state:', await ev(`(()=>({body:document.body.className,phase:document.body.dataset.phase,fonts:document.fonts.check('700 40px Silkscreen')}))()`));
  await shot('01-hero.png');

  await s('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await sleep(1000);
  await shot('09-mobile-hero.png');
  console.log('mobile fit:', await ev(`(()=>({docW:document.documentElement.scrollWidth,winW:innerWidth,overflowX:document.documentElement.scrollWidth>innerWidth}))()`));
  console.log('page errors:', await ev('window.__errs'));
  console.log('console/network errors:', errs);

  ws.close(); chrome.kill(); server.close();
  console.log('DONE');
  process.exit(0);
})().catch(e => { console.error('FATAL', e); try { server.close(); } catch (_) {} process.exit(1); });
