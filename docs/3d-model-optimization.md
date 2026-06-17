# 3D Model Optimization

Keep runtime loading light by serving VRM and GLB assets from `public/models` and optimizing large files before shipping.

## Install

```bash
npm install -g @gltf-transform/cli
```

## Inspect a model

```bash
gltf-transform inspect input.glb
```

Use this to review mesh count, texture sizes, animation count, and file structure before deciding what to compress.

## Optimize a model

```bash
gltf-transform optimize input.glb output.glb --compress meshopt --texture-compress webp
```

Recommended workflow:

- Start from the source `.glb` or a VRM-exported GLB companion file when available.
- Run `inspect` first to find oversized textures or dense meshes.
- Run `optimize` and compare visual quality in the app.
- Re-test animation, materials, and silhouette after compression.
- Copy the final asset into `frontend/public/models`.
