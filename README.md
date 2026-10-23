# ORYQEN — Cinematic 3D Edition

A premium, cinematic rebuild of the ORYQEN site: real-time Three.js scenes (React Three
Fiber + Drei), the original ORYQEN Guardian GLB, scroll-linked choreography (Framer Motion)
and an icy-blue / cyan / navy glassmorphism design system.

**Nothing was removed from the original website.** Every heading, paragraph, feature
description, FAQ answer, disclaimer, navigation item, button label, footer detail and
release-status message is preserved. A regression test suite proves it (see *Verification*).

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

## Project structure

```
app/
  layout.tsx              metadata, viewport, skip link
  page.tsx                the whole landing page (original copy, unchanged)
  globals.css             cinematic design system + responsive rules
  cinematic-core.tsx      3D Experience section: Guardian stage, CLARITY/TRUST/CONTROL
  components/
    Reveal.tsx            scroll reveal + section header
    Tilt.tsx              pointer-driven 3D tilt (CSS-variable based, no re-renders)
    AppScreen.tsx         the ORYQEN phone UI used in the hero / experience / download
    Brand.tsx             logo lockup
    CommandPalette.tsx    ⌘K / Ctrl+K quick navigation
    ScrollProgress.tsx    top progress rail
    HoloCore.tsx          holographic CLARITY / TRUST / CONTROL core explorer
    JourneyLab.tsx        interactive product walkthrough
    FeatureGrid.tsx       the four platform features
    ExperienceTimeline.tsx scroll-linked spatial timeline
    useMotionPreference.ts SSR-safe reduced-motion hook
  scene/
    StageGate.tsx         WebGL2 probe, lazy mount, error boundary, context-loss fallback
    HeroStage.tsx         hero scene entry + static fallback art
    HeroScene.tsx         crystal, orbital rings, holographic panels, particles, shards
    BackdropStage.tsx     fixed ambient layer entry + CSS fallback
    CinematicBackdrop.tsx page-wide nebula, orbital haze, particle drift
    OrbitalRings.tsx      reusable additive ring system
    Dust.tsx              reusable GPU particle field
    HoloPanels.tsx        floating holographic data panels
    textures.ts           procedural canvas textures (no external HDRIs)
  robot/
    RobotStage.tsx        DOM wrapper: lazy start, probe, fallback, pointer/keyboard input
    RobotCanvas.tsx       R3F canvas, studio lighting, orbit, adaptive DPR, atmosphere
    GuardianGLB.tsx       loads public/oryqen-guardian-v8.glb with the head rig
    robot-types.ts        CLARITY / TRUST / CONTROL presets
    webgl.ts              WebGL2 preflight probe
    OryqenRobot.tsx       previous procedural robot (kept for reference, not mounted)
    robot-assets.ts       geometry/material library for the procedural robot
public/
  oryqen-guardian-v8.glb  the original Guardian 3D model (unchanged)
  oryqen-guardian.webp    the original static Guardian artwork (used as fallback)
  favicon.svg
tests/                    copy + behaviour regression tests
scripts/verify-rendered.mjs
```

## 3D + motion

| Area | What happens |
| --- | --- |
| Hero | Floating phone with pointer tilt, orbital ring system, procedural crystal, holographic panels, glass shards, 720 glowing particles, parallax on cursor + scroll |
| Page backdrop | Fixed nebula + giant orbital haze + drifting particles behind every section |
| 3D Experience | The original Guardian GLB with orbit controls, cursor head tracking, breathing, mode-driven emissive colour, plus new rings / dust / floor halo |
| CLARITY / TRUST / CONTROL | Unchanged presets: cyan/violet/teal accents, different pulse, breathing speed and head-tracking limits |
| Controls | Mode buttons, RESET (camera + head), PAUSE, drag-to-orbit, arrow keys, Home/Escape |
| Holo core | Three orbital rings, core, satellites, holographic HUD driven by the three tabs |
| Features | Pointer tilt with spotlight, orbiting geometry and scan line |
| Experience | Scroll-linked rail and phone rotation (Framer Motion `useScroll`) |
| FAQ | Height-animated accordion, correct `aria-expanded` / region semantics |

## Graceful degradation

* **No WebGL2 / context lost / render error** → `StageGate` and `RobotStage` swap in labelled
  static compositions. The Guardian falls back to the original `oryqen-guardian.webp`, with
  a "Try 3D again" control.
* **Reduced motion** → no WebGL canvases are mounted at all, every CSS animation is stopped
  and Framer Motion renders final states immediately.
* **No JavaScript** → all copy is server-rendered and readable (verified in tests).
* **Constrained devices** → software rasterisers are detected and given a lower pixel ratio;
  particle counts and shard counts are reduced.
* Canvases render on demand when paused/offscreen and pause entirely when the tab is hidden.

## Release links (unchanged behaviour)

Copy `.env.example` to `.env.local` and fill in official URLs:

```
NEXT_PUBLIC_APK_URL=
NEXT_PUBLIC_PLAY_STORE_URL=
NEXT_PUBLIC_CONTACT_EMAIL=
```

Only `https:` URLs are accepted. Until then the buttons stay in their original
"APK COMING SOON" / "PLAY STORE SOON" state and the toast explains how to enable downloads.
No testimonial, capability, release date, download URL or security guarantee was invented.

## Verification

```bash
npm run typecheck     # TypeScript
npm test              # copy + behaviour regression tests
npm run build         # production build
npm run start & npm run verify http://localhost:3000   # rendered-HTML copy check
```

`tests/copy.mjs` holds the original copy inventory; the tests fail if any of it disappears,
if the Guardian GLB stops being the loaded asset, if the mode presets change, or if a
release URL is hard-coded.

## Notes & known limitations

* `app/robot/OryqenRobot.tsx` is the earlier procedural robot. It is no longer mounted (the
  GLB is the Guardian), but it is kept in the repo for reference.
* Procedural lighting and textures are generated in the browser; there are no external HDRI
  or texture downloads, so the scene works offline. The Google Fonts import still requests
  fonts from the network and falls back to system fonts.
* Software-rendered headless browsers run the scene at a few frames per second; real GPUs are
  far faster. Visual verification during development used SwiftShader.
