# Low-Poly Campus Building Assets Design

## Project Goal

Build a reusable low-poly cartoon university campus asset pack inspired by the provided Henan University Jinming Campus map. The first milestone focuses on 10 independent building `.glb` assets. A later milestone can place these assets into a full campus scene with roads, water, trees, sports fields, and labels.

The reference image is used for style, density, and visual language only. It is not treated as an accurate survey map.

## Visual Style

- Theme: low-poly cartoon university campus.
- Camera target style: isometric 45-degree top-down view, similar to a management simulation game map.
- Geometry: clean primitives, simple bevels, low segment counts, readable silhouettes.
- Surface treatment: flat colors with subtle variation, no photorealistic textures.
- Detail density: medium. Buildings should read clearly at campus-map distance.
- Mood: bright, friendly, educational, organized.

## Coordinate And Unit Rules

- Modeling unit: 1 Blender unit = 1 meter.
- Blender working axis: Z-up.
- Building origin: center of ground footprint.
- Ground alignment: bottom face sits on `Z = 0`.
- Forward direction: front facade faces negative Y unless a building-specific exception is noted.
- Export format: `.glb`.
- Each building is exported as a separate asset file.
- Geometry should be centered around the origin unless the asset intentionally contains multiple blocks, such as dormitory groups.

## Material Rules

- Use Principled BSDF materials.
- Roughness: `0.8`.
- Metallic: `0.0`.
- Prefer flat colors over image textures.
- Windows use semi-transparent or opaque blue-tinted material depending on exporter compatibility.
- Every asset should include these basic material categories when applicable:
  - `mat_wall_primary`
  - `mat_wall_secondary`
  - `mat_roof`
  - `mat_glass`
  - `mat_trim`
  - `mat_ground_detail`

## Output Structure

Recommended project folders:

```text
assets/
  blender/
    campus_assets.blend
  glb/
    library.glb
    teaching_building_a.glb
    canteen.glb
    gymnasium.glb
    teaching_building_b.glb
    dormitory_group.glb
    administration.glb
    laboratory.glb
    activity_center.glb
    cafe.glb
  previews/
scripts/
  blender/
    create_campus_assets.py
```

## Asset Naming

Objects use lowercase snake case:

- Main building body: `<asset>_body`
- Roof: `<asset>_roof`
- Window group: `<asset>_windows`
- Door: `<asset>_door`
- Decorative feature: `<asset>_<feature>`

Collections use title-like asset names:

- `Library`
- `TeachingBuildingA`
- `Canteen`
- `Gymnasium`
- `TeachingBuildingB`
- `DormitoryGroup`
- `Administration`
- `Laboratory`
- `ActivityCenter`
- `Cafe`

## Shared Modeling Components

These components can be reused by script helpers:

- Rectangular building block with optional bevel.
- Flat roof slab.
- Gabled or arched roof.
- Repeated window grid.
- Vertical glass curtain wall strip.
- Door block with trim frame.
- Balcony protrusion.
- Column row.
- Awning or canopy.
- Vent pipe and chimney.
- Simple railing.
- Low-poly tree and plaza props for later scene assembly.

## Building Specifications

### 1. Library

- File: `library.glb`
- Footprint: `42m x 28m`
- Height: `18m`
- Floors: 5
- Main form: large rectangular academic building with a slightly taller central glass volume.
- Primary color: warm light stone `RGB(230, 216, 188)`.
- Secondary color: muted terracotta `RGB(184, 96, 76)`.
- Roof color: pale gray `RGB(190, 196, 198)`.
- Glass color: cyan blue `RGB(95, 180, 210)`.
- Key features:
  - Front glass curtain wall centered on facade.
  - Repeated vertical window strips on both side wings.
  - Low flat roof with skylight boxes.
  - Broad front steps and simple entry canopy.
- Complexity target: high among this asset pack; should become a landmark.

### 2. Teaching Building A

