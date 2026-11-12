/* Self-contained visual + behaviour audit: in-process server + fresh headless Chrome over CDP */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');

const ROOT = 'D:/portfolio3d';
const OUT = 'D:/portfolio3d/_research/verify';
const PORT = 5173, CDP = 9237;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PROFILE = 'D:/portfolio3d/_research/chrome-verify15';
const sleep = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const base = path.resolve(ROOT);
  const f = path.resolve(base, '.' + p);
  if (!f.toLowerCase().startsWith(base.toLowerCase()) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store, no-cache, must-revalidate' });
  fs.createReadStream(f).pipe(res);
});

function getJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } }); }).on('error', reject);
  });
}

(async () => {
  await new Promise(r => server.listen(PORT, '127.0.0.1', r));
  console.log('server up on', PORT);

  const chrome = spawn(CHROME, [
    '--headless=new', '--no-sandbox', '--disable-gpu-sandbox', '--enable-unsafe-swiftshader',
    '--use-gl=angle', '--use-angle=swiftshader', '--no-proxy-server', '--proxy-bypass-list=<-loopback>',
    '--remote-debugging-port=' + CDP, '--user-data-dir=' + PROFILE,
    '--window-size=1440,900', '--hide-scrollbars', 'about:blank'
  ], { stdio: 'ignore' });

  let ver = null;
  for (let i = 0; i < 40; i++) { try { ver = await getJSON(`http://127.0.0.1:${CDP}/json/version`); break; } catch (e) { await sleep(300); } }
  if (!ver) throw new Error('chrome did not start');
  console.log('chrome', ver.Browser);

  const target = await new Promise((resolve, reject) => {
    const q = http.request({ hostname: '127.0.0.1', port: CDP, path: '/json/new?about:blank', method: 'PUT' }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } }); });
    q.on('error', reject); q.end();
  });
  const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false });
  await new Promise(r => ws.on('open', r));
  let id = 0; const pending = new Map(); const consoleErrs = [], netFails = [];
  ws.on('message', raw => {
    const m = JSON.parse(raw.toString());
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
    if (m.method === 'Runtime.exceptionThrown') consoleErrs.push('EXC ' + ((m.params.exceptionDetails.exception || {}).description || m.params.exceptionDetails.text || '').slice(0, 300));
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') consoleErrs.push('CONSOLE ' + (m.params.args || []).map(a => a.value || a.description).join(' ').slice(0, 300));
    if (m.method === 'Network.loadingFailed') netFails.push(m.params.errorText + ' ' + m.params.type);
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') consoleErrs.push('LOG ' + m.params.entry.text.slice(0, 200));
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
    const box = await ev(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    if (!box) { console.log('  realClick: no element', selector); return false; }
    await s('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 });
    await s('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 });
    return true;
  };

  await s('Page.enable'); await s('Runtime.enable'); await s('Network.enable'); await s('Log.enable');
  await s('Page.addScriptToEvaluateOnNewDocument', {
    source: `window.__errs=[];addEventListener('error',e=>window.__errs.push(String(e.message||e.error)));addEventListener('unhandledrejection',e=>window.__errs.push(String(e.reason)));`
  });
  await s('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  console.log('navigate...');
  await s('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  const t0 = Date.now();
  while (Date.now() - t0 < 20000) {
    const st = await ev('document.readyState');
    if (st === 'complete') break;
    await sleep(200);
  }
  await sleep(1800);
  console.log('post-load state:', await ev(`(()=>({ready:document.readyState,body:document.body.className,html:document.documentElement.className,fonts:document.fonts.check('700 40px Silkscreen')&&document.fonts.check('600 20px Doto'),gate:document.querySelector('#gate').className,trackH:document.querySelector('#track').offsetHeight,maxScroll:document.documentElement.scrollHeight-innerHeight}))()`));

  // Dismiss the motion gate with REAL input. The gate can be .is-open while the
  // preloader is still painted on top, so poll for actual hit-testability instead
  // of trusting the class, then retry until the loading state has really cleared.
  let dismissed = false, gateTop = null;
  for (let attempt = 0; attempt < 40; attempt++) {
    gateTop = await ev(`(()=>{const b=document.querySelector('[data-motion="off"]');if(!b)return 'no-button';const r=b.getBoundingClientRect();if(r.width<2)return 'no-box';const e=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return (e===b||b.contains(e))?'ok':(e?(e.id||e.className||e.tagName):'none')})()`);
    if (gateTop === 'ok') {
      await realClick('[data-motion="off"]');
      for (let j = 0; j < 12; j++) {
        if (!(await ev(`document.body.classList.contains('is-loading')`))) { dismissed = true; break; }
        await sleep(250);
      }
      if (dismissed) break;
    }
    await sleep(300);
  }
  console.log('gate hit-test:', gateTop, '| dismissed:', dismissed);
  await sleep(380);
  console.log('WAAPI mid-entrance:', await ev(`(()=>({active:document.getAnimations().length,kinds:[...new Set(document.getAnimations().map(a=>a.constructor.name))]}))()`));
  await sleep(1400); // let the staggered WAAPI hero entrance settle before screenshots
  console.log('after dismiss:', await ev(`(()=>({body:document.body.className,pre:document.querySelector('#preloader').className,phase:document.body.dataset.phase,grid:document.querySelector('#gridCanvas').style.opacity}))()`));

  // canvas pixel readback
  console.log('canvas readback:', await ev(`(()=>{const c=document.querySelector('#gridCanvas');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let lit=0;for(let i=0;i<d.length;i+=4){if(d[i]+d[i+1]+d[i+2]>40)lit++}return{w:c.width,h:c.height,lit,ratio:(lit/(d.length/4)).toFixed(3)}})()`));

  await shot('01-hero.png');
  console.log('hero copy metrics:', await ev(`(()=>{const e=document.querySelector('.hero__right p');const r=e.getBoundingClientRect();return{w:Math.round(r.width),h:Math.round(r.height),font:getComputedStyle(e).fontSize,text:e.textContent}})()`));
  const stops = [
    ['02-work-A.png', .195], ['03-work-B.png', .34], ['04-about.png', .565],
    ['05-capabilities.png', .720], ['06-contact.png', .94], ['07-end.png', 1]
  ];
  for (const [name, f] of stops) {
    await ev(`(()=>{document.documentElement.style.scrollBehavior='auto';const m=document.documentElement.scrollHeight-innerHeight;window.scrollTo(0,m*${f});return scrollY})()`);
    await sleep(1900);
    console.log('  at', f, await ev(`(()=>({y:scrollY,phase:document.body.dataset.phase,hud:document.querySelector('#hudSection').textContent,card:document.querySelector('#cardCurrent').textContent,workOp:document.querySelector('.scene--work').style.opacity}))()`));
    await shot(name);
    if (name === '02-work-A.png') {
      console.log('work title metrics:', await ev(`(()=>{const e=document.querySelector('.work__title'),s=document.querySelector('.work__side'),cs=getComputedStyle(e),r=e.getBoundingClientRect();return{whiteSpace:cs.whiteSpace,fontSize:cs.fontSize,text:e.textContent,elW:Math.round(r.width),elH:Math.round(r.height),scrollW:e.scrollWidth,sideW:Math.round(s.getBoundingClientRect().width),font:cs.fontFamily}})()`));
    }
  }

  // menu: real input, every exit path
  await ev(`window.scrollTo(0,0)`); await sleep(900);
  await realClick('#menuToggle'); await sleep(900);
  console.log('menu opened:', await ev(`(()=>({aria:document.querySelector('#menuToggle').getAttribute('aria-expanded'),hidden:document.querySelector('#menu').getAttribute('aria-hidden'),body:document.body.className,label:document.querySelector('#menuLabel').textContent}))()`));
  await shot('08-menu.png');
  await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`); await sleep(700);
  console.log('menu after Escape:', await ev(`(()=>({aria:document.querySelector('#menuToggle').getAttribute('aria-expanded'),body:document.body.className}))()`));
  await sleep(800); // let the Escape close transition finish before reopening
  await realClick('#menuToggle'); await sleep(950);
  const linkSel = '.menu__item[data-target="contact"]';
  let linkReady = false;
  for (let i = 0; i < 25; i++) {
    linkReady = await ev(`(()=>{const b=document.querySelector(${JSON.stringify(linkSel)});if(!b)return false;const r=b.getBoundingClientRect();if(r.width<2)return false;const e=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e===b||b.contains(e)})()`);
    if (linkReady) break;
    await sleep(200);
  }
  console.log('menu link hit-test:', linkReady, '| menu:', await ev(`document.querySelector('#menuToggle').getAttribute('aria-expanded')`));
  await realClick(linkSel); await sleep(2400);
  let jump = await ev(`(()=>({aria:document.querySelector('#menuToggle').getAttribute('aria-expanded'),y:Math.round(scrollY),max:document.documentElement.scrollHeight-innerHeight}))()`);
  if (jump.aria === 'true' && jump.y === 0) { // retry once if the transition swallowed the click
    await sleep(700); await realClick(linkSel); await sleep(2400);
    jump = await ev(`(()=>({aria:document.querySelector('#menuToggle').getAttribute('aria-expanded'),y:Math.round(scrollY),max:document.documentElement.scrollHeight-innerHeight}))()`);
  }
  console.log('menu link jumped:', jump);

  console.log('console errors:', consoleErrs);
  console.log('page errors:', await ev('window.__errs'));
  console.log('network failures:', netFails);
  console.log('tunnel readback:', await ev(`(()=>{const c=document.querySelector('#tunnelCanvas');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let lit=0;for(let i=0;i<d.length;i+=4){if(d[i]+d[i+1]+d[i+2]>40)lit++}return{w:c.width,h:c.height,lit}})()`));

  // mobile sweep
  await s('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await sleep(1200);
  await ev(`window.scrollTo(0,0)`); await sleep(1200);
  await shot('09-mobile-hero.png');
  await ev(`(()=>{const m=document.documentElement.scrollHeight-innerHeight;window.scrollTo(0,m*.195)})()`); await sleep(1600);
  await shot('10-mobile-work.png');
  console.log('mobile fit:', await ev(`(()=>({docW:document.documentElement.scrollWidth,winW:innerWidth,scrollH:document.documentElement.scrollHeight,overflowX:document.documentElement.scrollWidth>innerWidth}))()`));

  // short-viewport fit sweep
  for (const [w, h] of [[1024, 768], [768, 1024], [1920, 1080], [1440, 700]]) {
    await s('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    await sleep(700);
    console.log(`fit ${w}x${h}:`, await ev(`(()=>({overflowX:document.documentElement.scrollWidth>innerWidth,scrollH:document.documentElement.scrollHeight,heroNameW:Math.round(document.querySelector('.hero__name').getBoundingClientRect().width),heroLeftW:Math.round(document.querySelector('.hero__left').getBoundingClientRect().width)}))()`));
  }

  ws.close(); chrome.kill(); server.close();
  console.log('DONE');
  process.exit(0);
})().catch(e => { console.error('FATAL', e); try { server.close(); } catch (_) {} process.exit(1); });
