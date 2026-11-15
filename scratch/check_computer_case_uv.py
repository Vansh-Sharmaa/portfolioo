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

print('Mesh 1 positions min/max:', positions.min(axis=0), positions.max(axis=0))
print('Mesh 1 UV0 min/max:', uv0.min(axis=0), uv0.max(axis=0))

triangles = indices.reshape(-1, 3)

# The badge on the computer case is at the FRONT face (Z max), LEFT side (X min to center), TOP/UPPER part of front face (Y upper)
z_max = positions[:, 2].max()
y_max = positions[:, 1].max()
y_min = positions[:, 1].min()
x_min = positions[:, 0].min()

im = Image.open('scratch/orig_baked_computer.jpg')

for i, tri in enumerate(triangles):
    pos = positions[tri]
    # Check if front face
    if np.all(pos[:, 2] > z_max - 0.05):
        # Front face!
        # Check if left side
        if np.any(pos[:, 0] < -0.2):
            u = uv0[tri]
            px_x = u[:, 0] * 4096
            px_y_flip = (1 - u[:, 1]) * 4096
            px_y_noflip = u[:, 1] * 4096
            print(f'Front-left Tri {i}:')
            print(f'  Pos X: {pos[:, 0]}')
            print(f'  Pos Y: {pos[:, 1]}')
            print(f'  UV pixels (flip): X=[{px_x.min():.1f}, {px_x.max():.1f}], Y=[{px_y_flip.min():.1f}, {px_y_flip.max():.1f}]')
            print(f'  UV pixels (noflip): X=[{px_x.min():.1f}, {px_x.max():.1f}], Y=[{px_y_noflip.min():.1f}, {px_y_noflip.max():.1f}]')
            
            box = (int(px_x.min()), int(px_y_flip.min()), int(px_x.max()), int(px_y_flip.max()))
            if box[2] > box[0] and box[3] > box[1]:
                im.crop(box).save(f'scratch/case_tri_{i}.png')

