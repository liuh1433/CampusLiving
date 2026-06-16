import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(r"F:\桌面\重要\实习\校园")
OUT_PATH = ROOT / "assets" / "previews" / "teaching_complex_1_6_map_angle.png"
GLB_PATH = ROOT / "assets" / "glb" / "teaching_complex_1_6.glb"


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def mat(name, rgb, roughness=0.8):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.diffuse_color = (rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, 1)
    material.use_nodes = True
    bsdf = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
    if bsdf:
        bsdf.inputs["Base Color"].default_value = material.diffuse_color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = 0
    return material


def cube(name, loc, scale, material, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    obj.data.materials.append(material)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new(name="lowpoly_soft_bevel", type="BEVEL")
        modifier.width = bevel
        modifier.segments = 1
        obj.modifiers.new(name="weighted_normals", type="WEIGHTED_NORMAL")
    return obj


def add_label(name, text, loc, size=1.35):
    curve = bpy.data.curves.new(name, "FONT")
    curve.body = text
    curve.size = size
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    obj = bpy.data.objects.new(name, curve)
    obj.name = name
    obj.location = loc
    obj.rotation_euler = (math.radians(65), 0, 0)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def window_grid(prefix, x_values, z_values, y, glass, width=1.0, height=1.15):
    for i, x in enumerate(x_values):
        for j, z in enumerate(z_values):
            cube(f"{prefix}_window_{i}_{j}", (x, y, z), (width, 0.08, height), glass)


def side_window_grid(prefix, x, y_values, z_values, glass, width=0.08, depth=1.0, height=1.15):
    for i, y in enumerate(y_values):
        for j, z in enumerate(z_values):
            cube(f"{prefix}_side_window_{i}_{j}", (x, y, z), (width, depth, height), glass)


def add_simple_block(prefix, center, size, wall, roof, glass, accent, label_text=None):
    cx, cy = center
    length, width, height = size
    cube(f"{prefix}_body", (cx, cy, height / 2), (length, width, height), wall, 0.035)
    cube(f"{prefix}_roof", (cx, cy, height + 0.24), (length + 0.75, width + 0.75, 0.48), roof)
    cube(f"{prefix}_front_accent", (cx, cy - width / 2 - 0.08, height / 2), (length * 0.18, 0.14, height * 0.9), accent)

    floor_count = max(3, round(height / 3.2))
    xs = [cx - length * 0.38, cx - length * 0.25, cx - length * 0.12, cx + length * 0.02, cx + length * 0.16, cx + length * 0.3]
    zs = [2.6 + i * (height - 4) / max(floor_count - 1, 1) for i in range(floor_count)]
    window_grid(prefix, xs, zs, cy - width / 2 - 0.08, glass)
    side_window_grid(prefix, cx + length / 2 + 0.08, [cy - width * 0.25, cy + width * 0.05, cy + width * 0.35], zs, glass)

    cube(f"{prefix}_entrance_glass", (cx, cy - width / 2 - 0.13, 2.0), (4.8, 0.12, 2.6), glass)
    cube(f"{prefix}_canopy", (cx, cy - width / 2 - 1.1, 3.4), (6.6, 1.8, 0.32), accent)
    if label_text:
        add_label(f"{prefix}_label", label_text, (cx, cy - width / 2 - 2.7, 0.16), 1.18)


def add_notch(name, loc, scale, material):
    # Shallow roof/parapet bump to echo the stepped footprint in the 2D plan.
    return cube(name, loc, scale, material, 0.02)


def add_site():
    ground = mat("mat_complex_ground_mint", (142, 216, 169))
    path = mat("mat_complex_path_cream", (239, 226, 186))
    road = mat("mat_complex_road_white", (235, 235, 225))
    road_line = mat("mat_complex_road_line", (196, 178, 166))
    plaza_line = mat("mat_complex_plaza_line", (50, 58, 56))
    statue = mat("mat_complex_statue_purple", (150, 72, 116))

    cube("complex_green_base", (0, 0, -0.08), (105, 82, 0.08), ground)
    cube("complex_bottom_road", (0, -39, 0.02), (110, 4.2, 0.1), road)
    cube("complex_right_road", (51, 0, 0.02), (4.2, 84, 0.1), road)
    cube("complex_bottom_road_name_strip", (8, -36.7, 0.08), (14, 0.18, 0.08), road_line)

    # Marco Plaza from the provided plan.
    bpy.ops.mesh.primitive_torus_add(major_radius=14.2, minor_radius=0.12, major_segments=64, minor_segments=6, location=(-28, 12, 0.18))
    plaza = bpy.context.object
    plaza.name = "marco_plaza_outline"
    plaza.data.materials.append(plaza_line)
    add_label("marco_plaza_label", "马可广场", (-28, 12, 0.22), 1.55)

    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=1.7, location=(-43, 28, 1.7))
    statue_obj = bpy.context.object
    statue_obj.name = "confucius_statue_marker"
    statue_obj.scale.z = 0.75
    statue_obj.data.materials.append(statue)
    add_label("confucius_label", "孔子像", (-43, 32, 0.2), 1.1)

    for name, loc, scale in [
        ("complex_path_to_building_1", (-28, -18, 0.02), (28, 1.7, 0.08)),
        ("complex_path_main_vertical", (18, -2, 0.02), (1.8, 54, 0.08)),
        ("complex_path_mid_3", (30, 0, 0.02), (30, 1.7, 0.08)),
        ("complex_path_mid_5", (30, 15, 0.02), (30, 1.7, 0.08)),
        ("complex_path_mid_6", (30, 28, 0.02), (30, 1.7, 0.08)),
        ("complex_path_bottom_2", (31, -18, 0.02), (32, 1.7, 0.08)),
    ]:
        cube(name, loc, scale, path)


