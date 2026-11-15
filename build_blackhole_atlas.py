import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
from scipy.ndimage import gaussian_filter

# Canvas resolution
W, H = 151, 151
cx, cy = 75.0, 75.0

y, x = np.mgrid[0:H, 0:W]
dx = (x - cx).astype(np.float32)
dy = (y - cy).astype(np.float32)
r = np.sqrt(dx**2 + dy**2)
theta = np.arctan2(dy, dx)

# 1. Physics Parameters
Rs = 20.0          # Event horizon radius (pixels)
R_photon = 28.0    # Photon sphere radius
R_disk_in = 26.0   # Inner edge of accretion disk (ISCO)
R_disk_out = 66.0  # Outer edge of accretion disk

# 2. Coordinate transformation for tilted accretion disk
tilt_angle = np.radians(24.0)
cos_t = np.cos(tilt_angle)
sin_t = np.sin(tilt_angle)

# Coordinate on the disk plane (accounting for tilt along x-axis)
disk_x = dx
disk_y = dy / sin_t  # Un-squashed disk coordinate
r_disk = np.sqrt(disk_x**2 + disk_y**2)

# Doppler beaming factor (left side rotating towards observer at relativistic speed)
# beta ~ 0.5c -> beaming boosts the approaching side (dx < 0)
velocity_proj = -np.sin(theta) * (dx / (r + 1e-5))
beaming = np.clip(1.0 + 0.9 * (-dx / (R_disk_out)), 0.3, 2.2)

# 3. Accretion Disk Intensity (Front & Main Plane)
# Temperature profile ~ r^(-3/4) in standard Shakura-Sunyaev disk
disk_mask = (r_disk >= R_disk_in) & (r_disk <= R_disk_out)
disk_profile = np.zeros((H, W), dtype=np.float32)
disk_profile[disk_mask] = ((r_disk[disk_mask] - R_disk_in) / (R_disk_out - R_disk_in)) ** 0.5 * \
                          ((R_disk_out - r_disk[disk_mask]) / (R_disk_out - R_disk_in)) ** 0.85

# Swirling turbulent spiral filaments in the plasma
spiral_phase = theta + 3.8 * np.log(np.maximum(r, 1.0) / Rs)
turbulence = 0.5 + 0.5 * np.sin(spiral_phase * 4.0) + 0.25 * np.cos(spiral_phase * 9.0)
disk_intensity = disk_profile * (0.65 + 0.35 * turbulence) * beaming

# Flatten the disk into a 2D projection
disk_thickness = 4.5
z_dist_to_plane = np.abs(dy - 0.0) # projected height
vertical_falloff = np.exp(-(dy / (disk_thickness * (1.0 + 0.3 * (r / R_disk_out))))**2)
main_disk = disk_intensity * vertical_falloff

# 4. Relativistic Gravitational Lensing (Interstellar-style Top & Bottom Halos)
# Light from the back of the disk bends OVER and UNDER the event horizon
# Top Lensed Arc (seen just above the black hole sphere)
arc_top_center_y = cy - 2.0
dist_top_arc = np.sqrt(dx**2 + (dy + 12.0)**2)
top_arc_mask = (dist_top_arc > Rs * 1.08) & (dist_top_arc < Rs * 2.1) & (dy < 6.0)
top_arc = np.zeros((H, W), dtype=np.float32)
top_arc[top_arc_mask] = np.exp(-((dist_top_arc[top_arc_mask] - Rs * 1.5) / 5.5)**2) * 1.4

# Bottom Lensed Arc (weaker secondary image below)
dist_bot_arc = np.sqrt(dx**2 + (dy - 12.0)**2)
bot_arc_mask = (dist_bot_arc > Rs * 1.08) & (dist_bot_arc < Rs * 1.85) & (dy > -4.0)
bot_arc = np.zeros((H, W), dtype=np.float32)
bot_arc[bot_arc_mask] = np.exp(-((dist_bot_arc[bot_arc_mask] - Rs * 1.4) / 4.5)**2) * 0.9

# 5. Photon Sphere / Einstein Ring
photon_ring = np.exp(-((r - R_photon) / 1.8)**2) * 2.2

# Combine all luminous plasma components
plasma = main_disk * 1.8 + top_arc * 1.2 + bot_arc * 0.8 + photon_ring * 0.9

# 6. Sharp Shadow of the Event Horizon (Schwarzschild Singularity)
# The apparent shadow radius is slightly larger due to photon capture (~ sqrt(27)/2 * Rs ~ 2.6 Rs)
shadow_r = 17.5
shadow_mask = r <= shadow_r
# Sharp black hole horizon with slight anti-aliased edge
shadow_attenuation = np.clip((r - (shadow_r - 1.2)) / 1.5, 0.0, 1.0)
plasma = plasma * shadow_attenuation

