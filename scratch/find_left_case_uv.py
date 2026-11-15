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

mesh1 = json_data['meshes'][1] # computer01b.001_Cube.018
prim = mesh1['primitives'][0]

indices = read_acc(prim['indices'], np.uint16, 1)
positions = read_acc(prim['attributes']['POSITION'], np.float32, 3).reshape(-1, 3)
uv0 = read_acc(prim['attributes']['TEXCOORD_0'], np.float32, 2).reshape(-1, 2)
triangles = indices.reshape(-1, 3)
z_max = positions[:, 2].max()

im = Image.open('scratch/orig_baked_computer.jpg')

for i, tri in enumerate(triangles):
    pos = positions[tri]
    if np.all(pos[:, 2] > z_max - 0.05):
        if np.all(pos[:, 0] < -0.2): # completely on the left!
            u = uv0[tri]
            px_x = u[:, 0] * 4096
            # Three.js uses (u, 1-v) when texture.flipY is false in WebGL
            # wait, in WebGL texture(sampler, uv), uv=(u, v).
            # But Three.js texture coordinate system: (0,0) is bottom-left if flipY=true.
            # When flipY=false, image row 0 is at v=1! So pixel y = (1 - v) * height!
            px_y_flip = (1 - u[:, 1]) * 4096
            print(f'Left Tri {i}:')
            print(f'  Pos X: {pos[:, 0]}, Pos Y: {pos[:, 1]}')
            print(f'  UV pixels (1-v): X=[{px_x.min():.1f}, {px_x.max():.1f}], Y=[{px_y_flip.min():.1f}, {px_y_flip.max():.1f}]')
            box = (int(px_x.min()), int(px_y_flip.min()), int(px_x.max()), int(px_y_flip.max()))
            if box[2] > box[0] and box[3] > box[1]:
                im.crop(box).save(f'scratch/left_tri_{i}.png')

