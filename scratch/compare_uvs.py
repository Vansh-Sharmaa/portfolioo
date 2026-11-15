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

mesh0 = json_data['meshes'][0]
prim = mesh0['primitives'][0]

uv0 = read_acc(prim['attributes']['TEXCOORD_0'], np.float32, 2).reshape(-1, 2)
uv1 = read_acc(prim['attributes']['TEXCOORD_1'], np.float32, 2).reshape(-1, 2)

print('UV0 range:', uv0.min(axis=0), uv0.max(axis=0))
print('UV1 range:', uv1.min(axis=0), uv1.max(axis=0))
print('Are UV0 and UV1 different?', not np.allclose(uv0, uv1))

