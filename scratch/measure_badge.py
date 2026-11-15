from PIL import Image, ImageDraw, ImageFont
import numpy as np

upright = Image.open('scratch/monitor_badge_upright.png')
arr = np.array(upright)

# The badge is in the polygon where the background is ~ [147, 145, 146]
# Let's find the text pixels: pixels that are significantly darker than background (e.g. brightness < 110)
# within the text area x in [220, 500], y in [75, 190]
dark_mask = (arr[:, :, 0] < 110) & (arr[:, :, 1] < 110) & (arr[:, :, 2] < 110)

# Globe is on the left
globe_mask = dark_mask[:, :240]
gy, gx = np.where(globe_mask)
print(f'Globe upright bounds: X in [{gx.min()}, {gx.max()}], Y in [{gy.min()}, {gy.max()}]')

# Text is on the right
text_mask = dark_mask[:, 240:]
ty, tx = np.where(text_mask)
tx = tx + 240
print(f'Text upright bounds: X in [{tx.min()}, {tx.max()}], Y in [{ty.min()}, {ty.max()}]')

# Height of Heffernan:
heff_mask = dark_mask[ty.min():135, 240:]
hy, hx = np.where(heff_mask)
print(f'Heffernan height: {hy.max() - hy.min() + 1} px')

# Height of henry inc:
henry_mask = dark_mask[135:ty.max()+1, 240:]
ny, nx = np.where(henry_mask)
print(f'henry inc height: {ny.max() - ny.min() + 1} px')

