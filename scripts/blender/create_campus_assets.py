import math
import os
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(r"F:\桌面\重要\实习\校园")
GLB_DIR = ROOT / "assets" / "glb"
BLEND_DIR = ROOT / "assets" / "blender"


def ensure_dirs():
    GLB_DIR.mkdir(parents=True, exist_ok=True)
    BLEND_DIR.mkdir(parents=True, exist_ok=True)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.images):
        for item in list(block):
            if item.users == 0:
                block.remove(item)


def mat(name, rgb, alpha=1.0, roughness=0.8):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
    material.diffuse_color = (rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, alpha)
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, alpha)
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = 0
        if alpha < 1:
            bsdf.inputs["Alpha"].default_value = alpha
            material.blend_method = "BLEND"
            material.use_screen_refraction = True
    return material


def cube(name, loc, scale, material, collection, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material:
        obj.data.materials.append(material)
    if bevel:
        modifier = obj.modifiers.new(name="soft_bevel", type="BEVEL")
        modifier.width = bevel
        modifier.segments = 1
        modifier.affect = "EDGES"
        obj.modifiers.new(name="weighted_normals", type="WEIGHTED_NORMAL")
    move_to_collection(obj, collection)
    return obj


def move_to_collection(obj, collection):
    for existing in obj.users_collection:
        existing.objects.unlink(obj)
    collection.objects.link(obj)


def make_collection(name):
    collection = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(collection)
    return collection


def window_grid(prefix, collection, material, facade, x_range, z_levels, y, width=1.1, height=1.4, depth=0.08):
    for i, x in enumerate(x_range):
        for j, z in enumerate(z_levels):
            cube(f"{prefix}_window_{i}_{j}", (x, y, z), (width, depth, height), material, collection)


def side_window_grid(prefix, collection, material, x, y_range, z_levels, width=0.08, depth=1.1, height=1.4):
    for i, y in enumerate(y_range):
        for j, z in enumerate(z_levels):
            cube(f"{prefix}_side_window_{i}_{j}", (x, y, z), (width, depth, height), material, collection)


def columns(prefix, collection, material, xs, y, height, radius=0.35):
    for i, x in enumerate(xs):
        bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=radius, depth=height, location=(x, y, height / 2))
        obj = bpy.context.object
        obj.name = f"{prefix}_column_{i}"
        obj.data.materials.append(material)
        move_to_collection(obj, collection)


