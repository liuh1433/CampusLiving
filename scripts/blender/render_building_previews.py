import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(r"F:\桌面\重要\实习\校园")
PREVIEW_DIR = ROOT / "assets" / "previews"

COLLECTION_TO_FILE = {
    "Library": "library_site.png",
    "TeachingBuildingA": "teaching_building_a_site.png",
    "Canteen": "canteen_site.png",
    "Gymnasium": "gymnasium_site.png",
    "TeachingBuildingB": "teaching_building_b_site.png",
    "DormitoryGroup": "dormitory_group_site.png",
    "Administration": "administration_site.png",
    "Laboratory": "laboratory_site.png",
    "ActivityCenter": "activity_center_site.png",
    "Cafe": "cafe_site.png",
}


def ensure_material(name, rgb):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = (rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, 1)
    bsdf = next((node for node in mat.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, 1)
        bsdf.inputs["Roughness"].default_value = 0.8
    return mat


def ensure_camera():
    camera = bpy.data.objects.get("preview_camera")
    if camera is None:
        bpy.ops.object.camera_add()
        camera = bpy.context.object
        camera.name = "preview_camera"
    camera.data.type = "ORTHO"
    bpy.context.scene.camera = camera
    return camera


def ensure_lights():
    sun = bpy.data.objects.get("preview_sun")
    if sun is None:
        bpy.ops.object.light_add(type="SUN")
        sun = bpy.context.object
        sun.name = "preview_sun"
    sun.data.energy = 3.2
    sun.rotation_euler = (math.radians(45), 0, math.radians(35))

    area = bpy.data.objects.get("preview_area_light")
    if area is None:
        bpy.ops.object.light_add(type="AREA")
        area = bpy.context.object
        area.name = "preview_area_light"
    area.location = (0, -18, 35)
    area.data.energy = 350
    area.data.size = 45


def collection_objects(collection):
    objects = []
    for obj in collection.objects:
        if obj.type in {"MESH", "FONT", "CURVE"}:
            objects.append(obj)
    return objects


def bounds_for_objects(objects):
    coords = []
    for obj in objects:
        if not obj.visible_get():
            continue
        for corner in obj.bound_box:
            coords.append(obj.matrix_world @ Vector(corner))
    if not coords:
        return Vector((0, 0, 0)), Vector((20, 20, 20))
    min_v = Vector((min(v.x for v in coords), min(v.y for v in coords), min(v.z for v in coords)))
    max_v = Vector((max(v.x for v in coords), max(v.y for v in coords), max(v.z for v in coords)))
    return min_v, max_v


def set_visibility(active_collection_name):
    for collection in bpy.data.collections:
        if collection.name in COLLECTION_TO_FILE:
            hide = collection.name != active_collection_name
            collection.hide_viewport = hide
            collection.hide_render = hide


def make_site_tile(center, size, collection_name):
    mat = ensure_material("mat_preview_site_green", (168, 224, 176))
    tile_name = f"preview_tile_{collection_name}"
    obj = bpy.data.objects.get(tile_name)
    if obj is None:
        bpy.ops.mesh.primitive_cube_add(size=1)
        obj = bpy.context.object
        obj.name = tile_name
        obj.data.materials.append(mat)
    obj.location = (center.x, center.y, -0.09)
    obj.dimensions = (size, size * 0.72, 0.08)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.hide_viewport = False
    obj.hide_render = False
    return obj


def hide_preview_tiles(except_name=None):
    for obj in bpy.data.objects:
        if obj.name.startswith("preview_tile_") and obj.name != except_name:
            obj.hide_viewport = True
            obj.hide_render = True


def aim_camera(camera, center, radius):
    camera.location = (center.x + radius * 0.95, center.y - radius * 0.95, center.z + radius * 0.7)
    direction = center - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    camera.data.ortho_scale = max(radius * 1.35, 22)


def setup_render():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.eevee.taa_render_samples = 64
    scene.render.resolution_x = 1400
    scene.render.resolution_y = 1000
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "Medium High Contrast"
    scene.world.color = (0.72, 0.88, 0.92)
    scene.render.film_transparent = False


def render_one(collection_name, filename):
    collection = bpy.data.collections.get(collection_name)
    if collection is None:
        print(f"Missing collection: {collection_name}")
        return False

    set_visibility(collection_name)
    objects = collection_objects(collection)
    min_v, max_v = bounds_for_objects(objects)
    center = (min_v + max_v) / 2
    extent = max(max_v.x - min_v.x, max_v.y - min_v.y, max_v.z - min_v.z)
    offset = Vector((center.x, center.y, 0))
    for obj in objects:
        obj.location -= offset

    min_v, max_v = bounds_for_objects(objects)
    center = (min_v + max_v) / 2
    extent = max(max_v.x - min_v.x, max_v.y - min_v.y, max_v.z - min_v.z)
    tile_size = max(extent * 1.7, 44)
    tile = make_site_tile(center, tile_size, collection_name)
    hide_preview_tiles(tile.name)

    camera = ensure_camera()
    aim_camera(camera, center + Vector((0, 0, 3)), max(extent * 1.55, 34))

    bpy.context.scene.render.filepath = str(PREVIEW_DIR / filename)
    bpy.ops.render.render(write_still=True)
    for obj in objects:
        obj.location += offset
    return True


def main():
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    setup_render()
    ensure_lights()
    rendered = []
    for collection_name, filename in COLLECTION_TO_FILE.items():
        if render_one(collection_name, filename):
            rendered.append(filename)
    for collection in bpy.data.collections:
        if collection.name in COLLECTION_TO_FILE:
            collection.hide_viewport = False
            collection.hide_render = False
    hide_preview_tiles()
    print("Rendered building site previews:", ", ".join(rendered))


if __name__ == "__main__":
    main()
