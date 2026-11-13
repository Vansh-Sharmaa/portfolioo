import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
from scipy.ndimage import gaussian_filter, sobel

# 1. Load clean centered crop
orig = Image.open('public/vansh-photo.jpg').convert('RGB')
crop = orig.crop((0, 301, 597, 898))
face_151 = crop.resize((151, 151), Image.Resampling.LANCZOS)

# 2. Extract Color & Multi-Scale Luminance Signals
color_arr = np.array(face_151, dtype=np.float32)
r, g, b = color_arr[:,:,0], color_arr[:,:,1], color_arr[:,:,2]
lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0

y_idx, x_idx = np.mgrid[0:151, 0:151]
cx = 86.0  # Center of face in 151x151
cy = 66.0  # Center of head

# 3. Precise Masking: Filter Ceiling, Wall, and Chandelier
white_wall = (r > 75) & (g > 65) & (b > 55) & (np.abs(r - g) < 22) & (y_idx < 65)
green_wall = (g > r) & (g > b) & (g > 35)
lamp = (y_idx < 35) & (color_arr.mean(axis=2) < 45) & (np.abs(x_idx - 75) < 30)
bg_mask = white_wall | green_wall | lamp

# Anatomical Boundaries
head_dist = np.sqrt(((x_idx - cx) / 44.0)**2 + ((y_idx - cy) / 40.0)**2)
head_mask = (head_dist <= 1.0) & ~bg_mask

neck_w = np.maximum(20.0 + (y_idx - 78.0) * 0.28, 1.0)
neck_dist_x = np.abs(x_idx - cx) / neck_w
neck_mask = (y_idx >= 78) & (y_idx <= 136) & (neck_dist_x <= 1.0) & ~bg_mask

shoulder_w = np.maximum(36.0 + (y_idx - 130.0) * 1.2, 1.0)
shoulder_dist_x = np.abs(x_idx - cx) / shoulder_w
shoulder_mask = (y_idx > 130) & (shoulder_dist_x <= 1.0) & ~bg_mask

hair_mask = (head_dist <= 1.16) & (y_idx <= cy + 5) & ~bg_mask
person_mask = head_mask | neck_mask | shoulder_mask | hair_mask

# 4. Multi-Scale Frequency Decomposition
# Fine band: individual curly hair strands, skin pores, edge definition
dog_fine = gaussian_filter(lum, sigma=0.7) - gaussian_filter(lum, sigma=2.0)
# Mid band: nasal bridge, ocular sockets, philtrum, vermilion borders, trachea
dog_mid  = gaussian_filter(lum, sigma=2.0) - gaussian_filter(lum, sigma=6.0)
# Gradient magnitude for crisp edge boundaries
sx = sobel(lum, axis=1)
sy = sobel(lum, axis=0)
edge_mag = np.hypot(sx, sy)

# 5. Anatomical Sculptural 3D Base Depth
depth = np.zeros((151, 151), dtype=np.float32)

# 5a. Spherical Head Dome (gaze tilted upwards)
head_sphere = np.clip(1.0 - head_dist**1.7, 0.0, 1.0)
depth[head_mask] = 0.62 + 0.22 * head_sphere[head_mask]

# 5b. High-Definition Facial Landmarks (Upward Perspective)
# Nose bridge and tip protrusion
nose_center = (cx, 55.0)
nose_dist = np.sqrt(((x_idx - nose_center[0]) / 9.0)**2 + ((y_idx - nose_center[1]) / 12.0)**2)
nose_protrusion = np.exp(-nose_dist**2) * 0.14
depth += nose_protrusion

# Chin / Jawline protrusion
chin_center = (cx, 82.0)
chin_dist = np.sqrt(((x_idx - chin_center[0]) / 15.0)**2 + ((y_idx - chin_center[1]) / 12.0)**2)
chin_protrusion = np.exp(-chin_dist**2) * 0.12
depth += chin_protrusion

# Recessed Eye Sockets (orbital depressions)
left_eye = (cx - 16.0, 48.0)
right_eye = (cx + 16.0, 48.0)
dist_le = np.sqrt(((x_idx - left_eye[0]) / 10.0)**2 + ((y_idx - left_eye[1]) / 8.0)**2)
dist_re = np.sqrt(((x_idx - right_eye[0]) / 10.0)**2 + ((y_idx - right_eye[1]) / 8.0)**2)
socket_depression = (np.exp(-dist_le**2) + np.exp(-dist_re**2)) * 0.08
depth -= socket_depression