- File: `teaching_building_a.glb`
- Footprint: L-shaped, main wing `50m x 12m`, side wing `26m x 12m`
- Height: `15m`
- Floors: 4
- Main form: L-shaped long teaching block.
- Primary color: off-white `RGB(238, 238, 226)`.
- Secondary color: soft red brick `RGB(180, 88, 76)`.
- Roof color: blue gray `RGB(92, 128, 150)`.
- Glass color: pale blue `RGB(130, 190, 220)`.
- Key features:
  - L-shaped footprint.
  - Curved or faceted lecture hall protrusion near the inner corner.
  - Short elevated corridor bridge attached to one wing.
  - Dense repeated classroom windows.
- Complexity target: high because of the L shape and lecture hall volume.

### 3. Canteen

- File: `canteen.glb`
- Footprint: `34m x 24m`
- Height: `12m`
- Floors: 3
- Main form: stepped terrace building.
- Primary color: cream `RGB(238, 222, 184)`.
- Secondary color: light orange `RGB(226, 154, 86)`.
- Roof color: warm gray `RGB(174, 166, 150)`.
- Glass color: blue green `RGB(100, 176, 180)`.
- Key features:
  - Three stacked floor plates, each upper level slightly smaller.
  - Roof terrace railing.
  - Wide front entrance with food-hall glass panels.
  - Small side service door.
- Complexity target: medium.

### 4. Gymnasium

- File: `gymnasium.glb`
- Footprint: `46m x 32m`
- Height: `18m`
- Floors: 2 visual levels
- Main form: sports hall with curved dome or barrel roof.
- Primary color: light concrete `RGB(210, 214, 208)`.
- Secondary color: teal accent `RGB(70, 156, 150)`.
- Roof color: cool silver `RGB(180, 188, 194)`.
- Glass color: deep blue `RGB(70, 130, 180)`.
- Key features:
  - Large arched roof with low-poly segment count.
  - Visible roof truss ribs or repeated arch strips.
  - Tall front glass entrance.
  - Small ticket/check-in canopy.
- Complexity target: high because curved roof needs controlled geometry.

### 5. Teaching Building B

- File: `teaching_building_b.glb`
- Footprint: `30m x 30m`
- Height: `16m`, tower height `24m`
- Floors: 4 plus tower
- Main form: square academic block with rooftop tower.
- Primary color: pale gray white `RGB(232, 235, 230)`.
- Secondary color: muted blue `RGB(92, 134, 168)`.
- Roof color: charcoal blue `RGB(70, 88, 108)`.
- Glass color: light sky blue `RGB(130, 196, 230)`.
- Key features:
  - Square central block.
  - Smaller top tower positioned near center.
  - Symmetric window rows on all visible facades.
  - Small clock or emblem panel on tower front.
- Complexity target: medium.

### 6. Dormitory Group

- File: `dormitory_group.glb`
- Footprint: 3 parallel blocks, each `36m x 10m`
- Height: `18m`
- Floors: 6
- Main form: two or three repeated residential bars.
- Primary color: soft red brick `RGB(186, 92, 82)`.
- Secondary color: cream trim `RGB(238, 226, 198)`.
- Roof color: gray blue `RGB(106, 128, 146)`.
- Glass color: pale blue `RGB(132, 188, 214)`.
- Key features:
  - Parallel dormitory blocks with small gaps.
  - Repeated balcony protrusions on front facade.
  - Simple stairwell cores at one end of each block.
  - Optional laundry rail or rooftop utility boxes.
- Complexity target: medium-high due to repeated balconies.

### 7. Administration

- File: `administration.glb`
- Footprint: `36m x 26m`
- Height: `15m`
- Floors: 4
- Main form: symmetric rectangular civic building.
- Primary color: light stone `RGB(224, 212, 188)`.
- Secondary color: deep red accent `RGB(150, 68, 58)`.
- Roof color: dark muted red `RGB(128, 54, 48)`.
- Glass color: soft blue `RGB(120, 180, 210)`.
- Key features:
  - Central columned portico.
  - Symmetric side wings.
  - Slightly raised front plinth and stairs.
  - Formal roof cornice.
