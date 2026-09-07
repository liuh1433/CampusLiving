# Unified Campus Layout

Goal: Place the existing library and six teaching buildings on the user-supplied Jinming campus plan in the homepage's shared Three.js scene. Do not model other buildings.

Reference: `jmxq.jpg`, 6398 x 8267 pixels. Layout coordinates use a normalized 1376 x 1777 plane, north at the top, east at the right. World X points east and negative Z points north. Approximate scale: 0.7 scene units per normalized pixel, not surveyed geography.

The library is west of Marco Plaza, with its entrance facing the west gate. Teaching building 1 is south of the plaza; buildings 2, 3, 5 and 6 run south to north, connected by building 4 on the east. Existing presentation plinths and annotations are excluded. The map itself supplies all other places as a flat bitmap.

Implementation:
- [x] Add placement, orientation and source-geometry regression tests.
- [x] Add `src/data/campusLayout.js` for calibrated footprints and landmarks; prepare a local web map texture with `scripts/prepare-campus-map.mjs`.
- [x] Add `src/three/campusMap.js` for shared model assembly, independent source transforms and the flat map.
- [x] Integrate assembly and fitted map cameras in `src/three/scene.js`, keeping teaching rooms available and adding an exterior-only library state.
- [x] Update homepage navigation, compact building list, camera controls and responsive canvas framing.
- [x] Verify seven footprints, west-facing library, default/top/full-campus views, desktop/mobile rendering, model picking and return from a teaching room.

Product direction from the second reference: anonymous identity and space-based companionship. Existing presence/chat data stays explicitly simulated. No backend, real occupancy, new rooms or extra buildings are introduced in this step.

Commands: `node node_modules/vitest/vitest.mjs run`; `node node_modules/vite/bin/vite.js build`; `node scripts/check-campus.mjs`; `node src/library/viewer.browser-check.mjs` with the Playwright environment variables documented in `README.md`.
