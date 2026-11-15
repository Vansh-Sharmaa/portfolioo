import json, struct
import numpy as np

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

# Find triangles that map near (2260, 1910) on the texture!
# If x = u * 4096 is around 2260, u is around 2260/4096 = 0.5517
# And y = (1-v) * 4096 is around 1910, v is around 1 - 1910/4096 = 0.5337
# Or if y = v * 4096, v is around 1910/4096 = 0.4663
print('Target u ~ 0.552, target v ~ 0.534 (or 0.466)')

for m_idx, mesh in enumerate(json_data['meshes']):
    prim = mesh['primitives'][0]
    m_indices = read_acc(prim['indices'], np.uint16, 1)
    m_pos = read_acc(prim['attributes']['POSITION'], np.float32, 3).reshape(-1, 3)
    m_uv = read_acc(prim['attributes']['TEXCOORD_0'], np.float32, 2).reshape(-1, 2)
    m_tris = m_indices.reshape(-1, 3)
    
    for tri_idx, tri in enumerate(m_tris):
        u = m_uv[tri]
        u_mean = u.mean(axis=0)
        # Check distance to (0.552, 0.534) or (0.552, 0.466)
        d1 = np.linalg.norm(u_mean - np.array([0.552, 0.534]))
        d2 = np.linalg.norm(u_mean - np.array([0.552, 0.466]))
        if min(d1, d2) < 0.05:
            pos = m_pos[tri]
            print(f'Mesh {m_idx} ({mesh.get("name")}) Tri {tri_idx}: u_mean={u_mean}, pos_center={pos.mean(axis=0)}')

