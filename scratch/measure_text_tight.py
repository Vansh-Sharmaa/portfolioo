from PIL import Image
import numpy as np

upright = Image.open('scratch/monitor_badge_upright.png')
arr = np.array(upright)

# Restrict to middle of badge polygon: y in [70, 180], x in [140, 500]
sub = arr[70:180, 140:500]
dark = (sub[:, :, 0] < 110) & (sub[:, :, 1] < 110) & (sub[:, :, 2] < 110)

# Globe is x in [140, 235] -> sub x in [0, 95]
gy, gx = np.where(dark[:, :95])
print(f'Globe in sub: X in [{gx.min() + 140}, {gx.max() + 140}], Y in [{gy.min() + 70}, {gy.max() + 70}]')

# Text is sub x in [95, 360] -> x in [235, 500]
ty, tx = np.where(dark[:, 95:])
tx += 235
ty += 70
print(f'Text in upright: X in [{tx.min()}, {tx.max()}], Y in [{ty.min()}, {ty.max()}]')

# Let's crop just the text
text_crop = upright.crop((tx.min()-10, ty.min()-10, tx.max()+10, ty.max()+10))
text_crop.save('scratch/just_text.png')
print('Text dimensions:', tx.max() - tx.min() + 1, ty.max() - ty.min() + 1)

