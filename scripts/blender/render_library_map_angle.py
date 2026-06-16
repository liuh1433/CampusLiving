import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(r"F:\桌面\重要\实习\校园")
GLB_PATH = ROOT / "assets" / "glb" / "library.glb"
OUT_PATH = ROOT / "assets" / "previews" / "library_map_angle.png"


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def ensure_mat(name, rgb, roughness=0.8):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.diffuse_color = (rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, 1)
    mat.use_nodes = True
    bsdf = next((node for node in mat.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
    if bsdf:
        bsdf.inputs["Base Color"].default_value = mat.diffuse_color
        bsdf.inputs["Roughness"].default_value = roughness
    return mat


def scene_bounds(objects):
    coords = []
    for obj in objects:
        if obj.type != "MESH":
            continue
        for corner in obj.bound_box:
            coords.append(obj.matrix_world @ Vector(corner))
    return (
        Vector((min(v.x for v in coords), min(v.y for v in coords), min(v.z for v in coords))),
        Vector((max(v.x for v in coords), max(v.y for v in coords), max(v.z for v in coords))),
    )


def center_imported_objects(objects):
    min_v, max_v = scene_bounds(objects)
    center = (min_v + max_v) / 2
    for obj in objects:
        obj.location.x -= center.x
        obj.location.y -= center.y
    min_v, max_v = scene_bounds(objects)
    for obj in objects:
        obj.location.z -= min_v.z
    return scene_bounds(objects)


def add_map_site(min_v, max_v):
    ground = ensure_mat("mat_map_ground_mint", (144, 215, 170))
    path = ensure_mat("mat_map_path_warm", (239, 226, 186))
    road = ensure_mat("mat_map_road_charcoal", (58, 64, 66))

    footprint = max(max_v.x - min_v.x, max_v.y - min_v.y)
    base_w = max(footprint * 1.6, 52)
    base_h = base_w * 0.72

    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, -0.08))
    base = bpy.context.object
    base.name = "library_map_green_base"
    base.dimensions = (base_w, base_h, 0.08)
    base.data.materials.append(ground)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    # Simple campus-map style paths around the building.
    for name, loc, dims in [
        ("library_front_path", (0, -base_h * 0.18, 0.02), (base_w * 0.55, 2.2, 0.08)),
        ("library_side_path", (-base_w * 0.22, 0, 0.02), (2.2, base_h * 0.58, 0.08)),
        ("library_back_path", (base_w * 0.16, base_h * 0.18, 0.02), (base_w * 0.42, 2.0, 0.08)),
    ]:
        bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
        obj = bpy.context.object
        obj.name = name
        obj.dimensions = dims
        obj.data.materials.append(path)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    # A clipped road band at the top-left edge, echoing the reference map.
    bpy.ops.mesh.primitive_cube_add(size=1, location=(-base_w * 0.18, base_h * 0.43, 0.01))
    road_obj = bpy.context.object
    road_obj.name = "library_map_edge_road"
    road_obj.dimensions = (base_w * 0.85, 4.2, 0.09)
    road_obj.rotation_euler[2] = math.radians(-18)
    road_obj.data.materials.append(road)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)


def add_trees():
    trunk = ensure_mat("mat_tree_trunk", (126, 88, 52))
    leaf_a = ensure_mat("mat_tree_leaf_green", (88, 164, 76))
    leaf_b = ensure_mat("mat_tree_leaf_yellow", (226, 178, 54))
    positions = [(-24, -10), (-20, 9), (-12, 15), (16, -13), (22, 8), (27, -2), (-28, 3)]
    for i, (x, y) in enumerate(positions):
        bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.22, depth=1.4, location=(x, y, 0.7))
        trunk_obj = bpy.context.object
        trunk_obj.name = f"library_tree_trunk_{i}"
        trunk_obj.data.materials.append(trunk)
        bpy.ops.mesh.primitive_cone_add(vertices=7, radius1=1.0, radius2=0.2, depth=2.6, location=(x, y, 2.4))
        leaf = bpy.context.object
        leaf.name = f"library_tree_leaf_{i}"
        leaf.data.materials.append(leaf_b if i in {2, 5} else leaf_a)


def add_lighting():
    bpy.ops.object.light_add(type="SUN", location=(0, 0, 60))
    sun = bpy.context.object
    sun.name = "map_angle_sun"
    sun.data.energy = 2.6
    sun.rotation_euler = (math.radians(48), 0, math.radians(32))

    bpy.ops.object.light_add(type="AREA", location=(-20, -28, 36))
    area = bpy.context.object
    area.name = "map_angle_softbox"
    area.data.energy = 280
    area.data.size = 52


def add_camera(min_v, max_v):
    center = (min_v + max_v) / 2
    extent = max(max_v.x - min_v.x, max_v.y - min_v.y, max_v.z - min_v.z)

    bpy.ops.object.camera_add()
    camera = bpy.context.object
    camera.name = "map_angle_ortho_camera"
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = extent * 1.65

    # Match the reference map: orthographic, high view, x/y diagonal, looking down.
    camera.location = (extent * 0.9, -extent * 1.05, extent * 0.95)
    target = Vector((0, 0, center.z + (max_v.z - min_v.z) * 0.25))
    direction = target - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = camera


def setup_render():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.eevee.taa_render_samples = 64
    scene.render.resolution_x = 1500
    scene.render.resolution_y = 1000
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "Medium High Contrast"
    scene.world.color = (0.41, 0.72, 0.66)
    scene.render.film_transparent = False


def main():
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    clear_scene()
    setup_render()
    bpy.ops.import_scene.gltf(filepath=str(GLB_PATH))
    objects = list(bpy.context.scene.objects)
    min_v, max_v = center_imported_objects(objects)
    add_map_site(min_v, max_v)
    add_trees()
    add_lighting()
    add_camera(min_v, max_v)
    bpy.context.scene.render.filepath = str(OUT_PATH)
    bpy.ops.render.render(write_still=True)
    print(f"Rendered library map-angle preview: {OUT_PATH}")


if __name__ == "__main__":
    main()
