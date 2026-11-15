from PIL import Image, ImageDraw, ImageFont
import numpy as np

upright = Image.open('scratch/monitor_badge_upright.png')
arr = np.array(upright).astype(np.float32)

# Find dark pixels of the original text:
# x in [235, 465], y in [85, 175]
# Original background is roughly ~ 146
# Any pixel with luminance < 120 is text
orig_gray = np.mean(arr, axis=2)

text_mask = np.zeros(arr.shape[:2], dtype=bool)
text_mask[85:175, 235:465] = orig_gray[85:175, 235:465] < 125

# Dilate mask by 3 pixels to cover anti-aliasing edges
from scipy.ndimage import binary_dilation
text_mask = binary_dilation(text_mask, iterations=3)

# For each row y in [85, 175], compute background color from clean pixels to the right (x in [470, 520])
# and smoothly interpolate from x=235 (near globe) to x=470
for y in range(85, 175):
    left_bg = arr[y, 230]
    right_bg = arr[y, 480]
    # Replace masked pixels on row y with interpolated background
    for x in range(235, 470):
        if text_mask[y, x]:
            t = (x - 230) / (480 - 230)
            arr[y, x] = (1 - t) * left_bg + t * right_bg

# Convert back to uint8 image
cleaned = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
draw = ImageDraw.Draw(cleaned)

font_bold_italic = ImageFont.truetype('C:/Windows/Fonts/arialbi.ttf', 38)
font_italic = ImageFont.truetype('C:/Windows/Fonts/ariali.ttf', 24)

# Text color matching original globe/text
text_color = (48, 48, 48)

# Draw "Vansh"
draw.text((240, 93), "Vansh", fill=text_color, font=font_bold_italic)
# Draw "sharma inc"
draw.text((238, 137), "sharma inc", fill=text_color, font=font_italic)

cleaned.save('scratch/test_monitor_badge_smooth.png')
cleaned.save(r'C:\Users\XALTA\.gemini\antigravity\brain\0080564b-e9c5-4ea5-a5fe-4fc1bbf6ede0\test_monitor_badge_smooth.png')
print('Smooth badge created!')

