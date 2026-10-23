# ORYQEN V6 — Intelligence Guardian Edition

This version replaces only the **3D Experience** section's crystalline orb with an original ORYQEN humanoid robot concept image, created for this project. The image is located at `public/oryqen-guardian.webp`.

## What changed
- `app/cinematic-core.tsx`: responsive, accessible robot presentation with pointer-driven 2.5D parallax, mode selection, pause and reset controls.
- `app/globals.css`: isolated Guardian styles and mobile layout.
- `public/oryqen-guardian.webp`: new original robot artwork.
- Other landing page sections remain unchanged.

## Technical clarification
This edition deliberately uses an **image-based 2.5D visual** instead of a real-time 3D humanoid mesh. It avoids the reported WebGL context creation error entirely in this section, while preserving subtle cursor interaction and motion. The source image is a generated concept artwork, not a rigged 3D model; it cannot truly rotate 360 degrees. The artwork is illustrative, and any UI statistics appearing inside it are decorative, not real product metrics.

## Run
1. Extract the ZIP to a fresh directory.
2. Open PowerShell in the directory containing `package.json`.
3. Run `npm install` then `npm run dev`.
4. Visit `http://localhost:3000` and scroll to the 3D Experience section.

The original download buttons are not wired to a production APK unless configured separately.
