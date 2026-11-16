with open('public/portfolio/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

buttons = '''
<div style="position:fixed; top:18px; right:20px; z-index:999999; display:flex; gap:10px; align-items:center;">
  <button id="retro-os-toggle-btn" onclick="window.toggleOS()" style="background:#000080; color:#00ffcc; border:2px outset #ffffff; padding:8px 14px; font-family:monospace; font-size:12px; font-weight:bold; cursor:pointer; text-transform:uppercase; letter-spacing:1px; display:flex; align-items:center; gap:6px; box-shadow:2px 2px 0px #000;">
    <span>🖥️</span> <span>SWITCH TO RETRO OS</span>
  </button>
  <button id="exit-desk-btn" onclick="window.returnToDesk()" style="background:#222; color:#fff; border:2px outset #ffffff; padding:8px 14px; font-family:monospace; font-size:12px; font-weight:bold; cursor:pointer; text-transform:uppercase; letter-spacing:1px; display:flex; align-items:center; gap:6px; box-shadow:2px 2px 0px #000;">
    <span>✕</span> <span>EXIT TO DESK</span>
  </button>
</div>
'''

if 'retro-os-toggle-btn' not in text:
    text = text.replace('</body>', buttons + '\n</body>')
    with open('public/portfolio/index.html', 'w', encoding='utf-8') as f:
        f.write(text)
    print('Buttons inserted into public/portfolio/index.html!')
else:
    print('Already present!')

