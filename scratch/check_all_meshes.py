import json, struct

with open('public/models/Computer/computer_setup.glb', 'rb') as f:
    f.read(4)
    struct.unpack('<II', f.read(8))
    chunk_len, chunk_type = struct.unpack('<II', f.read(8))
    json_data = json.loads(f.read(chunk_len).decode('utf-8'))

for i, mesh in enumerate(json_data['meshes']):
    print(f"Mesh {i}: {mesh.get('name')}")
    for j, prim in enumerate(mesh['primitives']):
        print(f"  Primitive {j}: material={prim.get('material')}, attributes={list(prim['attributes'].keys())}")

for i, node in enumerate(json_data['nodes']):
    print(f"Node {i}: {node.get('name')}, mesh={node.get('mesh')}, children={node.get('children')}")