def add_teaching_complex():
    wall_pink = mat("mat_complex_wall_plan_pink", (222, 150, 138))
    wall_light = mat("mat_complex_wall_light", (236, 232, 215))
    roof = mat("mat_complex_roof_gray_blue", (110, 128, 140))
    glass = mat("mat_complex_glass_blue", (112, 190, 220))
    accent = mat("mat_complex_accent_deep_red", (176, 82, 70))
    accent_blue = mat("mat_complex_accent_blue", (86, 132, 166))

    # 1号教学楼: independent block at lower-left.
    add_simple_block("teaching_1", (-30, -24), (27, 8.2, 10), wall_pink, roof, glass, accent_blue, "1号教学楼")
    add_notch("teaching_1_left_notch", (-40, -28.8, 10.7), (2.6, 1.3, 0.75), roof)
    add_notch("teaching_1_mid_notch", (-30, -28.8, 10.7), (2.4, 1.3, 0.75), roof)
    add_notch("teaching_1_right_notch", (-20, -28.8, 10.7), (2.6, 1.3, 0.75), roof)

    # 4号教学楼 / 综合教学楼: right vertical spine.
    add_simple_block("teaching_4_spine", (27, 3), (10, 61, 14), wall_light, roof, glass, accent, "综合教学楼 / 4号")
    cube("teaching_4_right_step_top", (34.2, 25, 8), (4.2, 12, 16), wall_light, 0.03)
    cube("teaching_4_right_step_mid", (34.2, 5, 7), (4.2, 10, 14), wall_light, 0.03)
    cube("teaching_4_right_step_bottom", (34.2, -21, 6.5), (4.2, 9, 13), wall_light, 0.03)

    # Horizontal comb teeth: 6, 5, 3, 2 from top to bottom, extending left from the spine.
    add_simple_block("teaching_6", (9, 28), (38, 8.5, 12), wall_pink, roof, glass, accent_blue, "6号教学楼")
    add_simple_block("teaching_5", (8, 14), (32, 7.6, 11), wall_pink, roof, glass, accent_blue, "5号教学楼")
    add_simple_block("teaching_3", (8, 0), (33, 7.8, 11.5), wall_pink, roof, glass, accent_blue, "3号教学楼")
    add_simple_block("teaching_2", (9, -16), (36, 8.4, 12), wall_pink, roof, glass, accent_blue, "2号教学楼")

    # Small stepped protrusions from the footprint shown in the plan.
    for prefix, y, xs in [
        ("teaching_6", 32.8, [-4, 12]),
        ("teaching_5", 17.9, [8]),
        ("teaching_3", 4.0, [-3, 13]),
        ("teaching_2", -20.8, [-4, 11]),
    ]:
        for idx, x in enumerate(xs):
            add_notch(f"{prefix}_plan_bump_{idx}", (x, y, 12.6), (4.0, 1.5, 0.65), roof)


def add_trees():
    trunk = mat("mat_complex_tree_trunk", (126, 88, 52))
    green = mat("mat_complex_tree_green", (86, 164, 76))
    yellow = mat("mat_complex_tree_yellow", (226, 178, 54))
    positions = [
        (-44, 18), (-39, 4), (-37, -11), (-11, 29), (-12, 18), (-12, 4),
        (-12, -13), (41, 31), (41, 14), (41, -5), (41, -24), (1, -30),
        (18, -31), (-47, -27),
    ]
    for i, (x, y) in enumerate(positions):
        bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.22, depth=1.25, location=(x, y, 0.62))
        trunk_obj = bpy.context.object
        trunk_obj.name = f"complex_tree_trunk_{i}"
        trunk_obj.data.materials.append(trunk)
        bpy.ops.mesh.primitive_cone_add(vertices=7, radius1=0.9, radius2=0.18, depth=2.25, location=(x, y, 2.15))
        leaf = bpy.context.object
        leaf.name = f"complex_tree_leaf_{i}"
        leaf.data.materials.append(yellow if i in {4, 10, 13} else green)


def add_lighting():
    bpy.ops.object.light_add(type="SUN", location=(0, 0, 60))
    sun = bpy.context.object
    sun.name = "complex_layout_sun"
    sun.data.energy = 2.8
    sun.rotation_euler = (math.radians(48), 0, math.radians(32))

    bpy.ops.object.light_add(type="AREA", location=(-20, -28, 38))
    area = bpy.context.object
    area.name = "complex_layout_softbox"
    area.data.energy = 330
    area.data.size = 62


def add_camera():
    bpy.ops.object.camera_add()
    camera = bpy.context.object
    camera.name = "complex_layout_map_camera"
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 96
    camera.location = (58, -72, 68)
    target = Vector((0, -2, 8))
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
    GLB_PATH.parent.mkdir(parents=True, exist_ok=True)
    clear_scene()
    setup_render()
    add_site()
    add_teaching_complex()
    add_trees()
    add_label("complex_main_title", "综合教学楼布局", (12, 38, 0.2), 1.65)
    add_lighting()
    add_camera()

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=str(GLB_PATH), export_format="GLB", use_selection=True, export_apply=True)
    bpy.context.scene.render.filepath = str(OUT_PATH)
    bpy.ops.render.render(write_still=True)
    print(f"Rendered adjusted teaching complex layout: {OUT_PATH}")


if __name__ == "__main__":
    main()
