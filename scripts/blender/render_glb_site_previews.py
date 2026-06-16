import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(r"F:\桌面\重要\实习\校园")
GLB_DIR = ROOT / "assets" / "glb"
PREVIEW_DIR = ROOT / "assets" / "previews"

ASSETS = [
    ("library.glb", "library_site.png"),
    ("teaching_building_a.glb", "teaching_building_a_site.png"),
    ("canteen.glb", "canteen_site.png"),
    ("gymnasium.glb", "gymnasium_site.png"),
    ("teaching_building_b.glb", "teaching_building_b_site.png"),
    ("dormitory_group.glb", "dormitory_group_site.png"),
    ("administration.glb", "administration_site.png"),
    ("laboratory.glb", "laboratory_site.png"),
    ("activity_center.glb", "activity_center_site.png"),
    ("cafe.glb", "cafe_site.png"),
]


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def ensure_material(name, rgb):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.diffuse_color = (rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, 1)
    mat.use_nodes = True
    bsdf = next((node for node in mat.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
    if bsdf:
        bsdf.inputs["Base Color"].default_value = mat.diffuse_color
        bsdf.inputs["Roughness"].default_value = 0.8
    return mat


def bounds_for_meshes(objects):
    coords = []
    for obj in objects:
        if obj.type != "MESH":
            continue
        for corner in obj.bound_box:
            coords.append(obj.matrix_world @ Vector(corner))
    min_v = Vector((min(v.x for v in coords), min(v.y for v in coords), min(v.z for v in coords)))
    max_v = Vector((max(v.x for v in coords), max(v.y for v in coords), max(v.z for v in coords)))
    return min_v, max_v


def center_objects(objects):
    min_v, max_v = bounds_for_meshes(objects)
    center = (min_v + max_v) / 2
    for obj in objects:
        obj.location.x -= center.x
        obj.location.y -= center.y
    min_v, max_v = bounds_for_meshes(objects)
    lowest = min_v.z
    for obj in objects:
        obj.location.z -= lowest
    return bounds_for_meshes(objects)


def add_site_tile(min_v, max_v):
    mat = ensure_material("mat_clean_site_green", (169, 224, 176))
    width = max(max_v.x - min_v.x, max_v.y - min_v.y) * 1.35
    width = max(width, 28)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, -0.08))
    tile = bpy.context.object
    tile.name = "site_tile"
    tile.dimensions = (width, width * 0.72, 0.08)
    tile.data.materials.append(mat)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)


def add_lights():
    bpy.ops.object.light_add(type="SUN", location=(0, 0, 35))
    sun = bpy.context.object
    sun.name = "site_sun"
    sun.data.energy = 2.2
    sun.rotation_euler = (math.radians(45), 0, math.radians(35))

    bpy.ops.object.light_add(type="AREA", location=(0, -20, 32))
    area = bpy.context.object
    area.name = "site_softbox"
    area.data.energy = 420
    area.data.size = 42


def add_camera(min_v, max_v):
    center = (min_v + max_v) / 2
    extent_x = max_v.x - min_v.x
    extent_y = max_v.y - min_v.y
    extent_z = max_v.z - min_v.z
    radius = max(extent_x, extent_y, extent_z, 26)

    bpy.ops.object.camera_add()
    camera = bpy.context.object
    camera.name = "site_camera"
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = radius * 1.45
    camera.location = (radius * 1.15, -radius * 1.15, radius * 0.9)
    target = Vector((0, 0, center.z + extent_z * 0.25))
    direction = target - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = camera


def setup_render():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.eevee.taa_render_samples = 64
    scene.render.resolution_x = 1400
    scene.render.resolution_y = 1000
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "Medium High Contrast"
    scene.world.color = (0.72, 0.88, 0.92)


def render_asset(glb_name, png_name):
    clear_scene()
    bpy.ops.import_scene.gltf(filepath=str(GLB_DIR / glb_name))
    objects = list(bpy.context.scene.objects)
    min_v, max_v = center_objects(objects)
    add_site_tile(min_v, max_v)
    add_lights()
    add_camera(min_v, max_v)
    bpy.context.scene.render.filepath = str(PREVIEW_DIR / png_name)
    bpy.ops.render.render(write_still=True)


def main():
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    setup_render()
    rendered = []
    for glb_name, png_name in ASSETS:
        render_asset(glb_name, png_name)
        rendered.append(png_name)
    print("Rendered clean GLB site previews:", ", ".join(rendered))


if __name__ == "__main__":
    main()
