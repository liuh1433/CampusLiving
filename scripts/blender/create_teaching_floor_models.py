import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(r"F:\桌面\重要\实习\校园")
GLB_DIR = ROOT / "assets" / "glb" / "floors"
PREVIEW_DIR = ROOT / "assets" / "previews"


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def mat(name, rgb, alpha=1.0):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.diffuse_color = (rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, alpha)
    material.use_nodes = True
    bsdf = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
    if bsdf:
        bsdf.inputs["Base Color"].default_value = material.diffuse_color
        bsdf.inputs["Roughness"].default_value = 0.82
        if alpha < 1:
            bsdf.inputs["Alpha"].default_value = alpha
            material.blend_method = "BLEND"
    return material


def cube(name, loc, scale, material):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    obj.data.materials.append(material)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return obj


def label(name, text, loc, size=0.8):
    curve = bpy.data.curves.new(name, "FONT")
    curve.body = text
    curve.size = size
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    obj = bpy.data.objects.new(name, curve)
    obj.location = loc
    obj.rotation_euler = (math.radians(68), 0, 0)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def create_floor(level, z, materials):
    prefix = f"teaching_1_floor_{level}"
    group = bpy.data.collections.new(prefix)
    bpy.context.scene.collection.children.link(group)

    created = []
    created.append(cube(f"{prefix}_slab", (0, 0, z), (28, 10, 0.32), materials["slab"]))
    created.append(cube(f"{prefix}_corridor", (0, -2.8, z + 0.22), (25, 1.2, 0.12), materials["path"]))
    created.append(cube(f"{prefix}_stair_core", (-11.5, 2.0, z + 1.0), (3.2, 3.4, 2.0), materials["core"]))
    created.append(cube(f"{prefix}_left_wall", (0, -5.05, z + 0.7), (28, 0.18, 1.35), materials["wall"]))
    created.append(cube(f"{prefix}_right_wall", (0, 5.05, z + 0.7), (28, 0.18, 1.35), materials["wall"]))
    created.append(cube(f"{prefix}_back_wall", (14.05, 0, z + 0.7), (0.18, 10, 1.35), materials["wall"]))
    created.append(cube(f"{prefix}_front_wall", (-14.05, 0, z + 0.7), (0.18, 10, 1.35), materials["wall"]))

    room_specs = [
        ("lecture", (5.8, 1.6, z + 0.36), (7.4, 4.6, 0.18), materials["lecture"], "大教室"),
        ("class_a", (-2.0, 1.6, z + 0.36), (5.6, 4.6, 0.18), materials["classroom"], "普通教室"),
        ("study", (-7.5, -0.5, z + 0.36), (4.6, 3.2, 0.18), materials["study"], "自习区"),
        ("discussion", (9.6, -1.2, z + 0.36), (3.6, 2.8, 0.18), materials["discussion"], "讨论室"),
    ]

    for key, loc, scale, material, room_label in room_specs:
        created.append(cube(f"{prefix}_{key}", loc, scale, material))
        created.append(label(f"{prefix}_{key}_label", room_label, (loc[0], loc[1], z + 0.55), 0.45))

    created.append(label(f"{prefix}_label", f"{level}F", (-15.8, -5.8, z + 0.55), 0.95))

    for obj in created:
        for collection in obj.users_collection:
            collection.objects.unlink(obj)
        group.objects.link(obj)
        obj["floorId"] = f"teaching-1-{level}f"

    return group


def add_lighting_and_camera():
    bpy.ops.object.light_add(type="SUN", location=(0, 0, 35))
    sun = bpy.context.object
    sun.name = "floor_view_sun"
    sun.data.energy = 2.5
    sun.rotation_euler = (math.radians(55), 0, math.radians(35))

    bpy.ops.object.camera_add(location=(18, -28, 15))
    camera = bpy.context.object
    camera.name = "floor_view_camera"
    camera.data.type = "PERSP"
    camera.data.lens = 32
    direction = Vector((0, 0, 5)) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = camera


def setup_render():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.eevee.taa_render_samples = 64
    scene.render.resolution_x = 1400
    scene.render.resolution_y = 900
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "Medium High Contrast"
    scene.world.color = (0.72, 0.88, 0.92)


def main():
    GLB_DIR.mkdir(parents=True, exist_ok=True)
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    clear_scene()
    setup_render()
    materials = {
        "slab": mat("floor_slab_warm_white", (236, 233, 218)),
        "wall": mat("floor_half_wall", (220, 150, 138)),
        "path": mat("floor_corridor_cream", (238, 224, 184)),
        "core": mat("floor_stair_core_blue", (100, 145, 168)),
        "lecture": mat("floor_lecture_coral", (222, 172, 132)),
        "classroom": mat("floor_classroom_blue", (145, 204, 224)),
        "study": mat("floor_study_green", (154, 211, 164)),
        "discussion": mat("floor_discussion_yellow", (232, 204, 112)),
    }

    for index, level in enumerate([1, 2, 3, 4]):
        create_floor(level, index * 2.6, materials)

    add_lighting_and_camera()
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=str(GLB_DIR / "teaching_1_floors.glb"), export_format="GLB", use_selection=True, export_apply=True)
    bpy.context.scene.render.filepath = str(PREVIEW_DIR / "teaching_1_floor_view.png")
    bpy.ops.render.render(write_still=True)
    print("Created teaching_1_floors.glb")


if __name__ == "__main__":
    main()
