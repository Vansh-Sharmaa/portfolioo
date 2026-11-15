from PIL import Image, ImageDraw, ImageFont
import numpy as np

# Load upright image
upright = Image.open('scratch/monitor_badge_upright.png')
w, h = upright.size

# Clean the text area x in [234, 470], y in [85, 175] by filling with vertical gradient matching column at x=480
arr = np.array(upright)
for y in range(85, 175):
    color = arr[y, 480].copy()
    arr[y, 234:475] = color

cleaned = Image.fromarray(arr)
draw = ImageDraw.Draw(cleaned)

# Try loading Arial fonts
try:
    font_bold_italic = ImageFont.truetype('C:/Windows/Fonts/arialbi.ttf', 38)
    font_italic = ImageFont.truetype('C:/Windows/Fonts/ariali.ttf', 24)
except Exception as e:
    print('Font load error:', e)
    font_bold_italic = ImageFont.load_default()
    font_italic = ImageFont.load_default()

# Text color from original "Heffernan":
text_color = (48, 48, 48)

# Draw "Vansh"
draw.text((240, 93), "Vansh", fill=text_color, font=font_bold_italic)
# Draw "sharma inc"
draw.text((238, 137), "sharma inc", fill=text_color, font=font_italic)

cleaned.save('scratch/test_monitor_badge_new.png')
cleaned.save(r'C:\Users\XALTA\.gemini\antigravity\brain\0080564b-e9c5-4ea5-a5fe-4fc1bbf6ede0\test_monitor_badge_new.png')
print('New badge generated and saved!')