- Complexity target: medium.

### 8. Laboratory

- File: `laboratory.glb`
- Footprint: `38m x 20m`
- Height: `17m`
- Floors: 5
- Main form: technical building with utility roofscape.
- Primary color: cool white `RGB(232, 238, 238)`.
- Secondary color: mint green `RGB(122, 184, 154)`.
- Roof color: medium gray `RGB(142, 150, 152)`.
- Glass color: cyan blue `RGB(98, 178, 210)`.
- Key features:
  - Regular lab-window grid.
  - Rooftop ventilation pipes.
  - Two or three exhaust chimneys.
  - Side equipment box or service shaft.
- Complexity target: medium-high because rooftop silhouettes matter.

### 9. Activity Center

- File: `activity_center.glb`
- Footprint: `32m x 24m`
- Height: `13m`
- Floors: 3
- Main form: public center with curved glass facade and big canopy.
- Primary color: pale beige `RGB(232, 218, 194)`.
- Secondary color: coral accent `RGB(218, 112, 94)`.
- Roof color: warm dark gray `RGB(104, 104, 96)`.
- Glass color: turquoise `RGB(82, 184, 192)`.
- Key features:
  - Faceted curved glass front.
  - Large entrance canopy.
  - Poster/display panels near entrance.
  - Slightly playful asymmetry.
- Complexity target: high due to curved facade.

### 10. Cafe

- File: `cafe.glb`
- Footprint: `18m x 14m`
- Height: `6m`
- Floors: 1
- Main form: low standalone campus cafe.
- Primary color: warm cream `RGB(242, 224, 186)`.
- Secondary color: coffee brown `RGB(132, 86, 56)`.
- Roof color: terracotta `RGB(184, 82, 54)`.
- Glass color: light blue `RGB(128, 198, 220)`.
- Key features:
  - Low building with pitched or flat roof.
  - Front awning.
  - Outdoor terrace deck.
  - Simple tables, chairs, and railing.
- Complexity target: medium, small but characterful.

## Campus Scene Reference For Later Milestone

The provided map suggests these later scene elements:

- Rounded rectangular campus island base.
- Dark perimeter roads with lane markings and crosswalks.
- Curving internal pedestrian paths.
- Lake or water feature near the center.
- Dense low-poly trees.
- Sports field and tennis/basketball courts.
- Small signs or floating labels.
- Buildings grouped by color-coded functional zones.

This full-scene assembly is intentionally outside the first asset milestone.

## Recommended Execution Order

1. Create shared helper functions for materials and primitive blocks.
2. Build simple rectangular assets first:
   - Teaching Building B
   - Administration
   - Laboratory
3. Build repeated-layout assets:
   - Dormitory Group
   - Library
   - Teaching Building A
4. Build shape-special assets:
   - Canteen
   - Gymnasium
   - Activity Center
   - Cafe
5. Export each collection to `.glb`.
6. Optionally render preview images from a fixed isometric camera.

## Success Criteria

- All 10 assets export as separate `.glb` files.
- Each building sits on `Z = 0`.
- Each building has recognizable silhouette and key features from its specification.
- Materials are flat, bright, and coherent with the low-poly campus map style.
- Assets are lightweight enough for real-time web viewing.
- No single building relies on image textures or external files.

## Known Risks

- Curved forms such as the gym roof and activity center facade need low segment counts to stay low-poly.
- Repeated windows and balconies can create excessive object counts if not grouped or instanced.
- Transparency in `.glb` may vary by viewer, so glass can be opaque blue if needed.
- The map reference is not dimensionally accurate, so exact campus reconstruction should not be promised.