def barrel_roof(name, collection, material, width, length, radius, z, segments=8):
    verts = []
    faces = []
    for i in range(segments + 1):
        t = math.pi * i / segments
        x = -width / 2 + width * i / segments
        top_z = z + math.sin(t) * radius
        verts.append((x, -length / 2, top_z))
        verts.append((x, length / 2, top_z))
    for i in range(segments):
        a = i * 2
        faces.append((a, a + 1, a + 3, a + 2))
    mesh = bpy.data.meshes.new(f"{name}_mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.data.materials.append(material)
    collection.objects.link(obj)
    return obj


def faceted_curve_wall(prefix, collection, material, radius, width, z_center, height, segments=7):
    for i in range(segments):
        angle = math.radians(-55 + i * (110 / max(segments - 1, 1)))
        x = math.sin(angle) * radius
        y = -width / 2 + math.cos(angle) * radius
        panel = cube(f"{prefix}_curved_glass_{i}", (x, y, z_center), (4.2, 0.12, height), material, collection)
        panel.rotation_euler[2] = -angle


def add_label(name, collection, text, loc):
    font_curve = bpy.data.curves.new(name, "FONT")
    font_curve.body = text
    font_curve.size = 1.4
    font_curve.align_x = "CENTER"
    font_curve.align_y = "CENTER"
    obj = bpy.data.objects.new(name, font_curve)
    obj.location = loc
    obj.rotation_euler = (math.radians(65), 0, 0)
    collection.objects.link(obj)
    return obj


def create_materials():
    return {
        "glass": mat("mat_glass_campus_blue", (95, 180, 210), 0.82),
        "glass_deep": mat("mat_glass_deep_blue", (70, 130, 180), 0.86),
        "trim": mat("mat_trim_white", (242, 242, 232)),
        "dark": mat("mat_dark_roof", (72, 82, 92)),
        "stone": mat("mat_warm_stone", (230, 216, 188)),
        "brick": mat("mat_soft_brick", (184, 96, 76)),
        "cream": mat("mat_cream", (238, 226, 198)),
        "orange": mat("mat_light_orange", (226, 154, 86)),
        "teal": mat("mat_teal", (70, 156, 150)),
        "mint": mat("mat_mint_green", (122, 184, 154)),
        "coral": mat("mat_coral", (218, 112, 94)),
        "coffee": mat("mat_coffee_brown", (132, 86, 56)),
        "terracotta": mat("mat_terracotta", (184, 82, 54)),
        "gray": mat("mat_light_gray", (210, 214, 208)),
        "roof_gray": mat("mat_roof_gray", (174, 166, 150)),
        "ground": mat("mat_ground_pale_green", (166, 224, 174)),
    }


def make_library(m):
    c = make_collection("Library")
    cube("library_body", (0, 0, 9), (42, 28, 18), m["stone"], c, 0.08)
    cube("library_center_glass", (0, -14.08, 10), (13, 0.18, 15), m["glass"], c)
    cube("library_roof", (0, 0, 18.4), (43, 29, 0.8), m["roof_gray"], c)
    for x in (-9, 0, 9):
        cube(f"library_skylight_{x}", (x, 0, 19.1), (5, 7, 0.8), m["glass"], c)
    window_grid("library_front_left", c, m["glass"], "front", [-18, -14, -10], [4, 7, 10, 13, 16], -14.1)
    window_grid("library_front_right", c, m["glass"], "front", [10, 14, 18], [4, 7, 10, 13, 16], -14.1)
    cube("library_entry_steps", (0, -17.3, 0.35), (16, 4, 0.7), m["trim"], c)
    cube("library_entry_canopy", (0, -15.8, 4.2), (13, 3, 0.5), m["dark"], c)
    add_label("library_label", c, "Library", (0, -18.8, 2.2))
    return c


def make_teaching_a(m):
    c = make_collection("TeachingBuildingA")
    cube("teaching_a_main_wing", (0, 0, 7.5), (50, 12, 15), m["trim"], c, 0.06)
    cube("teaching_a_side_wing", (-19, 19, 7.5), (12, 26, 15), m["cream"], c, 0.06)
    cube("teaching_a_roof_main", (0, 0, 15.35), (51, 13, 0.7), m["dark"], c)
    cube("teaching_a_roof_side", (-19, 19, 15.35), (13, 27, 0.7), m["dark"], c)
    bpy.ops.mesh.primitive_cylinder_add(vertices=14, radius=7, depth=8, location=(-10, -7.2, 4), rotation=(math.pi / 2, 0, 0))
    hall = bpy.context.object
    hall.name = "teaching_a_faceted_lecture_hall"
    hall.scale.x = 1.15
    hall.data.materials.append(m["brick"])
    move_to_collection(hall, c)
    cube("teaching_a_corridor_bridge", (18, 8.5, 5), (18, 4, 4), m["cream"], c, 0.05)
    window_grid("teaching_a_main", c, m["glass"], "front", [-21, -15, -9, 3, 9, 15, 21], [4, 7, 10, 13], -6.1)
    side_window_grid("teaching_a_side", c, m["glass"], -25.1, [8, 13, 18, 23, 28], [4, 7, 10, 13])
    add_label("teaching_a_label", c, "Teaching A", (0, -9.5, 2.2))
    return c


def make_canteen(m):
    c = make_collection("Canteen")
    cube("canteen_level_1", (0, 0, 2), (34, 24, 4), m["cream"], c, 0.06)
    cube("canteen_level_2", (0, 1, 6), (28, 19, 4), m["orange"], c, 0.06)
    cube("canteen_level_3", (0, 2, 10), (21, 14, 4), m["cream"], c, 0.06)
    cube("canteen_roof_terrace", (0, 2, 12.35), (22, 15, 0.7), m["roof_gray"], c)
    for x in (-8, -4, 0, 4, 8):
        cube(f"canteen_front_glass_{x}", (x, -12.1, 2.8), (2.2, 0.12, 2.7), m["glass"], c)
    for x in (-11, -5, 1, 7):
        cube(f"canteen_roof_railing_{x}", (x, -5.3, 13.2), (3.6, 0.16, 1.0), m["trim"], c)
    add_label("canteen_label", c, "Canteen", (0, -14.5, 2.2))
    return c


def make_gymnasium(m):
    c = make_collection("Gymnasium")
    cube("gymnasium_base", (0, 0, 5), (46, 32, 10), m["gray"], c, 0.08)
    barrel_roof("gymnasium_barrel_roof", c, m["roof_gray"], 46, 32, 8, 10, 9)
    for x in [-20, -15, -10, -5, 0, 5, 10, 15, 20]:
        cube(f"gymnasium_roof_rib_{x}", (x, 0, 14.5), (0.35, 33, 0.5), m["teal"], c)
    cube("gymnasium_front_glass", (0, -16.15, 5), (12, 0.2, 7), m["glass_deep"], c)
    cube("gymnasium_entry_canopy", (0, -18.4, 4.2), (15, 4, 0.5), m["teal"], c)
    add_label("gymnasium_label", c, "Gymnasium", (0, -20.5, 2.2))
    return c


def make_teaching_b(m):
    c = make_collection("TeachingBuildingB")
    cube("teaching_b_body", (0, 0, 8), (30, 30, 16), m["trim"], c, 0.06)
    cube("teaching_b_tower", (0, 0, 20), (12, 12, 8), m["cream"], c, 0.05)
    cube("teaching_b_roof", (0, 0, 16.4), (31, 31, 0.8), m["dark"], c)
    cube("teaching_b_tower_roof", (0, 0, 24.4), (13, 13, 0.8), m["dark"], c)
    window_grid("teaching_b_front", c, m["glass"], "front", [-10, -5, 0, 5, 10], [4, 7, 10, 13], -15.1)
    side_window_grid("teaching_b_side", c, m["glass"], 15.1, [-10, -5, 0, 5, 10], [4, 7, 10, 13])
    cube("teaching_b_clock_panel", (0, -6.15, 21), (4, 0.12, 4), m["glass_deep"], c)
    add_label("teaching_b_label", c, "Teaching B", (0, -18, 2.2))
    return c


def make_dormitory_group(m):
    c = make_collection("DormitoryGroup")
    for block, y in enumerate([-14, 0, 14]):
        cube(f"dormitory_block_{block}", (0, y, 9), (36, 10, 18), m["brick"], c, 0.04)
        cube(f"dormitory_roof_{block}", (0, y, 18.35), (37, 11, 0.7), m["dark"], c)
        for x in [-15, -10, -5, 0, 5, 10, 15]:
            for z in [4, 7, 10, 13, 16]:
                cube(f"dormitory_balcony_{block}_{x}_{z}", (x, y - 5.55, z), (2.4, 1.0, 1.2), m["cream"], c)
                cube(f"dormitory_window_{block}_{x}_{z}", (x, y - 5.08, z + 0.1), (1.5, 0.08, 1.4), m["glass"], c)
        cube(f"dormitory_stair_core_{block}", (-20.2, y, 9), (4, 8, 18), m["cream"], c)
    add_label("dormitory_label", c, "Dormitory", (0, -22.5, 2.2))
    return c


def make_administration(m):
    c = make_collection("Administration")
    cube("administration_body", (0, 0, 7.5), (36, 26, 15), m["stone"], c, 0.06)
    cube("administration_roof", (0, 0, 15.4), (37, 27, 0.8), m["terracotta"], c)
    cube("administration_portico_roof", (0, -15, 8.5), (15, 5, 1.0), m["terracotta"], c)
    columns("administration_portico", c, m["trim"], [-5, -2.5, 0, 2.5, 5], -15, 8)
    cube("administration_front_steps", (0, -17.7, 0.35), (18, 4, 0.7), m["trim"], c)
    window_grid("administration_front", c, m["glass"], "front", [-14, -9, 9, 14], [4, 7, 10, 13], -13.1)
    add_label("administration_label", c, "Administration", (0, -20, 2.2))
    return c


def make_laboratory(m):
    c = make_collection("Laboratory")
    cube("laboratory_body", (0, 0, 8.5), (38, 20, 17), m["trim"], c, 0.05)
    cube("laboratory_side_shaft", (17, 4, 9), (5, 7, 18), m["mint"], c)
    cube("laboratory_roof", (0, 0, 17.35), (39, 21, 0.7), m["roof_gray"], c)
    window_grid("laboratory_front", c, m["glass"], "front", [-15, -10, -5, 0, 5, 10, 15], [4, 7, 10, 13, 16], -10.1)
    for i, x in enumerate([-10, 0, 9]):
        bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.65, depth=5, location=(x, 4, 20))
        pipe = bpy.context.object
        pipe.name = f"laboratory_exhaust_chimney_{i}"
        pipe.data.materials.append(m["roof_gray"])
        move_to_collection(pipe, c)
    for x in [-6, 6]:
        cube(f"laboratory_vent_box_{x}", (x, -4, 18.4), (6, 3, 1.4), m["mint"], c)
    add_label("laboratory_label", c, "Laboratory", (0, -13, 2.2))
    return c


