import struct
import numpy as np
from PIL import Image

# 1. Load Vansh's depth map from the atlas
atlas = Image.open('public/vansh-portrait-atlas.png')
# Depth channel is in right half [153:304]
depth_map = np.array(atlas)[:151, 153:, 0] / 255.0

cols = 7
rows = 4
max_d = 7
min_d = 2
cell_w = 0.16384145617485046
cell_h = 0.2687000036239624
orig_x = -0.07344511896371841
orig_y = -0.03739999979734421

cx = 88.0

def should_split(x, y, depth, size):
    # Base cyberpunk grid: always split down to depth 2 (32x32 boxes)
    if depth < min_d:
        return True
    if depth >= max_d:
        return False
        
    u0 = orig_x + (x / 128.0) * cell_w
    u1 = orig_x + ((x + size) / 128.0) * cell_w
    v0 = orig_y + (y / 128.0) * cell_h
    v1 = orig_y + ((y + size) / 128.0) * cell_h
    
    # Outside portrait bounds -> stay as large HUD grid boxes
    if u1 <= 0.0 or u0 >= 1.0 or v1 <= 0.0 or v0 >= 1.0:
        return False
        
    ix0 = int(np.clip(u0 * 151, 0, 150))
    ix1 = int(np.clip(u1 * 151, 0, 151))
    iy0 = int(np.clip(v0 * 151, 0, 150))
    iy1 = int(np.clip(v1 * 151, 0, 151))
    if ix1 <= ix0: ix1 = ix0 + 1
    if iy1 <= iy0: iy1 = iy0 + 1
    
    sub = depth_map[iy0:iy1, ix0:ix1]
    has_body = (sub >= 0.35).any()
    has_bg   = (sub < 0.35).any()
    
    if not has_body:
        return False
        
    # Silhouette edge: split tightly around Vansh's real head and hair up to depth 5
    if has_body and has_bg:
        return depth < 5
        
    # Vansh's facial landmarks (eyes, nose, mouth): high precision AI tracking boxes (depth 6)
    is_eyes  = (iy0 <= 52 and iy1 >= 44 and ix0 <= 106 and ix1 >= 70)
    is_nose  = (iy0 <= 62 and iy1 >= 50 and ix0 <= 96 and ix1 >= 80)
    is_mouth = (iy0 <= 76 and iy1 >= 66 and ix0 <= 100 and ix1 >= 76)
    
    if is_eyes or is_nose or is_mouth:
        return depth < 6
        
    # Jawline and chin contour
    is_chin = (iy0 <= 86 and iy1 >= 78 and ix0 <= 102 and ix1 >= 74)
    if is_chin:
        return depth < 5
        
    # High-relief curl texture across the hair
    if (sub.max() - sub.min()) > 0.12:
        return depth < 4
        
    return False

od = [[0,0],[1,0],[0,1],[1,1]]

def build_frame_bits():
    bits = []
    def ti(x, y, depth, size):
        if depth >= max_d:
            return
        sp = should_split(x, y, depth, size)
        bits.append(1 if sp else 0)
        if not sp:
            return
        sub = size // 2
        for dx, dy in od:
            ti(x + dx*sub, y + dy*sub, depth + 1, sub)

    for row in range(rows):
        for col in range(cols):
            ti(col * 128, row * 128, 0, 128)
            
    # Pack bits into bytes (MSB first)
    byte_arr = bytearray()
    curr_byte = 0
    bit_count = 0
    for b in bits:
        curr_byte = (curr_byte << 1) | b
        bit_count += 1
        if bit_count == 8:
            byte_arr.append(curr_byte)
            curr_byte = 0
            bit_count = 0
    if bit_count > 0:
        curr_byte = curr_byte << (8 - bit_count)
        byte_arr.append(curr_byte)
        
    return bytes(byte_arr)

frame_bytes = build_frame_bits()
frame_len = len(frame_bytes)
print(f'Single frame byte size: {frame_len} bytes')

# Build optimized binary file with frameCount = 1 (99.5% size reduction)
frame_count = 1
header_size = 24 + frame_count * 4 # 28 bytes

out = bytearray()
# Header: cols(1), rows(1), maxDepth(1), minDepth(1)
out.extend(struct.pack('<BBBB', cols, rows, max_d, min_d))
# cellWidth(4), cellHeight(4), originX(4), originY(4)
out.extend(struct.pack('<ffff', cell_w, cell_h, orig_x, orig_y))
# frameCount(4)
out.extend(struct.pack('<I', frame_count))

# Frame offsets table
for i in range(frame_count):
    offset = header_size + i * frame_len
    out.extend(struct.pack('<I', offset))

# Frame data
for i in range(frame_count):
    out.extend(frame_bytes)

with open('public/glitch-portrait-quadtree.bin', 'wb') as f:
    f.write(out)

print(f'Successfully generated public/glitch-portrait-quadtree.bin!')
print(f'Total size: {len(out)} bytes ({len(out)/1024:.1f} KB)')

