import json, struct
import numpy as np

with open('public/models/Computer/computer_setup.glb', 'rb') as f:
    magic = f.read(4)
    version, length = struct.unpack('<II', f.read(8))
    chunk_len, chunk_type = struct.unpack('<II', f.read(8))
    json_data = json.loads(f.read(chunk_len).decode('utf-8'))
    bin_len, bin_type = struct.unpack('<II', f.read(8))
    bin_data = f.read(bin_len)

buffer_views = json_data['bufferViews']
accessors = json_data['accessors']

mesh0 = json_data['meshes'][0]
print('Mesh 0 primitives:', mesh0['primitives'])

pos_acc = accessors[mesh0['primitives'][0]['attributes']['POSITION']]
uv_acc = accessors[mesh0['primitives'][0]['attributes']['TEXCOORD_0']]

def read_accessor(acc):
    bv = buffer_views[acc['bufferView']]
    offset = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
    count = acc['count']
    # FLOAT = 5126
    component_type = acc['componentType']
    type_ = acc['type']
    num_comp = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[type_]
    data = np.frombuffer(bin_data, dtype=np.float32, count=count*num_comp, offset=offset)
    return data.reshape(count, num_comp)

pos = read_accessor(pos_acc)
uv = read_accessor(uv_acc)

print('Pos shape:', pos.shape, 'UV shape:', uv.shape)
print('Pos min/max:', pos.min(axis=0), pos.max(axis=0))
print('UV min/max:', uv.min(axis=0), uv.max(axis=0))

# The badge is on the front bottom-left bezel of the monitor.
# Let's find vertices where Z is at front (max Z or min Z?), X is on the left, Y is below the screen.
# In Three.js / GLTF:
# Let's inspect where X is negative (left), Y is near bottom of bezel, Z is near front.
# Let's find vertices with Y between min and 25% of height, Z near front
z_max = pos[:, 2].max()
z_min = pos[:, 2].min()
y_min = pos[:, 1].min()
y_max = pos[:, 1].max()
x_min = pos[:, 0].min()
x_max = pos[:, 0].max()

print(f'X: [{x_min:.3f}, {x_max:.3f}], Y: [{y_min:.3f}, {y_max:.3f}], Z: [{z_min:.3f}, {z_max:.3f}]')

# Let's filter vertices on the front face:
# In the desk view, the camera looks at the monitor from +Z or -Z?
# The screen is visible, so front face has normal facing towards camera.
# Let's check vertices around the bottom-left of front:
# X in [x_min, (x_min+x_max)/2], Y in [y_min, y_min + 0.3*(y_max-y_min)]
# Let's look at UVs for both Z_max front and Z_min front:
for z_side, z_cond in [('Z_max (front)', pos[:, 2] > z_max - 0.1), ('Z_min (front)', pos[:, 2] < z_min + 0.1)]:
    cond = z_cond & (pos[:, 0] < x_min + 0.4*(x_max-x_min)) & (pos[:, 1] < y_min + 0.3*(y_max-y_min))
    if np.any(cond):
        matched_uvs = uv[cond]
        # Texture coordinates in image space: (u * 4096, (1-v) * 4096)
        px_x = matched_uvs[:, 0] * 4096
        px_y = (1 - matched_uvs[:, 1]) * 4096
        print(f'{z_side}: count={np.sum(cond)}')
        print(f'  UV u in [{matched_uvs[:, 0].min():.4f}, {matched_uvs[:, 0].max():.4f}] -> Pixel X in [{px_x.min():.1f}, {px_x.max():.1f}]')
        print(f'  UV v in [{matched_uvs[:, 1].min():.4f}, {matched_uvs[:, 1].max():.4f}] -> Pixel Y in [{px_y.min():.1f}, {px_y.max():.1f}]')

