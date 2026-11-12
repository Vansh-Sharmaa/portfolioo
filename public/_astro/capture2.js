const WebSocket = require('ws');
const fs = require('fs');
const http = require('http');
const OUT = 'D:/portfolio3d/_research/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
function getJSON(url) { return new Promise((resolve, reject) => { http.get(url, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } }); }).on('error', reject); }); }

(async () => {
  const ver = await getJSON('http://127.0.0.1:9222/json/version');
  const target = await new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port: 9222, path: '/json/new?about:blank', method: 'PUT' }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } }); });
    req.on('error', reject); req.end();
  });
  const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false });
  await new Promise(r => ws.on('open', r));
  let id = 0; const pending = new Map();
  ws.on('message', raw => {
    const m = JSON.parse(raw.toString());
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    else if (m.method === 'Runtime.consoleAPICalled') console.log('CONSOLE', m.params.type, (m.params.args || []).map(a => a.value || a.description).join(' ').slice(0, 300));
    else if (m.method === 'Runtime.exceptionThrown') console.log('EXCEPTION', (m.params.exceptionDetails || {}).text, ((m.params.exceptionDetails || {}).exception || {}).description?.slice(0, 300));
    else if (m.method === 'Log.entryAdded') console.log('LOG', m.params.entry.level, m.params.entry.text?.slice(0, 300));
  });
  const send = (method, params = {}) => new Promise(resolve => { const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({ id: n, method, params })); });
  const evalJs = async expr => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); return r.result && r.result.result ? r.result.result.value : null; };

  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{sessionStorage.setItem('render-tier','webgl')}catch(e){}` });
  await send('Page.navigate', { url: 'https://fojcikdominik.com/?webgl' });
  console.log('navigating with forced webgl tier...');
  await sleep(14000);
  console.log('state:', await evalJs(`(()=>{const p=document.querySelector('[data-preloader]');return {body:document.body.className,pre:p?[...p.attributes].map(a=>a.name).join(','):'gone',scrollH:document.documentElement.scrollHeight,webgl:!!document.createElement('canvas').getContext('webgl2'),webgpu:!!navigator.gpu}})()`));
  await evalJs(`(()=>{const b=document.querySelector('[data-motion-decline]');if(b)b.click();return 1})()`);
  await sleep(6000);
  await evalJs(`(()=>{const p=document.querySelector('[data-preloader]');if(p){p.setAttribute('hidden','');p.style.display='none'}const h=document.querySelector('[data-header]');if(h)h.setAttribute('data-ready','');return 1})()`);
  await sleep(2500);
  const shot = async name => { const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); if (r.result && r.result.data) { fs.writeFileSync(OUT + name, Buffer.from(r.result.data, 'base64')); console.log('saved', name); } };
  console.log('state2:', await evalJs(`(()=>({body:document.body.className,scrollH:document.documentElement.scrollHeight,app:document.querySelector('#app')?.innerHTML.slice(0,200)}))()`));
  await shot('ref2-01-hero.png');
  for (let i = 1; i <= 6; i++) {
    const f = i / 7;
    await evalJs(`(()=>{window.scrollTo(0,Math.max(1,document.documentElement.scrollHeight-innerHeight)*${f});return scrollY})()`);
    await sleep(2000);
    await shot(`ref2-${String(i + 1).padStart(2, '0')}-scroll.png`);
  }
  ws.close(); process.exit(0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
