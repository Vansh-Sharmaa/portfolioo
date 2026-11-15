from PIL import Image
import os

# Load the smooth upright badge
upright_badge = Image.open('scratch/test_monitor_badge_smooth.png')
# Rotate 180 to match texture orientation
raw_badge = upright_badge.rotate(180)

# The crop was (1200, 2550, 1800, 2820)
paste_box = (1200, 2550)

# All baked_computer.jpg paths in repo:
paths = [
    'public/models/Computer/baked_computer.jpg',
    'public/os/models/Computer/baked_computer.jpg',
    'public/room/baked_computer.jpg',
    '_henry/static/models/Computer/baked_computer.jpg',
    '_henry/public/models/Computer/baked_computer.jpg'
]

for p in paths:
    if os.path.exists(p):
        im = Image.open(p)
        im.paste(raw_badge, paste_box)
        im.save(p, quality=98)
        print('Successfully patched monitor bezel badge in:', p)

print('All textures patched!')

