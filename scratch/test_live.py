import asyncio
import json
import base64
import urllib.request
import subprocess
import time

async def main():
    print("Starting Chrome...")
    proc = subprocess.Popen([
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        "--headless=new",
        "--remote-debugging-port=9228",
        "--window-size=1600,1000",
        "--disable-gpu-sandbox",
        "http://127.0.0.1:5173/?debug"
    ])

    time.sleep(3)

    req = urllib.request.urlopen("http://127.0.0.1:9228/json")
    targets = json.loads(req.read().decode())
    page = next(t for t in targets if t.get('type') == 'page')
    ws_url = page['webSocketDebuggerUrl']
    print("Page WS URL:", ws_url)

    import websockets
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

        print("Waiting 4s for assets to load...")
        await asyncio.sleep(4)

        # Check camera and application state
        app_state = await call("Runtime.evaluate", {
            "expression": "({ hasApp: !!window.application, camera: window.application?.camera?.currentKeyframe, iframeSrc: document.querySelector('iframe')?.src })",
            "returnByValue": True
        })
        print("App state:", app_state.get('result', {}).get('value'))

        # Take desk view screenshot
        shot1 = await call("Page.captureScreenshot", {"format": "png"})
        with open(r"C:\Users\XALTA\.gemini\antigravity\brain\0080564b-e9c5-4ea5-a5fe-4fc1bbf6ede0\live_test_desk.png", "wb") as f:
            f.write(base64.b64decode(shot1['data']))
        print("Saved live_test_desk.png")

        # Zoom into monitor
        print("Zooming into monitor...")
        await call("Runtime.evaluate", {
            "expression": "window.application.camera.trigger('enterMonitor')"
        })
        await asyncio.sleep(3)

        # Check state
        app_state2 = await call("Runtime.evaluate", {
            "expression": "({ camera: window.application?.camera?.currentKeyframe, iframeSrc: document.querySelector('iframe')?.src })",
            "returnByValue": True
        })
        print("Zoomed state:", app_state2.get('result', {}).get('value'))

        shot2 = await call("Page.captureScreenshot", {"format": "png"})
        with open(r"C:\Users\XALTA\.gemini\antigravity\brain\0080564b-e9c5-4ea5-a5fe-4fc1bbf6ede0\live_test_monitor_cylinder.png", "wb") as f:
            f.write(base64.b64decode(shot2['data']))
        print("Saved live_test_monitor_cylinder.png")

        # Send toggleOS
        print("Triggering toggleOS...")
        await call("Runtime.evaluate", {
            "expression": "window.postMessage({ type: 'toggleOS' }, '*')"
        })
        await asyncio.sleep(3)

        app_state3 = await call("Runtime.evaluate", {
            "expression": "({ camera: window.application?.camera?.currentKeyframe, iframeSrc: document.querySelector('iframe')?.src })",
            "returnByValue": True
        })
        print("After 1st toggleOS state:", app_state3.get('result', {}).get('value'))

        shot3 = await call("Page.captureScreenshot", {"format": "png"})
        with open(r"C:\Users\XALTA\.gemini\antigravity\brain\0080564b-e9c5-4ea5-a5fe-4fc1bbf6ede0\live_test_monitor_retro_os.png", "wb") as f:
            f.write(base64.b64decode(shot3['data']))
        print("Saved live_test_monitor_retro_os.png")

        # Send toggleOS again
        print("Triggering second toggleOS...")
        await call("Runtime.evaluate", {
            "expression": "window.postMessage({ type: 'toggleOS' }, '*')"
        })
        await asyncio.sleep(3)

        app_state4 = await call("Runtime.evaluate", {
            "expression": "({ camera: window.application?.camera?.currentKeyframe, iframeSrc: document.querySelector('iframe')?.src })",
            "returnByValue": True
        })
        print("After 2nd toggleOS state:", app_state4.get('result', {}).get('value'))

        shot4 = await call("Page.captureScreenshot", {"format": "png"})
        with open(r"C:\Users\XALTA\.gemini\antigravity\brain\0080564b-e9c5-4ea5-a5fe-4fc1bbf6ede0\live_test_monitor_returned_cylinder.png", "wb") as f:
            f.write(base64.b64decode(shot4['data']))
        print("Saved live_test_monitor_returned_cylinder.png")

    proc.kill()
    print("Live test completed successfully!")

if __name__ == "__main__":
    asyncio.run(main())
