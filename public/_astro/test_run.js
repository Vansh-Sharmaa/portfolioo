import http from 'http';
import fs from 'fs';
import { spawn } from 'child_process';
import WebSocket from 'ws';

const CDP = 9245;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PROFILE = 'D:/portfolio3d/_research/chrome-verify16';
const sleep = ms => new Promise(r => setTimeout(r, ms));

function getJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } }); }).on('error', reject);
  });
}

(async () => {
  const chrome = spawn(CHROME, [
    '--headless=new', '--no-sandbox', '--disable-gpu-sandbox',
    '--use-gl=angle', '--no-proxy-server',
    '--remote-debugging-port=' + CDP, '--user-data-dir=' + PROFILE,
    '--window-size=1440,900', 'about:blank'
  ], { stdio: 'ignore' });

  let ver = null;
  for (let i = 0; i < 30; i++) { try { ver = await getJSON(`http://127.0.0.1:${CDP}/json/version`); break; } catch (e) { await sleep(300); } }
  if (!ver) throw new Error('chrome failed to start');
  console.log('Chrome started:', ver.Browser);

  const target = await new Promise((resolve, reject) => {
    const q = http.request({ hostname: '127.0.0.1', port: CDP, path: '/json/new?about:blank', method: 'PUT' }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } }); });
    q.on('error', reject); q.end();
  });
  const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false });
  await new Promise(r => ws.on('open', r));
  let id = 0; const pending = new Map(); const consoleErrs = [];
  ws.on('message', raw => {
    const m = JSON.parse(raw.toString());
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
    if (m.method === 'Runtime.exceptionThrown') consoleErrs.push('EXC ' + ((m.params.exceptionDetails.exception || {}).description || m.params.exceptionDetails.text || '').slice(0, 300));
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') consoleErrs.push('CONSOLE ' + (m.params.args || []).map(a => a.value || a.description).join(' ').slice(0, 300));
  });
  const s = (method, params = {}) => new Promise(resolve => { const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({ id: n, method, params })); });
  const ev = async expr => {
    const r = await s('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return r.result && r.result.result ? r.result.result.value : null;
  };

  await s('Page.enable'); await s('Runtime.enable');
  await s('Page.navigate', { url: 'http://127.0.0.1:5190/?webgl' });
  await sleep(4000);

  console.log('Page title:', await ev('document.title'));
  console.log('Body class:', await ev('document.body.className'));
  console.log('Canvas found:', await ev(`(()=>({canvas:document.querySelector('canvas')?true:false, appHtml:document.querySelector('#app')?.innerHTML.slice(0, 200)}))()`));
  console.log('Console errors:', consoleErrs);

  const r = await s('Page.captureScreenshot', { format: 'png' });
  if (r.result && r.result.data) {
    fs.writeFileSync('D:/portfolio3d/_research/verify_fojcik_local.png', Buffer.from(r.result.data, 'base64'));
    console.log('Screenshot saved to _research/verify_fojcik_local.png');
  }

  ws.close();
  chrome.kill();
  process.exit(0);
})().catch(e => { console.error('Error:', e); process.exit(1); });
