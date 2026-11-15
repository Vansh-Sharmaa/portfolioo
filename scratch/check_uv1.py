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
uv1 = read_acc(prim['attributes']['TEXCOORD_1'], np.float32, 2).reshape(-1, 2)

triangles = indices.reshape(-1, 3)
orig = Image.open('scratch/orig_baked_computer.jpg')

for i, tri in enumerate(triangles):
    tri_pos = positions[tri]
    # Check if all 3 vertices are at front, bottom, left
    if np.all(tri_pos[:, 2] > 0.4) and np.all(tri_pos[:, 1] < 0.6) and np.all(tri_pos[:, 0] < 0.0):
        t_uv = uv1[tri]
        px_x = t_uv[:, 0] * 4096
        px_y_flip = (1 - t_uv[:, 1]) * 4096
        px_y_noflip = t_uv[:, 1] * 4096
        print(f'Tri {i} UV1: X in [{px_x.min():.1f}, {px_x.max():.1f}], Y_flip in [{px_y_flip.min():.1f}, {px_y_flip.max():.1f}], Y_noflip in [{px_y_noflip.min():.1f}, {px_y_noflip.max():.1f}]')
        box = (int(px_x.min()), int(px_y_flip.min()), int(px_x.max()), int(px_y_flip.max()))
        crop = orig.crop(box)
        crop.save(f'scratch/uv1_tri_{i}.png')