# Lips structure (upper and lower lip curvature with recessed mouth slit)
mouth_center = (cx, 71.0)
mouth_dist = np.sqrt(((x_idx - mouth_center[0]) / 12.0)**2 + ((y_idx - mouth_center[1]) / 6.0)**2)
lip_mound = np.exp(-mouth_dist**2) * 0.07
depth += lip_mound

# 5c. Stepped Jawline over Neck
# Jawline boundary: arc passing through chin (86, 82) to angle of jaw (68, 72) and (104, 72)
jaw_arc_y = 82.0 - 0.035 * (x_idx - cx)**2
is_jaw_overhang = (y_idx <= jaw_arc_y) & (y_idx >= 60) & (np.abs(x_idx - cx) <= 24)
depth[is_jaw_overhang] = np.maximum(depth[is_jaw_overhang], 0.82)

# 5d. Neck Cylindrical Curvature & Adam's Apple
neck_curve = np.clip(1.0 - neck_dist_x**1.8, 0.0, 1.0)
neck_gradient = 0.84 - (y_idx - 78.0) / 58.0 * 0.22
neck_depth = neck_gradient + 0.07 * neck_curve

# Adam's apple vertical ridge along midline of neck
adams_apple = np.exp(-(((x_idx - cx) / 7.0)**2 + ((y_idx - 98.0) / 14.0)**2)) * 0.06
neck_depth += adams_apple

depth[neck_mask] = np.maximum(depth[neck_mask], neck_depth[neck_mask])

# 5e. Shoulders depth
shoulder_curve = np.clip(1.0 - (shoulder_dist_x * 0.7)**2, 0.0, 1.0)
shoulder_depth = 0.62 - (y_idx - 130.0) / 21.0 * 0.16 + 0.06 * shoulder_curve
depth[shoulder_mask] = np.maximum(depth[shoulder_mask], shoulder_depth[shoulder_mask])

# 5f. Curly Hair High-Frequency Micro-Relief
# Combine fine and mid DoG to create tactile volume for every curl
hair_relief = np.clip(dog_fine * 0.16 + dog_mid * 0.10, -0.08, 0.12)
depth[hair_mask] += hair_relief[hair_mask]

# Facial micro-relief (skin contours, philtrum, cheekbones)
face_relief = np.clip(dog_mid * 0.08 + dog_fine * 0.04, -0.06, 0.08)
depth[head_mask & ~hair_mask] += face_relief[head_mask & ~hair_mask]

# Ensure valid depth range [0.38, 0.98] on the body, 0.0 on background
depth = np.clip(depth, 0.38, 0.98)
depth[~person_mask] = 0.0

# 6. High-Pass Contrast Sharpening for Color Channel
enhancer = ImageEnhance.Contrast(face_151)
face_contrast = enhancer.enhance(1.25)
enhancer_sharp = ImageEnhance.Sharpness(face_contrast)
face_sharp = enhancer_sharp.enhance(1.4)
color_arr = np.array(face_sharp, dtype=np.float32)

# Soft background mask for zero-halo silhouette
soft_mask = Image.fromarray((person_mask.astype(np.uint8) * 255), mode='L').filter(ImageFilter.GaussianBlur(radius=1.5))
soft_mask_arr = np.array(soft_mask, dtype=np.float32) / 255.0

for c in range(3):
    color_arr[:, :, c] = (color_arr[:, :, c] * soft_mask_arr).astype(np.uint8)

# Smooth depth map slightly (radius 0.7) to preserve crisp micro-relief without voxel tearing
depth_scaled = np.clip(depth, 0.0, 1.0) * 255.0
depth_img = Image.fromarray(depth_scaled.astype(np.uint8), mode='L')
depth_img = depth_img.filter(ImageFilter.GaussianBlur(radius=0.7))

# 7. Assemble 304 x 152 Texture Atlas
atlas = Image.new('RGB', (304, 152), (0, 0, 0))
atlas.paste(Image.fromarray(color_arr.astype(np.uint8)), (0, 0))
atlas.paste(depth_img.convert('RGB'), (153, 0))

atlas.save('public/vansh-portrait-atlas.png')
atlas.save('vansh-portrait-atlas.png')

print('High-Definition 3D Facial Micro-Relief Atlas generated successfully!')
print(f'Depth range: {depth[person_mask].min():.3f} to {depth[person_mask].max():.3f}, mean: {depth[person_mask].mean():.3f}')
