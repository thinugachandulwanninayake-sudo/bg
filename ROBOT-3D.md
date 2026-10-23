# ORYQEN V7: real-time 3D Guardian

Replaces only the static/2.5D robot in the "3D Experience" section (`.guardian-stage`).
Everything else (copy, chips, rings, CLARITY/TRUST/CONTROL, RESET, PAUSE, other sections) is unchanged.

## Files
- `app/robot/RobotStage.tsx`: DOM wrapper. Lazy start near viewport, WebGL2 probe, error boundary, context-loss recovery, static fallback, pointer + keyboard input, a11y.
- `app/robot/RobotCanvas.tsx`: R3F `<Canvas>`, procedural lighting, OrbitControls, camera rig, adaptive pixel ratio.
- `app/robot/OryqenRobot.tsx`: the robot (procedural geometry) and its animation.
- `app/robot/robot-assets.ts`: shared geometry / materials / canvas textures + disposal.
- `app/robot/webgl.ts`: WebGL2 preflight probe.
- `app/robot/robot-types.ts`: mode presets and shared types.
- `app/cinematic-core.tsx`: swapped `<Image>` + parallax for `<RobotStage/>`; RESET now resets camera and head.
- `app/globals.css`: one appended block (`V7`). Existing rules untouched.

## Modes
CLARITY (cyan, normal), TRUST (violet, slower breathing/pulse, softer head range), CONTROL (teal, faster pulse, snappier tracking).

## Controls
Mouse: head follows cursor (limited angles). Drag: orbit. Touch: horizontal swipe orbits, vertical swipe scrolls the page.
Keyboard (viewer focused): arrows rotate/tilt, Home/Escape reset.

## If the 3D view does not appear
three r180 requires **WebGL 2**. Open `chrome://gpu` and check "WebGL2: Hardware accelerated".
Enable "Use graphics acceleration when available" in chrome://settings/system, update the GPU driver, then press "Try 3D again".
The page shows the previous artwork as a labelled static preview in the meantime.
