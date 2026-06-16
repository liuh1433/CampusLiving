# Low-Poly Campus Assets

This folder contains the generated Blender campus asset pack.

## Files

- `blender/campus_assets.blend`: editable Blender source scene with all generated building collections.
- `glb/*.glb`: individually exported building assets.

## Generated Assets

- `library.glb`
- `teaching_building_a.glb`
- `canteen.glb`
- `gymnasium.glb`
- `teaching_building_b.glb`
- `dormitory_group.glb`
- `administration.glb`
- `laboratory.glb`
- `activity_center.glb`
- `cafe.glb`

## Regeneration

Run or send this script to Blender:

```text
scripts/blender/create_campus_assets.py
```

The script clears the Blender scene, builds the 10 low-poly buildings, saves the `.blend` file, and exports each building as a separate `.glb`.

## Blender MCP

The project uses `external/blender-mcp/addon.py` from `ahujasid/blender-mcp`.

In this session the BlenderMCP add-on socket was started on:

```text
127.0.0.1:9876
```

The script was executed through the same JSON socket protocol used by BlenderMCP.
