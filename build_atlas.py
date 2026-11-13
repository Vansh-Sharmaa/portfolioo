import numpy as np
from PIL import Image, ImageFilter, ImageEnhance

# 1. Load clean centered crop (597 x 597)
orig = Image.open('public/vansh-photo.jpg').convert('RGB')
# Crop centered around the face and jaw (y: 301..898)
crop = orig.crop((0, 301, 597, 898))
face_151 = crop.resize((151, 151), Image.Resampling.LANCZOS)

# Enhance contrast and saturation for holographic cyber aesthetic
enhancer = ImageEnhance.Contrast(face_151)
face_enhanced = enhancer.enhance(1.2)
color_arr = np.array(face_enhanced, dtype=np.float32)

# 2. Detect Background vs Person
r, g, b = color_arr[:,:,0], color_arr[:,:,1], color_arr[:,:,2]
y_idx, x_idx = np.mgrid[0:151, 0:151]

# Ceiling / Wall background detection:
# - White/gray ceiling
white_wall = (r > 75) & (g > 65) & (b > 55) & (np.abs(r - g) < 22) & (y_idx < 65)
# - Green paint stripe / circle on wall
green_wall = (g > r) & (g > b) & (g > 35)

# Lamp fixture in top portion:
lamp = (y_idx < 35) & (color_arr.mean(axis=2) < 45) & (np.abs(x_idx - 75) < 30)

bg_mask = white_wall | green_wall | lamp

# Person center coordinates
cx = 85.0 # Center of face
cy = 65.0 # Center of head

head_dist = np.sqrt(((x_idx - cx) / 44.0)**2 + ((y_idx - cy) / 40.0)**2)
head_mask = (head_dist <= 1.0) & ~bg_mask

# Neck region (y: 80..135, width ~22..36)
neck_w = np.maximum(20.0 + (y_idx - 78.0) * 0.28, 1.0)
neck_dist_x = np.abs(x_idx - cx) / neck_w
neck_mask = (y_idx >= 78) & (y_idx <= 136) & (neck_dist_x <= 1.0) & ~bg_mask

# Shoulders region (y > 130)
shoulder_w = np.maximum(36.0 + (y_idx - 130.0) * 1.2, 1.0)
shoulder_dist_x = np.abs(x_idx - cx) / shoulder_w
shoulder_mask = (y_idx > 130) & (shoulder_dist_x <= 1.0) & ~bg_mask

# Hair region
hair_mask = (head_dist <= 1.15) & (y_idx <= cy + 5) & ~bg_mask

# Full person silhouette
person_mask = head_mask | neck_mask | shoulder_mask | hair_mask

# 3. Build 3D Sculptural Depth Map
depth = np.zeros((151, 151), dtype=np.float32)

# 3a. Head spherical curvature
head_sphere = np.clip(1.0 - head_dist**1.7, 0.0, 1.0)
depth[head_mask] = 0.64 + 0.24 * head_sphere[head_mask]

# 3b. Nose tip & chin anatomical protrusion
nose = np.exp(-(((x_idx - cx) / 12.0)**2 + ((y_idx - 54.0) / 14.0)**2)) * 0.12
chin = np.exp(-(((x_idx - cx) / 16.0)**2 + ((y_idx - 82.0) / 15.0)**2)) * 0.10
depth += (nose + chin)

# 3c. Neck cylindrical curvature
neck_curve = np.clip(1.0 - neck_dist_x**1.8, 0.0, 1.0)
neck_gradient = 0.88 - (y_idx - 78.0) / 58.0 * 0.24
neck_depth = neck_gradient + 0.08 * neck_curve
depth[neck_mask] = np.maximum(depth[neck_mask], neck_depth[neck_mask])

# 3d. Shoulders depth
shoulder_curve = np.clip(1.0 - (shoulder_dist_x * 0.7)**2, 0.0, 1.0)
shoulder_depth = 0.62 - (y_idx - 130.0) / 21.0 * 0.16 + 0.06 * shoulder_curve
depth[shoulder_mask] = np.maximum(depth[shoulder_mask], shoulder_depth[shoulder_mask])

# 3e. Hair volume
hair_depth = 0.60 + 0.10 * np.clip(1.0 - (head_dist / 1.15)**2, 0.0, 1.0)
depth[hair_mask & (depth < 0.58)] = hair_depth[hair_mask & (depth < 0.58)]

# Zero out background completely
depth[~person_mask] = 0.0

# 4. Color channel masking (fade background to deep clean black)
soft_mask = Image.fromarray((person_mask.astype(np.uint8) * 255), mode='L').filter(ImageFilter.GaussianBlur(radius=1.8))
soft_mask_arr = np.array(soft_mask, dtype=np.float32) / 255.0

for c in range(3):
    color_arr[:, :, c] = (color_arr[:, :, c] * soft_mask_arr).astype(np.uint8)

# Smooth depth map slightly for continuous voxel surface
depth_scaled = np.clip(depth, 0.0, 1.0) * 255.0
depth_img = Image.fromarray(depth_scaled.astype(np.uint8), mode='L')
depth_img = depth_img.filter(ImageFilter.GaussianBlur(radius=1.2))

# 5. Build 304 x 152 Texture Atlas
atlas = Image.new('RGB', (304, 152), (0, 0, 0))
atlas.paste(Image.fromarray(color_arr.astype(np.uint8)), (0, 0))
atlas.paste(depth_img.convert('RGB'), (153, 0))

# Save to both public/ and root
atlas.save('public/vansh-portrait-atlas.png')
atlas.save('vansh-portrait-atlas.png')

print('Generated centered 3D atlas: 304 x 152')
