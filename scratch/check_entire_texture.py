import cv2
from PIL import Image
import numpy as np

# Let's inspect the entire baked_computer.jpg from public/models/Computer/baked_computer.jpg
im = Image.open('public/models/Computer/baked_computer.jpg')
print('Image format:', im.format, 'size:', im.size)

# Let's check git status of this file or git diff or git log!
# How did git track baked_computer.jpg?