def make_activity_center(m):
    c = make_collection("ActivityCenter")
    cube("activity_center_body", (0, 0, 6.5), (32, 24, 13), m["cream"], c, 0.06)
    cube("activity_center_roof", (0, 0, 13.35), (33, 25, 0.7), m["dark"], c)
    faceted_curve_wall("activity_center", c, m["glass"], 16, 18, 7.2, 9.5, 7)
    cube("activity_center_big_canopy", (0, -15, 5.4), (24, 5, 0.7), m["coral"], c)
    for x in [-9, -5, 5, 9]:
        cube(f"activity_center_poster_{x}", (x, -12.15, 3.2), (2.4, 0.1, 3.2), m["coral"], c)
    add_label("activity_center_label", c, "Activity Center", (0, -18.4, 2.2))
    return c


def make_cafe(m):
    c = make_collection("Cafe")
    cube("cafe_body", (0, 0, 3), (18, 14, 6), m["cream"], c, 0.06)
    cube("cafe_roof", (0, 0, 6.7), (19, 15, 1.0), m["terracotta"], c)
    cube("cafe_awning", (0, -8.4, 4), (16, 3, 0.45), m["coffee"], c)
    cube("cafe_front_glass", (0, -7.1, 3), (9, 0.12, 3.5), m["glass"], c)
    cube("cafe_terrace_deck", (0, -13, 0.2), (20, 9, 0.4), m["coffee"], c)
    for x in [-6, 0, 6]:
        cube(f"cafe_table_{x}", (x, -13, 0.9), (2.2, 2.2, 0.25), m["trim"], c)
        cube(f"cafe_table_base_{x}", (x, -13, 0.55), (0.35, 0.35, 0.7), m["coffee"], c)
    add_label("cafe_label", c, "Cafe", (0, -18, 1.8))
    return c


