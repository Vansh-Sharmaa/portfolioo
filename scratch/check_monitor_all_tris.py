import json, struct
import numpy as np
from PIL import Image

with open('public/models/Computer/computer_setup.glb', 'rb') as f:
    f.read(4)
    struct.unpack('<II', f.read(8))
    chunk_len, chunk_type = struct.unpack('<II', f.read(8))
    json_data = json.loads(f.read(chunk_len).decode('utf-8'))
    bin_len, bin_type = struct.unpack('<II', f.read(8))
    bin_data = f.read(bin_len)

buffer_views = json_data['bufferViews']
accessors = json_data['accessors']

def read_acc(idx, dtype, count_mult):
    acc = accessors[idx]
    bv = buffer_views[acc['bufferView']]
    offset = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
    count = acc['count'] * count_mult
    return np.frombuffer(bin_data, dtype=dtype, count=count, offset=offset)

mesh0 = json_data['meshes'][0] # monitor01b.001_Cube.002
prim = mesh0['primitives'][0]

indices = read_acc(prim['indices'], np.uint16, 1)
positions = read_acc(prim['attributes']['POSITION'], np.float32, 3).reshape(-1, 3)
uv0 = read_acc(prim['attributes']['TEXCOORD_0'], np.float32, 2).reshape(-1, 2)
uv1 = read_acc(prim['attributes']['TEXCOORD_1'], np.float32, 2).reshape(-1, 2)

triangles = indices.reshape(-1, 3)
print('Total triangles:', len(triangles))

# In 3D space:
# What are the bounds of the monitor?
# X: [-0.855, 0.855]
# Y: [0.006, 1.788]
# Z: [-0.814, 0.591]
# Front face has positive Z (> 0.4).
# The bottom bezel is below the screen. Screen bottom is around Y = 0.5.
# So bottom bezel is around Y: [0.3, 0.5], X: [-0.85, 0.0], Z: [0.45, 0.6]

im = Image.open('scratch/orig_baked_computer.jpg')

matched = []
for i, tri in enumerate(triangles):
    pos = positions[tri]
    # Check if any vertex is on front bezel
    if np.any(pos[:, 2] > 0.45) and np.any((pos[:, 1] > 0.25) & (pos[:, 1] < 0.55)) and np.any(pos[:, 0] < -0.3):
        matched.append((i, pos, uv0[tri], uv1[tri]))

print(f'Matched triangles: {len(matched)}')
for idx, (i, pos, u0, u1) in enumerate(matched):
    print(f'--- Tri {i} ---')
    print('Pos center:', pos.mean(axis=0))
    # In Three.js: texture.flipY = false.
    # When flipY = false, Three.js coordinates in texture are:
    # x = u * width
    # y = (1 - v) * height (in standard GL coordinates where v=0 is bottom, flipY=false means v=0 is bottom of texture, so in image pixels y = (1-v)*height or v*height)
    print('UV0 (u, v):', u0)
    px_u0_x = u0[:, 0] * 4096
    px_u0_y = (1 - u0[:, 1]) * 4096
    print(f'UV0 pixels: X=[{px_u0_x.min():.1f}, {px_u0_x.max():.1f}], Y=[{px_u0_y.min():.1f}, {px_u0_y.max():.1f}]')
    
    px_u1_x = u1[:, 0] * 4096
    px_u1_y = (1 - u1[:, 1]) * 4096
    print(f'UV1 pixels: X=[{px_u1_x.min():.1f}, {px_u1_x.max():.1f}], Y=[{px_u1_y.min():.1f}, {px_u1_y.max():.1f}]')

    # Crop both
    b0 = (int(max(0, px_u0_x.min()-20)), int(max(0, px_u0_y.min()-20)), int(min(4096, px_u0_x.max()+20)), int(min(4096, px_u0_y.max()+20)))
    b1 = (int(max(0, px_u1_x.min()-20)), int(max(0, px_u1_y.min()-20)), int(min(4096, px_u1_x.max()+20)), int(min(4096, px_u1_y.max()+20)))
    if b0[2] > b0[0] and b0[3] > b0[1]:
        im.crop(b0).save(f'scratch/crop_u0_{i}.png')
    if b1[2] > b1[0] and b1[3] > b1[1]:
        im.crop(b1).save(f'scratch/crop_u1_{i}.png')

