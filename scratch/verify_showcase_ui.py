import asyncio
import json
import base64
import urllib.request
import subprocess
import time
import websockets

async def main():
    print("Testing Retro OS directly at /os/index.html...")
    proc = subprocess.Popen([
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        "--headless=new",
        "--remote-debugging-port=9229",
        "--window-size=1280,1024",
        "--disable-gpu-sandbox",
        "http://127.0.0.1:5173/os/index.html"
    ])

    time.sleep(3)

    req = urllib.request.urlopen("http://127.0.0.1:9229/json")
    targets = json.loads(req.read().decode())
    page = next(t for t in targets if t.get('type') == 'page')
    ws_url = page['webSocketDebuggerUrl']

    async with websockets.connect(ws_url, max_size=25*1024*1024) as ws:
        msg_id = 1
        async def call(method, params=None):
            nonlocal msg_id
            cid = msg_id
            msg_id += 1
            payload = {"id": cid, "method": method, "params": params or {}}
            await ws.send(json.dumps(payload))
            while True:
                resp = json.loads(await ws.recv())
                if resp.get("id") == cid:
                    return resp.get("result", {})

        await call("Page.enable")
        await call("Runtime.enable")

        print("Waiting 4s for Retro OS to load...")
        await asyncio.sleep(4)

        # Screenshot Retro OS desktop
        shot1 = await call("Page.captureScreenshot", {"format": "png"})
        with open(r"C:\Users\XALTA\.gemini\antigravity\brain\0080564b-e9c5-4ea5-a5fe-4fc1bbf6ede0\retro_os_desktop.png", "wb") as f:
            f.write(base64.b64decode(shot1['data']))
        print("Saved retro_os_desktop.png")

        # Open Software projects inside Showcase
        await call("Runtime.evaluate", {
            "expression": """
              const links = Array.from(document.querySelectorAll('a, button, div'));
              const swLink = links.find(el => el.textContent && el.textContent.includes('Software') && el.textContent.includes('PROJECTS'));
              if (swLink) swLink.click();
              else {
                const navLinks = Array.from(document.querySelectorAll('a, div'));
                const sw = navLinks.find(el => el.textContent && el.textContent.trim() === 'SOFTWARE');
                if (sw) sw.click();
              }
            """
        })
        await asyncio.sleep(2)

        shot2 = await call("Page.captureScreenshot", {"format": "png"})
        with open(r"C:\Users\XALTA\.gemini\antigravity\brain\0080564b-e9c5-4ea5-a5fe-4fc1bbf6ede0\retro_os_software_projects.png", "wb") as f:
            f.write(base64.b64decode(shot2['data']))
        print("Saved retro_os_software_projects.png")

        # Click Experience tab
        await call("Runtime.evaluate", {
            "expression": """
              const navItems = Array.from(document.querySelectorAll('*'));
              const exp = navItems.find(el => el.textContent && el.textContent.trim() === 'EXPERIENCE');
              if (exp) exp.click();
            """
        })
        await asyncio.sleep(2)

        shot3 = await call("Page.captureScreenshot", {"format": "png"})
        with open(r"C:\Users\XALTA\.gemini\antigravity\brain\0080564b-e9c5-4ea5-a5fe-4fc1bbf6ede0\retro_os_experience.png", "wb") as f:
            f.write(base64.b64decode(shot3['data']))
        print("Saved retro_os_experience.png")

    proc.kill()
    print("Done testing Retro OS Showcase!")

if __name__ == "__main__":
    asyncio.run(main())