ASSET_BUILDERS = [
    ("library", make_library),
    ("teaching_building_a", make_teaching_a),
    ("canteen", make_canteen),
    ("gymnasium", make_gymnasium),
    ("teaching_building_b", make_teaching_b),
    ("dormitory_group", make_dormitory_group),
    ("administration", make_administration),
    ("laboratory", make_laboratory),
    ("activity_center", make_activity_center),
    ("cafe", make_cafe),
]


def add_lighting_and_camera():
    bpy.ops.object.light_add(type="SUN", location=(0, 0, 40))
    sun = bpy.context.object
    sun.name = "isometric_sun"
    sun.data.energy = 3
    sun.rotation_euler = (math.radians(45), 0, math.radians(35))
    bpy.ops.object.camera_add(location=(65, -65, 50), rotation=(math.radians(60), 0, math.radians(45)))
    camera = bpy.context.object
    bpy.context.scene.camera = camera
    camera.name = "isometric_camera"
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 70


def arrange_preview(collections):
    spacing = 70
    for idx, collection in enumerate(collections):
        row = idx // 5
        col = idx % 5
        dx = (col - 2) * spacing
        dy = (1 - row) * spacing
        for obj in collection.objects:
            obj.location.x += dx
            obj.location.y += dy
        cube(f"{collection.name.lower()}_base_tile", (dx, dy, -0.06), (55, 45, 0.1), bpy.data.materials["mat_ground_pale_green"], collection)


def export_collection(collection, filename):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in collection.objects:
        obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_DIR / filename),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
    )


def main():
    ensure_dirs()
    clear_scene()
    materials = create_materials()
    collections = []
    for _, builder in ASSET_BUILDERS:
        collections.append(builder(materials))
    arrange_preview(collections)
    add_lighting_and_camera()
    for filename, collection in zip([name + ".glb" for name, _ in ASSET_BUILDERS], collections):
        export_collection(collection, filename)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_DIR / "campus_assets.blend"))
    print("Created low-poly campus assets:", ", ".join(name for name, _ in ASSET_BUILDERS))


if __name__ == "__main__":
    main()
