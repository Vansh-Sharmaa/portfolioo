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

mesh0 = json_data['meshes'][0]
prim = mesh0['primitives'][0]

indices = read_acc(prim['indices'], np.uint16, 1)
positions = read_acc(prim['attributes']['POSITION'], np.float32, 3).reshape(-1, 3)
uvs = read_acc(prim['attributes']['TEXCOORD_0'], np.float32, 2).reshape(-1, 2)

print('Indices:', len(indices), 'Triangles:', len(indices)//3)

# Find triangles on the bottom front bezel
# Front of monitor: Z is at maximum (~0.59)
# Bottom of monitor: Y is between 0.0 and 0.45
# Left of monitor: X is between -0.85 and -0.2
triangles = indices.reshape(-1, 3)

bezel_tris = []
for i, tri in enumerate(triangles):
    tri_pos = positions[tri]
    # Check if all 3 vertices are at front, bottom, left
    if np.all(tri_pos[:, 2] > 0.4) and np.all(tri_pos[:, 1] < 0.6) and np.all(tri_pos[:, 0] < 0.0):
        bezel_tris.append(tri)
        tri_uv = uvs[tri]
        px_x = tri_uv[:, 0] * 4096
        px_y = (1 - tri_uv[:, 1]) * 4096 # Three.js flipY=false means y is (1-v)*4096 or v*4096? Let's print both!
        print(f'Triangle {i}:')
        print(f'  Pos X: {tri_pos[:, 0]}')
        print(f'  Pos Y: {tri_pos[:, 1]}')
        print(f'  Pos Z: {tri_pos[:, 2]}')
        print(f'  UV u: {tri_uv[:, 0]} -> px X: {px_x}')
        print(f'  UV v: {tri_uv[:, 1]} -> px Y (1-v): {px_y}, px Y (v): {tri_uv[:, 1]*4096}')

# Let's crop regions around these UVs from scratch/orig_baked_computer.jpg
orig = Image.open('scratch/orig_baked_computer.jpg')
for i, tri in enumerate(bezel_tris):
    tri_uv = uvs[tri]
    min_x, max_x = int(tri_uv[:, 0].min() * 4096), int(tri_uv[:, 0].max() * 4096)
    for flip in [True, False]:
        if flip:
            min_y, max_y = int((1 - tri_uv[:, 1].max()) * 4096), int((1 - tri_uv[:, 1].min()) * 4096)
            name = f'scratch/bezel_tri_{i}_flip.png'
        else:
            min_y, max_y = int(tri_uv[:, 1].min() * 4096), int(tri_uv[:, 1].max() * 4096)
            name = f'scratch/bezel_tri_{i}_noflip.png'
        # Expand box by 50px
        box = (max(0, min_x-30), max(0, min_y-30), min(4096, max_x+30), min(4096, max_y+30))
        crop = orig.crop(box)
        crop.save(name)
        print(f'Saved {name} with box {box}')

