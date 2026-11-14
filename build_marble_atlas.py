import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
from scipy.ndimage import gaussian_filter, sobel

# 1. Load clean cropped marble bust
img = Image.open('d:/portfolio3d/marble_bust_crop.jpg').convert('RGB')
img_151 = img.resize((151, 151), Image.Resampling.LANCZOS)

# Enhance contrast and micro-sharpness for crystalline marble stone texture
enhancer = ImageEnhance.Contrast(img_151)
img_contrast = enhancer.enhance(1.22)
enhancer_sharp = ImageEnhance.Sharpness(img_contrast)
img_sharp = enhancer_sharp.enhance(1.4)
color_arr = np.array(img_sharp, dtype=np.float32)

r, g, b = color_arr[:,:,0], color_arr[:,:,1], color_arr[:,:,2]
lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0

y_idx, x_idx = np.mgrid[0:151, 0:151]

# 2. Precise Statue Masking
statue_mask = (lum > 0.04)
# Clean up any stray background noise
clean_mask = Image.fromarray((statue_mask.astype(np.uint8) * 255), mode='L')
clean_mask = clean_mask.filter(ImageFilter.MedianFilter(size=3))
statue_mask = np.array(clean_mask) > 100

# 3. Frequency Decomposition for Marble Chisel & Curl Relief
# Fine band: individual curly hair spirals, chisel marks, eyelid ridges
dog_fine = gaussian_filter(lum, sigma=0.6) - gaussian_filter(lum, sigma=1.8)
# Mid band: nasal bridge, cheekbones, brow ridge, philtrum, ear helix
dog_mid  = gaussian_filter(lum, sigma=1.8) - gaussian_filter(lum, sigma=5.5)

# 4. Anatomical 3D Classical Depth Synthesis
cx, cy = 80.0, 58.0  # Center of David's head
head_dist = np.sqrt(((x_idx - cx) / 44.0)**2 + ((y_idx - cy) / 44.0)**2)
head_sphere = np.clip(1.0 - head_dist**1.7, 0.0, 1.0)

depth = np.zeros((151, 151), dtype=np.float32)
# Base spherical head mass
depth[statue_mask] = 0.58 + 0.24 * head_sphere[statue_mask]

# Photometric shape-from-shading:
# Since David is lit from top-left, the illuminated side and facial planes have natural depth
depth[statue_mask] += np.clip(lum[statue_mask] * 0.20, 0.0, 0.20)

# Facial Landmarks:
# Nose bridge and tip (facing right around x=105, y=68)
nose_center = (104.0, 68.0)
nose_dist = np.sqrt(((x_idx - nose_center[0]) / 8.0)**2 + ((y_idx - nose_center[1]) / 12.0)**2)
depth += np.exp(-nose_dist**2) * 0.15

# Chin protrusion (around x=98, y=86)
chin_center = (98.0, 86.0)
chin_dist = np.sqrt(((x_idx - chin_center[0]) / 12.0)**2 + ((y_idx - chin_center[1]) / 10.0)**2)
depth += np.exp(-chin_dist**2) * 0.12

# Brow ridge (around x=95, y=52)
brow_center = (96.0, 52.0)
brow_dist = np.sqrt(((x_idx - brow_center[0]) / 18.0)**2 + ((y_idx - brow_center[1]) / 7.0)**2)
depth += np.exp(-brow_dist**2) * 0.09

# Eye socket recession (around x=92, y=56)
eye_center = (94.0, 57.0)
eye_dist = np.sqrt(((x_idx - eye_center[0]) / 9.0)**2 + ((y_idx - eye_center[1]) / 6.0)**2)
depth -= np.exp(-eye_dist**2) * 0.08

# Lips (around x=100, y=78)
mouth_center = (100.0, 78.0)
mouth_dist = np.sqrt(((x_idx - mouth_center[0]) / 10.0)**2 + ((y_idx - mouth_center[1]) / 5.0)**2)
depth += np.exp(-mouth_dist**2) * 0.07

# Ear helix and lobe (around x=58, y=60)
ear_center = (58.0, 60.0)
ear_dist = np.sqrt(((x_idx - ear_center[0]) / 8.0)**2 + ((y_idx - ear_center[1]) / 12.0)**2)
depth += np.exp(-ear_dist**2) * 0.06

# Muscular neck cylinder & sternocleidomastoid
neck_mask = statue_mask & (y_idx >= 88) & (y_idx <= 135)
neck_gradient = 0.82 - (y_idx - 88.0) / 47.0 * 0.22
depth[neck_mask] = np.maximum(depth[neck_mask], neck_gradient[neck_mask])

# Shoulders and chest base (y > 130)
shoulder_mask = statue_mask & (y_idx > 130)
depth[shoulder_mask] = np.maximum(depth[shoulder_mask], 0.58)

# Marble Curls High-Pass Micro-Relief
# The curly hair occupies y < 65 and x < 100
hair_region = statue_mask & (y_idx < 65) | (statue_mask & (x_idx < 65) & (y_idx < 85))
hair_relief = np.clip(dog_fine * 0.18 + dog_mid * 0.14, -0.09, 0.14)
depth[hair_region] += hair_relief[hair_region]

# Facial micro-contours (skin stone texture, cheek curve)
face_relief = np.clip(dog_mid * 0.10 + dog_fine * 0.05, -0.06, 0.09)
depth[statue_mask & ~hair_region] += face_relief[statue_mask & ~hair_region]

# Clamp to valid 3D voxel range [0.38, 0.98] on statue, 0.0 on void
depth = np.clip(depth, 0.38, 0.98)
depth[~statue_mask] = 0.0

# 5. Clean Color Channel
soft_mask = Image.fromarray((statue_mask.astype(np.uint8) * 255), mode='L').filter(ImageFilter.GaussianBlur(radius=1.2))
soft_mask_arr = np.array(soft_mask, dtype=np.float32) / 255.0

for c in range(3):
    color_arr[:, :, c] = (color_arr[:, :, c] * soft_mask_arr).astype(np.uint8)

# Smooth depth slightly for unified surface
depth_scaled = np.clip(depth, 0.0, 1.0) * 255.0
depth_img = Image.fromarray(depth_scaled.astype(np.uint8), mode='L')
depth_img = depth_img.filter(ImageFilter.GaussianBlur(radius=0.7))

# 6. Assemble 304 x 152 Texture Atlas
atlas = Image.new('RGB', (304, 152), (0, 0, 0))
atlas.paste(Image.fromarray(color_arr.astype(np.uint8)), (0, 0))
atlas.paste(depth_img.convert('RGB'), (153, 0))

# Save with maximum compression
atlas.save('public/vansh-portrait-atlas.png', optimize=True, compress_level=9)
atlas.save('vansh-portrait-atlas.png', optimize=True, compress_level=9)

print('Classical Marble Bust 3D Atlas generated successfully!')
print(f'Depth range: {depth[statue_mask].min():.3f} to {depth[statue_mask].max():.3f}, mean: {depth[statue_mask].mean():.3f}')

