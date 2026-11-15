import cv2
from PIL import Image
import numpy as np

# Load the original image
orig = Image.open('scratch/orig_baked_computer.jpg')
orig_np = np.array(orig)

# Template: the globe icon or Heffernan text from the computer badge
template = orig_np[1920:1970, 2265:2310] # globe icon
cv2.imwrite('scratch/globe_template.png', cv2.cvtColor(template, cv2.COLOR_RGB2BGR))

# Let's run cv2.matchTemplate across the entire 4096x4096 image to find ALL occurrences of the globe icon!
gray_orig = cv2.cvtColor(orig_np, cv2.COLOR_RGB2GRAY)
gray_tpl = cv2.cvtColor(template, cv2.COLOR_RGB2GRAY)

res = cv2.matchTemplate(gray_orig, gray_tpl, cv2.TM_CCOEFF_NORMED)
threshold = 0.7
loc = np.where(res >= threshold)

found_pts = []
for pt in zip(*loc[::-1]):
    # Non-max suppression / cluster
    if not any(abs(pt[0]-p[0]) < 50 and abs(pt[1]-p[1]) < 50 for p in found_pts):
        found_pts.append(pt)
        print(f'Match found at X={pt[0]}, Y={pt[1]}, score={res[pt[1], pt[0]]:.3f}')

# Let's crop around all found locations and inspect
for i, pt in enumerate(found_pts):
    x, y = pt
    crop = orig.crop((max(0, x-10), max(0, y-10), min(4096, x+160), min(4096, y+70)))
    fname = f'scratch/found_badge_{i}_{x}_{y}.png'
    crop.save(fname)
    print(f'Saved {fname}')

