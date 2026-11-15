from PIL import Image, ImageDraw, ImageFont
import numpy as np

# Load original texture
orig = Image.open('scratch/orig_baked_computer.jpg')

# In crop (1200, 2550, 1800, 2820):
# Width = 600, Height = 270
# Let's inspect the bounding box of the text in the upright orientation first!
upright = Image.open('scratch/monitor_badge_upright.png')
# In upright:
# The globe icon is roughly at x=150..225, y=85..160
# The text "Heffernan" is at x=240..460, y=85..135
# The text "henry inc" is at x=235..360, y=140..170

# Since upright = crop.rotate(180):
# A point (ux, uy) in upright corresponds to (w - 1 - ux, h - 1 - uy) in crop!
# And in orig, that's x = 1200 + (w - 1 - ux), y = 2550 + (h - 1 - uy)

w, h = upright.size
print('Upright size:', w, h)

# Let's verify text color and background color in upright
upright_np = np.array(upright)
# Background around text:
bg_sample = upright_np[100:150, 480:550] # clean gray to the right of text
bg_mean = bg_sample.mean(axis=(0,1))
print('Background color around text:', bg_mean)

# Text color:
text_sample = upright_np[95:130, 250:400]
text_min = text_sample.min(axis=(0,1))
print('Text color (darkest):', text_min)