# Add relativistic gravitational lensing distortion to background grid/stars
# Light deflection angle alpha = 4 * G * M / (c^2 * r) ~ k / r
lensing_glow = np.clip(1.0 / (np.maximum(r - shadow_r, 0.8)**0.7), 0.0, 3.0) * 0.15
plasma += lensing_glow * shadow_attenuation

# 7. Color Grading: Retro Cyber-Luminescent Phosphor / Deep Space Palette
# Core: incandescent electric white / cyan
# Mid: radioactive emerald / cyan phosphor (matching the CRT monitor)
# Edge: deep space teal and cosmic amber
plasma_norm = np.clip(plasma, 0.0, 2.5)

r_col = np.clip(plasma_norm**1.4 * 0.55 + (plasma_norm**2.8) * 0.65, 0.0, 1.0)
g_col = np.clip(plasma_norm**0.95 * 1.05 + (plasma_norm**2.2) * 0.45, 0.0, 1.0)
b_col = np.clip(plasma_norm**1.1 * 0.85 + (plasma_norm**2.0) * 0.55, 0.0, 1.0)

# Doppler color shift: approaching (left) is bluer, receding (right) is slightly warmer
left_blue_shift = np.clip(-dx / 50.0, 0.0, 0.6)
right_warm_shift = np.clip(dx / 50.0, 0.0, 0.6)

b_col = np.clip(b_col + left_blue_shift * 0.25 * plasma_norm, 0.0, 1.0)
r_col = np.clip(r_col + right_warm_shift * 0.35 * plasma_norm, 0.0, 1.0)

# Pure black event horizon core
r_col[shadow_mask] = 0.0
g_col[shadow_mask] = 0.0
b_col[shadow_mask] = 0.0

color_arr = np.stack([
    (r_col * 255).astype(np.uint8),
    (g_col * 255).astype(np.uint8),
    (b_col * 255).astype(np.uint8)
], axis=-1)

# 8. 3D Volumetric Depth Synthesis (Relativistic Spacetime Funnel)
# In 3D:
# - Front disk tilts forward toward camera: Z ~ 0.80 - 0.96
# - Back lensed arc arches behind the hole: Z ~ 0.45 - 0.60
# - Photon ring wraps at Z ~ 0.68
# - Center event horizon funnels into deep gravitational well: Z ~ 0.10 - 0.25
depth = np.zeros((H, W), dtype=np.float32)

# Disk inclination gradient (front half dy > 0 is closer, back half dy < 0 is farther)
disk_z = 0.72 + (dy / (H / 2.0)) * 0.22  # Range [0.50, 0.94]

# Funnel gravity well: spacetime curvature dips sharply near Rs
gravity_well = np.clip((r / (Rs * 2.5))**1.6, 0.15, 1.0)

depth = disk_z * gravity_well
depth[shadow_mask] = 0.10 + 0.15 * (r[shadow_mask] / shadow_r)**2.0

# Photon ring pops out as a luminous ridge
depth += np.exp(-((r - R_photon) / 2.2)**2) * 0.12

# Top lensed arc is positioned in the background behind the hole
depth[top_arc_mask] = np.minimum(depth[top_arc_mask], 0.58)

# Only assign depth where there is visible plasma or inside the singularity shadow
active_mask = (plasma > 0.04) | shadow_mask
depth[~active_mask] = 0.0
depth = np.clip(depth, 0.0, 1.0)

depth_img = Image.fromarray((depth * 255).astype(np.uint8), mode='L')
depth_img = depth_img.filter(ImageFilter.GaussianBlur(radius=0.6))

# 9. Assemble 304 x 152 Texture Atlas
atlas = Image.new('RGB', (304, 152), (0, 0, 0))
atlas.paste(Image.fromarray(color_arr), (0, 0))
atlas.paste(depth_img.convert('RGB'), (153, 0))

# Save to public and root
atlas.save('public/vansh-portrait-atlas.png', optimize=True, compress_level=9)
atlas.save('vansh-portrait-atlas.png', optimize=True, compress_level=9)
atlas.save('blackhole_atlas_preview.png', optimize=True)

print(f"✓ Black Hole Gravitational Singularity Atlas generated successfully!")
print(f"Shadow radius: {shadow_r}px, Photon ring: {R_photon}px, Disk extent: {R_disk_in}-{R_disk_out}px")
print(f"Depth range: {depth[active_mask].min():.3f} to {depth[active_mask].max():.3f}")
