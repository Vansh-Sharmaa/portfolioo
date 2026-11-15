from PIL import Image
import numpy as np

orig = Image.open('scratch/orig_baked_computer.jpg').convert('L')
orig_np = np.array(orig, dtype=np.float32)

# Globe template from (2265, 1920) to (2305, 1970)
tpl = orig_np[1920:1970, 2265:2305]
tpl = tpl - tpl.mean()
tpl_norm = np.linalg.norm(tpl)

print('Template shape:', tpl.shape, 'norm:', tpl_norm)

# Search using 2D cross correlation via FFT or block scan
# Since image is 4096x4096, scipy.signal.fftconvolve or numpy fft2
from scipy.signal import correlate2d

# Or with FFT:
import numpy.fft as fft

th, tw = tpl.shape
H, W = orig_np.shape

# Normalized cross correlation via FFT
pad_h = H + th - 1
pad_w = W + tw - 1

# Let's do simple search over blocks or scipy if available
try:
    from scipy.signal import fftconvolve
    conv = fftconvolve(orig_np, tpl[::-1, ::-1], mode='same')
    # find top peaks
    flat_indices = np.argsort(conv.ravel())[::-1]
    peaks = []
    for idx in flat_indices[:50]:
        y = idx // W
        x = idx % W
        if not any(abs(x - px) < 60 and abs(y - py) < 60 for px, py in peaks):
            peaks.append((x, y))
            if len(peaks) >= 5: break
    for i, (x, y) in enumerate(peaks):
        print(f'Peak {i}: x={x}, y={y}')
        crop = Image.open('scratch/orig_baked_computer.jpg').crop((x-40, y-40, x+150, y+40))
        crop.save(f'scratch/peak_{i}_{x}_{y}.png')
except Exception as e:
    print('Scipy error:', e)

