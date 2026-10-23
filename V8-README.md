# ORYQEN V8 — GLB Guardian Edition

This build replaces the previous stylized procedural JSX robot with a **real, original GLB asset** at `public/oryqen-guardian-v8.glb`. It is an original hard-surface, stylized sci-fi **bust** (helmet, articulated neck, shoulders, chest, arms and plinth), assembled from 95 3D parts with metallic PBR materials and emissive cyan accents. It is **not a photorealistic artist-sculpted character**; that would require further Blender sculpting, detailed topology and texture maps.

## Changes
- `app/robot/GuardianGLB.tsx` — GLB loader, reactive head rig, animated breathing, glow modes, safe instance material cleanup.
- `app/robot/RobotCanvas.tsx` — uses GLB component in existing R3F Canvas with existing orbit, quality, lighting and WebGL guards.
- `public/oryqen-guardian-v8.glb` — real standalone 3D model with `HeadRig` hierarchy.
- `create_guardian.py` — reproducible model generation source (Python + trimesh).

## Run

```powershell
npm install
npm run dev
```

Open `http://localhost:3000` and scroll to 3D Experience. Drag to orbit. Move the cursor to guide the head. Use existing pause, reset and mode controls. On mobile, drag to orbit.

## Verification
The GLB file was exported successfully and is a standalone binary glTF asset. Full Next.js build and physical-device browser verification should be run locally. A supported WebGL browser is required for the live 3D view; existing fallback remains for failures.
