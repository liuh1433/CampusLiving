# Jinming Library Model Implementation

Goal: Reconstruct the library exterior from the supplied multi-view reference and make it inspectable in CampusLiving.

Architecture: A reproducible Blender Python generator creates an independent scene, editable source file and a GLB with semantic groups. A separate Vite entry uses Three.js to inspect that asset without changing the teaching-building application.

## Reference Decisions

- Treat the approximately 100 m width, 70 m depth and 45 m height as visual proportions, not survey measurements.
- Prioritize the real rear/side photographs and roof plan when the supplementary rendered elevations disagree.
- Model a recessed glazed entrance, tall stone frames, eight inferred main levels, lower lateral wings, a rear entrance, roof courtyard, mechanical enclosures and entrance plaza.
- Preserve the existing campus source file and older library experiments. New files use `library_jinming`.
- Interior room functions, exact floor plans and physical seat counts are not supplied; the exterior does not assert them.
- Blender coordinates are Z-up, front negative Y; GLB is Y-up, front positive Z. Units are meters.
- GLB meshes carry `buildingId`, `part` (building/roof/site), and `level` metadata. Material batching limits draw calls.

## Work

- [x] Read the existing project and identify asset loading conventions.
- [x] Establish model dimensions, coordinate system, output names and viewer contract.
- [x] Add asset checks for exported dimensions, floor metadata, valid geometry and synchronized public copy.
- [x] Generate `assets/blender/library_jinming.blend`, `assets/glb/library_jinming.glb`, and `public/assets/glb/library_jinming.glb` using `scripts/blender/build_library_jinming.py`.
- [x] Render front/rear aerial previews under `assets/previews/`.
- [x] Implement `/library.html`, camera presets, orbit controls, roof/site visibility, downloads and responsive layout.
- [x] Add navigation, multi-page build support, reference provenance and regeneration instructions.
- [x] Run existing and new Vitest checks and the Vite production build (7 files, 26 tests; production build passed).
- [x] Inspect desktop/mobile Playwright screenshots, verify canvas pixels and exercise camera/toggle/download interactions (1440 x 900 and 390 x 844; Vite download returned 2,493,160 bytes).

## Verification Commands

```powershell
& 'D:\software\blender.exe' --background --python-exit-code 1 --python scripts/blender/build_library_jinming.py -- --render
node node_modules/vitest/vitest.mjs run
node node_modules/vite/bin/vite.js build
node src/library/viewer.browser-check.mjs
node src/library/viewer.download-check.mjs
```

Blender location is machine-specific; the generator resolves all output paths relative to its own repository, not a hard-coded desktop path.

Browser checks require Playwright and Chromium. `LIBRARY_PLAYWRIGHT_MODULE` optionally points to the Playwright ESM module (use a `file:///` URL on Windows), `LIBRARY_CHROMIUM_PATH` selects a browser executable, and `LIBRARY_CHECK_OUTPUT` selects the screenshot directory. The download check uses a running Vite server via `LIBRARY_BASE_URL`.

## Recess Correction

The front setback is now 11.9 m, with diagonal returns at approximately 46.23 degrees to the front plane. These are reference-image estimates. Glass, mullions, floor footprints, canopy and entrance use a consistent recessed profile; raycast and vertex tests guard against floor plates protruding through the glazing.
