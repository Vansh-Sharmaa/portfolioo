const WebSocket = require('ws');
const fs = require('fs');
const http = require('http');

const OUT = 'D:/portfolio3d/_research/';
const sleep = ms => new Promise(r => setTimeout(r, ms));

function getJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

(async () => {
  let ver;
  for (let i = 0; i < 30; i++) {
    try { ver = await getJSON('http://127.0.0.1:9222/json/version'); break; }
    catch (e) { await sleep(400); }
  }
  if (!ver) throw new Error('chrome not up');
  const target = await new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port: 9222, path: '/json/new?https://fojcikdominik.com/', method: 'PUT' }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    });
    req.on('error', reject); req.end();
  });
  const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false });
  await new Promise(r => ws.on('open', r));
  let id = 0;
  const pending = new Map();
  ws.on('message', raw => {
    const m = JSON.parse(raw.toString());
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  });
  const send = (method, params = {}) => new Promise(resolve => {
    const n = ++id; pending.set(n, resolve);
    ws.send(JSON.stringify({ id: n, method, params }));
  });
  const evalJs = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return r.result && r.result.result ? r.result.result.value : null;
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  console.log('navigating...');
  await sleep(9000);
  console.log('preloader state:', await evalJs(`(()=>{const p=document.querySelector('[data-preloader]');return p?{attrs:[...p.attributes].map(a=>a.name+'='+a.value),dialog:getComputedStyle(p.querySelector('[role=dialog]')).visibility}:'none'})()`));

  // dismiss motion gate
  console.log('decline:', await evalJs(`(()=>{const b=document.querySelector('[data-motion-decline]');if(b){b.click();return 'clicked'}return 'no button'})()`));
  await sleep(6000);
  console.log('after gate:', await evalJs(`(()=>{const p=document.querySelector('[data-preloader]');return p?[...p.attributes].map(a=>a.name+'='+a.value):'gone'})()`));

  // force hide preloader if still around
  await evalJs(`(()=>{const p=document.querySelector('[data-preloader]');if(p){p.setAttribute('hidden','');p.style.display='none'}const h=document.querySelector('[data-header]');if(h)h.setAttribute('data-ready','');return document.body.className})()`);
  await sleep(2500);

  const shot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    if (r.result && r.result.data) { fs.writeFileSync(OUT + name, Buffer.from(r.result.data, 'base64')); console.log('saved', name); }
  };

  await shot('ref-01-hero.png');
  console.log('body:', await evalJs(`document.body.className + ' | scrollH=' + document.documentElement.scrollHeight + ' | stage=' + (document.querySelector('[data-stage]')?.className||'')`));

  // scroll through the experience
  const steps = [0.12, 0.25, 0.4, 0.55, 0.7, 0.85, 0.97];
  for (let i = 0; i < steps.length; i++) {
    await evalJs(`(async()=>{const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);window.scrollTo(0,max*${steps[i]});return window.scrollY})()`);
    await sleep(1800);
    await shot(`ref-${String(i + 2).padStart(2, '0')}-scroll.png`);
    console.log('step', steps[i], 'scrollY', await evalJs('window.scrollY'));
  }
  ws.close();
  process.exit(0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
