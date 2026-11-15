import json, struct

with open('public/models/Computer/computer_setup.glb', 'rb') as f:
    magic = f.read(4)
    version, length = struct.unpack('<II', f.read(8))
    chunk_len, chunk_type = struct.unpack('<II', f.read(8))
    json_data = json.loads(f.read(chunk_len).decode('utf-8'))

meshes = json_data.get('meshes', [])
print('Meshes in GLB:', len(meshes))
for i, m in enumerate(meshes):
    print(f'Mesh {i}: {m.get("name")}')

nodes = json_data.get('nodes', [])
for i, n in enumerate(nodes):
    print(f'Node {i}: {n.get("name")}')

