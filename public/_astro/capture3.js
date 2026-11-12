const WebSocket = require('ws');
const fs = require('fs');
const http = require('http');
const OUT = 'D:/portfolio3d/_research/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
function getJSON(url) { return new Promise((resolve, reject) => { http.get(url, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } }); }).on('error', reject); }); }

(async () => {
  await getJSON('http://127.0.0.1:9222/json/version');
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
    else if (m.method === 'Runtime.exceptionThrown') console.log('EXCEPTION', ((m.params.exceptionDetails || {}).exception || {}).description?.slice(0, 400));
  });
  const send = (method, params = {}) => new Promise(resolve => { const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({ id: n, method, params })); });
  const evalJs = async expr => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.result && r.result.exceptionDetails) console.log('EVALERR', r.result.exceptionDetails.text, ((r.result.exceptionDetails.exception || {}).description || '').slice(0, 300)); return r.result && r.result.result ? r.result.result.value : null; };

  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{sessionStorage.setItem('render-tier','webgl')}catch(e){}` });
  await send('Page.navigate', { url: 'https://fojcikdominik.com/?webgl' });
  await sleep(14000);

  console.log('before force:', await evalJs(`document.body.className`));
  console.log('force store:', await evalJs(`(async()=>{try{const m=await import('/_astro/preloader.Dkw2cPz1.js');m.p.update({progress:1,isReady:true,isWarm:true,warmProgress:1,isGateOpen:false,isMotionPending:false});m.o();return 'ok '+Object.keys(m).join(',')+' state='+JSON.stringify(m.p.get())}catch(e){return 'ERR '+e.message}})()`));
  await sleep(3500);
  console.log('after store:', await evalJs(`(()=>({body:document.body.className,pre:document.querySelector('[data-preloader]')?.getAttributeNames().join(',')}))()`));
  await evalJs(`(()=>{const p=document.querySelector('[data-preloader]');if(p){p.setAttribute('hidden','');p.style.display='none'}const h=document.querySelector('[data-header]');if(h)h.setAttribute('data-ready','');document.body.classList.remove('is--loading');document.body.classList.add('is--carousel');document.body.setAttribute('data-scene','home');window.dispatchEvent(new Event('resize'));return document.body.className})()`);
  await sleep(3000);

  const shot = async name => { const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); if (r.result && r.result.data) { fs.writeFileSync(OUT + name, Buffer.from(r.result.data, 'base64')); console.log('saved', name); } };
  await shot('ref3-01-hero.png');
  console.log('info:', await evalJs(`(()=>({body:document.body.className,scrollH:document.documentElement.scrollHeight,scrollLen:document.querySelector('[data-scroll-length]')?.getAttribute('style'),canvas:document.querySelector('#app canvas')?.getAttribute('data-engine')}))()`));
  for (let i = 1; i <= 8; i++) {
    const f = i / 9;
    const y = await evalJs(`(()=>{const el=document.querySelector('[data-page-scroll]');const max=Math.max(1,el.scrollHeight-el.clientHeight);el.scrollTop=max*${f};el.dispatchEvent(new Event('scroll',{bubbles:true}));return {top:el.scrollTop,max,sh:el.scrollHeight,ch:el.clientHeight}})()`);
    await sleep(2200);
    await shot(`ref3-${String(i + 1).padStart(2, '0')}-scroll.png`);
    console.log('f', f, JSON.stringify(y));
  }
  ws.close(); process.exit(0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
