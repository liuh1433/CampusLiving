"""Rebuild the Jinming library exterior from the user-supplied multi-view sheet.

Run in a fresh Blender process. Dimensions are approximate reference proportions.
Geometry is batched by component, floor and material for the browser viewer.
"""

import argparse
from collections import defaultdict
import json
import math
from pathlib import Path
import random
import shutil
import sys

import bpy
from mathutils import Vector
from mathutils.geometry import tessellate_polygon

ROOT = Path(__file__).resolve().parents[2]
ASSET = ROOT / "assets"
RNG = random.Random(73)
BUFFERS = defaultdict(lambda: ([], []))
MATERIALS = {}
FRONT_PROFILE = ((-26.6, -31.3), (-15.2, -19.4), (15.2, -19.4), (26.6, -31.3))


def material(name, rgb, roughness=0.75, metal=0):
    result = bpy.data.materials.new(name)
    result.diffuse_color = (*rgb, 1)
    result.use_nodes = True
    shader = result.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*rgb, 1)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metal
    MATERIALS[name] = result


def geometry(vertices, faces, mat, part="building", level=0):
    points, polygons = BUFFERS[(part, level, mat)]
    offset = len(points)
    points.extend(vertices)
    polygons.extend(tuple(i + offset for i in face) for face in faces)


def box(center, size, mat, part="building", level=0, angle=0):
    x, y, z = center
    a, b, c = (v / 2 for v in size)
    cs, sn = math.cos(angle), math.sin(angle)
    vertices = [(x + dx * cs - dy * sn, y + dx * sn + dy * cs, z + dz)
                for dx, dy, dz in [(-a, -b, -c), (a, -b, -c), (a, b, -c), (-a, b, -c),
                                   (-a, -b, c), (a, -b, c), (a, b, c), (-a, b, c)]]
    geometry(vertices, [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4),
                        (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)], mat, part, level)


def beam(a, b, width, depth, mat, part="building", level=0):
    # All facade beams are horizontal in plan; verticals use box directly.
    x, y, z = ((a[i] + b[i]) / 2 for i in range(3))
    length = math.hypot(b[0] - a[0], b[1] - a[1])
    box((x, y, z), (length, depth, width), mat, part, level,
        math.atan2(b[1] - a[1], b[0] - a[0]))


def plate(outline, z0, thickness, mat, part="building", level=0):
    # Tessellate concave footprints explicitly so glTF cannot bridge the recess.
    loop = [Vector((x, y, 0)) for x, y in outline]
    triangles = [tuple(triangle) for triangle in tessellate_polygon([loop])]
    n = len(outline)
    vertices = [(x, y, z) for z in (z0, z0 + thickness) for x, y in outline]
    faces = [tuple(reversed(tri)) for tri in triangles]
    faces.extend(tuple(i + n for i in tri) for tri in triangles)
    faces.extend((i, (i + 1) % n, (i + 1) % n + n, i + n) for i in range(n))
    geometry(vertices, faces, mat, part, level)


def front_floor(z0, level):
    profile = [(x, y + 0.12) for x, y in FRONT_PROFILE]
    outline = [(-32, -31.18), *profile, (32, -31.18), (32, -5), (-32, -5)]
    plate(outline, z0, 0.24, "slab", level=level)


def cylinder(center, radius, height, mat, part="site", segments=10):
    x, y, z = center
    vertices = [(x + radius * math.cos(i * math.tau / segments),
                 y + radius * math.sin(i * math.tau / segments), z + dz)
                for dz in (-height / 2, height / 2) for i in range(segments)]
    faces = [tuple(reversed(range(segments))), tuple(range(segments, 2 * segments))]
    faces.extend((i, (i + 1) % segments, (i + 1) % segments + segments, i + segments)
                 for i in range(segments))
    geometry(vertices, faces, mat, part)


def crown(center, radius, mat):
    x, y, z = center
    vertices = [(x, y, z - radius * 0.85)]
    for ring, elevation in enumerate((-0.5, 0, 0.55)):
        for i in range(9):
            theta = (i + (ring % 2) * 0.5) * math.tau / 9
            r = radius * (0.8 if ring != 1 else 1) * RNG.uniform(0.86, 1.1)
            vertices.append((x + r * math.cos(theta), y + r * math.sin(theta), z + elevation * radius))
    vertices.append((x, y, z + radius))
    faces = [(0, 1 + (i + 1) % 9, 1 + i) for i in range(9)]
    for ring in range(2):
        for i in range(9):
            a = 1 + ring * 9 + i
            b = 1 + ring * 9 + (i + 1) % 9
            c = b + 9
            d = a + 9
            faces.extend(((a, b, c), (a, c, d)))
    faces.extend((19 + i, 19 + (i + 1) % 9, 28) for i in range(9))
    geometry(vertices, faces, mat, "site")


def tree(x, y, scale=1):
    cylinder((x, y, 2.1 * scale), 0.20 * scale, 4.2 * scale, "bark", segments=7)
    crown((x, y, 5.1 * scale), 2.1 * scale, RNG.choice(["leaf", "leaf_light", "leaf_dark"]))
    crown((x + 0.9 * scale, y + 0.3, 4.3 * scale), 1.4 * scale, "leaf")


def curtain(a, b, z0, height, level, panes=16):
    dx, dy = b[0] - a[0], b[1] - a[1]
    angle = math.atan2(dy, dx)
    width = math.hypot(dx, dy)
    for i in range(panes):
        t = (i + 0.5) / panes
        shade = "glass" if i % 4 else "glass_light"
        box((a[0] + t * dx, a[1] + t * dy, z0 + height / 2),
            (width / panes - 0.075, 0.19, height - 0.09), shade, level=level, angle=angle)
    for i in range(panes + 1):
        t = i / panes
        box((a[0] + t * dx, a[1] + t * dy, z0 + height / 2),
            (0.10, 0.34, height), "frame", level=level, angle=angle)
    for h in (0, height / 2, height):
        beam((a[0], a[1], z0 + h), (b[0], b[1], z0 + h), 0.10, 0.32, "frame", level=level)


def window(x, y, z, width=2.8, height=2.7, side=False, level=1):
    angle = math.pi / 2 if side else 0
    for size, mat, offset in [((width + 0.32, 0.32, height + 0.3), "trim", 0),
                              ((width, 0.36, height), "glass", 0)]:
        box((x, y, z), size, mat, level=level, angle=angle)
    box((x, y, z), (0.075, 0.42, height), "frame", level=level, angle=angle)
    box((x, y, z + 0.3), (width, 0.42, 0.07), "frame", level=level, angle=angle)
    box((x, y, z - height / 2 - 0.12), (width + 0.55, 0.66, 0.16), "stone_light", level=level, angle=angle)


def railing(a, b, z, part="building", level=0):
    distance = math.hypot(b[0] - a[0], b[1] - a[1])
    steps = max(1, math.ceil(distance / 1.8))
    for i in range(steps + 1):
        t = i / steps
        box((a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), z + 0.5),
            (0.06, 0.06, 1.0), "frame", part, level)
    for h in (0.42, 1.02):
        beam((*a, z + h), (*b, z + h), 0.075, 0.075, "frame", part, level)


def main_building():
    box((0, 0, 0.7), (68, 58, 1.4), "stone_dark")
    for level in range(1, 9):
        z0 = 1.4 + (level - 1) * 5.0
        z = z0 + 2.5
        front_floor(z0, level)
        # Side bars start behind the entire folded facade, alongside the court.
        for x, y, w, d in [(-24, 12, 16, 34), (24, 12, 16, 34), (0, 25, 32, 10)]:
            box((x, y, z0 + 0.12), (w, d, 0.24), "slab", level=level)
        for sign in (-1, 1):
            box((sign * 31, 5.65, z), (2, 46.7, 5), "stone", level=level)
            box((sign * 16.4, 9, z), (0.8, 32, 5), "stone", level=level)
            box((sign * 24, 29, z), (16, 1.2, 5), "stone", level=level)
            box((sign * 29.3, -24.5, z), (5.4, 13.6, 5), "stone_light", level=level)
            box((sign * 21.7, 26, z), (6.5, 9.5, 5), "stone_light", level=level)
            # Real side photos show punched windows rather than a full glass wall.
            for y in (-20, -12.5, -5, 2.5, 10, 17.5, 25):
                window(sign * 32.05, y, z + 0.1, side=True, level=level)
            for x in (26.8, 30.5):
                window(sign * x, 29.66, z + 0.1, 2.15, level=level)
            for y in (1, 7.5, 14):
                window(sign * 15.92, y, z + 0.1, side=True, level=level)
            # Small stone courses stay visible without adding image textures.
            box((sign * 32.07, 0, z0 + 0.1), (0.1, 58, 0.055), "joint", level=level)
            box((sign * 29.3, -31.34, z0 + 0.15), (5.4, 0.055, 0.06), "joint", level=level)
            for x in (27.3, 29.3, 31.3):
                box((sign * x, -31.35, z), (0.035, 0.06, 5), "joint", level=level)
        for a, b, panes in zip(FRONT_PROFILE, FRONT_PROFILE[1:], (8, 22, 8)):
            curtain(a, b, z0 + 0.08, 4.9, level, panes)
            beam((*a, z0 + 0.12), (*b, z0 + 0.12), 0.24, 0.28, "stone_dark", level=level)
        curtain((-17, 25.1), (17, 25.1), z0 + 0.08, 4.9, level, 16)
        curtain((-15.8, -4.9), (15.8, -4.9), z0 + 0.08, 4.9, level, 16)

    # Monumental entrance columns, separate from the fine curtain-wall grid.
    for x, y in FRONT_PROFILE:
        box((x, y - 0.18, 21.4), (0.48, 0.48, 40), "stone_light")
    for x in (-10.36, -5.53, 0, 5.53, 10.36):
        box((x, FRONT_PROFILE[1][1] - 0.22, 24), (0.22, 0.35, 34.7), "trim")
    for sign in (-1, 1):
        box((sign * 29.3, -24.5, 42), (6.1, 14.2, 1.2), "stone_light", "roof")
        box((sign * 21.7, 25.8, 42.7), (7.4, 10.5, 2.8), "stone_light", "roof")
    # Flat perimeter roof around the courtyard: do not cap the void.
    for x, y, w, d in [(0, -17.75, 66, 27.5), (-24.25, 8.25, 17.5, 24.5),
                        (24.25, 8.25, 17.5, 24.5), (0, 25.5, 66, 10)]:
        box((x, y, 41.6), (w, d, 0.7), "roof", "roof")
        box((x, y, 42), (w - 0.8, d - 0.8, 0.12), "roof_deck", "roof")
    box((0, -32, 42.3), (68.5, 1.2, 0.48), "roof_edge", "roof")
    box((0, -31.6, 41.85), (66, 0.65, 0.3), "frame", "roof")
    for sign in (-1, 1):
        box((sign * 33, 0, 42.15), (0.38, 61, 0.95), "stone_light", "roof")
        box((sign * 15.5, 8.5, 42.3), (0.4, 24, 1.0), "stone_light", "roof")
    for y in (-4, 20.5, 30.3):
        box((0, y, 42.3), (31 if y != 30.3 else 66, 0.35, 1.0), "stone_light", "roof")
    for x, y in [(-23, 9), (23, 9), (-22, -12), (22, -12)]:
        box((x, y, 43.3), (6, 7, 2.5), "stone_light", "roof")
        box((x, y, 44.65), (6.6, 7.6, 0.25), "roof_edge", "roof")
        for i in range(4):
            box((x - 1.8 + i * 1.2, y - 3.55, 43.1), (0.75, 0.12, 1.05), "vent", "roof")
    for x in (-9, 0, 9):
        box((x, -12, 42.35), (5.8, 7, 0.45), "frame", "roof")
        box((x, -12, 42.63), (5.4, 6.6, 0.15), "glass_light", "roof")
        for dx in (-1.8, 0, 1.8):
            box((x + dx, -12, 42.75), (0.08, 6.6, 0.12), "trim", "roof")
    # Low interior courtyard surface visible from above or with roof removed.
    box((0, 8, 1.5), (30, 24, 0.2), "paving")
    box((0, 9, 1.65), (16, 10, 0.16), "grass")


def wings():
    for sign in (-1, 1):
        x = sign * 42
        box((x, 2, 0.6), (19, 64, 1.2), "stone_dark")
        for level in range(1, 4):
            z0 = 1.2 + (level - 1) * 4.15
            z = z0 + 2
            box((x, 2, z), (17.5, 62, 4), "stone", level=level)
            for dx in (-5.5, 0, 5.5):
                for y in (-29.1, 33.1):
                    window(x + dx, y, z, width=2.4, height=2.5, level=level)
            for y in (-24, -16, -8, 0, 8, 16, 24, 29):
                window(sign * 50.81, y, z, width=3.1, height=2.5, side=True, level=level)
            box((sign * 50.8, 2, z0), (0.12, 62, 0.1), "joint", level=level)
        box((x, 2, 14), (20.5, 66, 0.5), "roof_edge", "roof")
        box((x, 2, 14.28), (19.8, 65.3, 0.1), "roof_deck", "roof")
        # Projecting canopy with open slatted pergola, seen in both photographs.
        for y in (-29, 33):
            for dx in (-8.8, 8.8):
                box((x + dx, y, 9.8), (0.45, 0.45, 8), "stone_light")
        for y in range(-27, 33, 2):
            box((x, y, 14.5), (20.5, 0.15, 0.35), "trim", "roof")
        for dx in (-8, 8):
            box((x + dx, 2, 14.7), (0.22, 64, 0.2), "trim", "roof")
        box((x, 8, 15), (7, 10, 1.2), "stone_light", "roof")
        box((x, 8, 15.7), (7.8, 10.8, 0.18), "roof", "roof")


def entrances():
    # Broad front stair: each tread rises towards the recessed glazed doors.
    for i in range(9):
        box((0, -36.6 + i * 0.66, (i + 1) * 0.17 / 2),
            (29 - i * 0.15, 0.72, (i + 1) * 0.17), "stone_light")
    door_y = FRONT_PROFILE[1][1] - 0.3
    landing_front = -31.1
    box((0, (landing_front + door_y) / 2, 1.38), (29, door_y - landing_front, 0.3), "paving")
    for x in (-10, -5, 0, 5, 10):
        box((x, door_y, 3.1), (3.5, 0.28, 3.1), "glass_dark", level=1)
        for dx in (-1.75, 0, 1.75):
            box((x + dx, door_y - 0.22, 3.1), (0.08, 0.2, 3.2), "frame", level=1)
    box((0, door_y - 2.7, 6.05), (30, 6, 0.48), "stone_light")
    box((0, door_y - 5.73, 5.99), (28, 0.18, 0.65), "sign")
    for x in (-14, 14):
        box((x, -24.8, 3.6), (0.35, 0.35, 4.4), "frame")
    # Rear terrace, bridge and broad entry stair visible in the photograph.
    box((0, 29, 7.3), (33, 8, 0.45), "stone_light", level=2)
    for x in (-13.5, -7, 7, 13.5):
        box((x, 30, 4.2), (0.9, 0.9, 6.2), "stone_light", level=1)
    railing((-16, 33), (16, 33), 7.55, level=2)
    for i in range(9):
        box((0, 37 - i * 0.56, (i + 1) * 0.16 / 2),
            (24 - i * 0.15, 0.62, (i + 1) * 0.16), "stone_light")
    box((0, 29, 1.4), (24, 6, 0.2), "paving")
    box((0, 27, 4), (15, 0.25, 4.6), "glass_dark", level=1)
    for x in range(-6, 7, 3):
        box((x, 27.25, 3.6), (0.12, 0.15, 3.5), "trim", level=1)
    # Rear upper crosspiece and terrace give the elevation its stepped silhouette.
    box((0, 28.5, 18.1), (36, 3.2, 0.55), "stone_light", level=4)
    railing((-17, 30), (17, 30), 18.4, level=4)
    for x in (-18, 18):
        box((x, 28.5, 23), (1.1, 2.2, 9.5), "stone_light", level=5)


def landscape():
    box((0, 0, -0.45), (139, 127, 0.8), "site_edge", "site")
    box((0, 0, -0.02), (137.5, 125.5, 0.12), "grass", "site")
    for y in (-46, 46):
        box((0, y, 0.09), (115, 25, 0.14), "paving", "site")
        for x in range(-54, 55, 6):
            box((x, y, 0.18), (0.08, 25, 0.02), "paving_joint", "site")
        for dy in (-9, -3, 3, 9):
            box((0, y + dy, 0.18), (115, 0.08, 0.02), "paving_joint", "site")
        for x in (-40, 40):
            box((x, y + (1 if y < 0 else -1), 0.3), (24, 12, 0.5), "stone_light", "site")
            box((x, y + (1 if y < 0 else -1), 0.59), (23.1, 11.1, 0.1), "grass", "site")
            for dx in (-8, 0, 8):
                tree(x + dx, y, RNG.uniform(0.8, 1.15))
            for dx in (-10, -5, 0, 5, 10):
                box((x + dx, y - 4.9, 1), (4.4, 1.15, 1), "hedge", "site")
    for sign in (-1, 1):
        box((sign * 61, 0, 0.11), (7, 117, 0.18), "paving", "site")
        for y in (-28, -14, 0, 14, 28):
            tree(sign * 56.5, y, RNG.uniform(0.95, 1.25))
        for y in (-43, 43):
            box((sign * 21, y, 0.5), (5, 1.3, 0.5), "stone_dark", "site")
            box((sign * 21, y, 0.82), (5.1, 1.4, 0.2), "bench", "site")
    for x in (-20, 20):
        for y in (-54, 54):
            cylinder((x, y, 2.3), 0.1, 4.6, "frame")
            box((x, y, 4.65), (0.7, 0.7, 0.25), "trim", "site")
    for sign in (-1, 1):
        box((sign * 66.5, 0, 0.08), (4.8, 123, 0.12), "road", "site")
        for y in range(-56, 57, 8):
            box((sign * 66.5, y, 0.15), (0.12, 3.5, 0.02), "trim", "site")
    # Flag and pole are intentionally part of the site, not building height.
    cylinder((-18, -43, 6.5), 0.09, 13, "trim")
    geometry([(-18, -43, 12.9), (-14.8, -43, 12.7), (-14.8, -43, 10.9), (-18, -43, 11.1)],
             [(0, 1, 2, 3)], "flag", "site")


def create_meshes():
    root = bpy.data.objects.new("library_jinming", None)
    bpy.context.scene.collection.objects.link(root)
    root["buildingId"] = "library-jinming"
    root["referenceDimensions"] = "approximately 100 x 70 x 45 m"
    root["sourceType"] = "reference-image exterior reconstruction; inferred floor layout"
    parents = {}
    for (part, level, mat), (vertices, faces) in BUFFERS.items():
        key = (part, level)
        if key not in parents:
            parent = bpy.data.objects.new(f"library_{part}_{level:02}", None)
            bpy.context.scene.collection.objects.link(parent)
            parent.parent = root
            parent["part"] = part
            parent["level"] = level
            parent["buildingId"] = "library-jinming"
            parents[key] = parent
        mesh = bpy.data.meshes.new(f"library_{part}_{level:02}_{mat}")
        mesh.from_pydata(vertices, [], faces)
        mesh.update()
        obj = bpy.data.objects.new(mesh.name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        obj.parent = parents[key]
        obj.data.materials.append(MATERIALS[mat])
        obj["buildingId"] = "library-jinming"
        obj["part"] = part
        obj["level"] = level
    return root


def add_sign(root):
    font_path = Path("C:/Windows/Fonts/msyh.ttc")
    if not font_path.exists():
        return
    curve = bpy.data.curves.new("library_entrance_lettering", "FONT")
    curve.body = "河南大学图书馆"
    curve.font = bpy.data.fonts.load(str(font_path))
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    curve.size = 0.57
    curve.extrude = 0.008
    obj = bpy.data.objects.new("library_entrance_lettering", curve)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = (0, FRONT_PROFILE[1][1] - 6.15, 6.0)
    obj.rotation_euler = (math.pi / 2, 0, 0)
    obj.data.materials.append(MATERIALS["trim"])
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj = bpy.context.object
    obj.parent = root
    obj["buildingId"] = "library-jinming"
    obj["part"] = "building"
    obj["level"] = 0
    obj.select_set(False)


def setup_scene():
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1500
    scene.render.resolution_y = 1125
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.world.use_nodes = True
    scene.world.node_tree.nodes.get("Background").inputs[0].default_value = (0.78, 0.83, 0.88, 1)
    scene.world.node_tree.nodes.get("Background").inputs[1].default_value = 0.65
    scene.view_settings.view_transform = "AgX"
    bpy.ops.object.light_add(type="AREA", location=(-65, -85, 120))
    bpy.context.object.data.energy = 135000
    bpy.context.object.data.shape = "DISK"
    bpy.context.object.data.size = 80
    bpy.context.object.rotation_euler = (Vector((0, 0, 5)) - bpy.context.object.location).to_track_quat("-Z", "Y").to_euler()
    bpy.ops.object.light_add(type="SUN", location=(0, 0, 100))
    bpy.context.object.data.energy = 1.8
    bpy.context.object.data.angle = math.radians(18)
    bpy.context.object.rotation_euler = (math.radians(28), math.radians(-25), math.radians(-28))
    bpy.ops.object.camera_add(location=(92, -174, 82))
    camera = bpy.context.object
    camera.name = "library_preview_camera"
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 167
    camera.rotation_euler = (Vector((0, 0, 12)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = camera
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type == "VIEW_3D":
                area.spaces.active.region_3d.view_perspective = "CAMERA"
    return camera


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--render", action="store_true")
    args = parser.parse_args(argv)
    for directory in (ASSET / "blender", ASSET / "glb", ASSET / "previews", ROOT / "public/assets/glb"):
        directory.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for name, rgb in {
        "stone": (0.68, 0.69, 0.65), "stone_light": (0.83, 0.83, 0.78),
        "stone_dark": (0.39, 0.42, 0.42), "trim": (0.76, 0.79, 0.76),
        "joint": (0.47, 0.49, 0.47), "slab": (0.67, 0.68, 0.63),
        "roof": (0.48, 0.51, 0.5), "roof_deck": (0.61, 0.63, 0.58),
        "roof_edge": (0.72, 0.74, 0.7), "vent": (0.21, 0.26, 0.27),
        "paving": (0.64, 0.67, 0.65), "paving_joint": (0.4, 0.44, 0.43),
        "grass": (0.25, 0.39, 0.22), "site_edge": (0.37, 0.41, 0.37),
        "hedge": (0.12, 0.25, 0.105), "leaf": (0.17, 0.31, 0.11),
        "leaf_light": (0.28, 0.41, 0.14), "leaf_dark": (0.09, 0.23, 0.14),
        "bark": (0.22, 0.17, 0.11), "bench": (0.34, 0.21, 0.13),
        "road": (0.23, 0.27, 0.28), "flag": (0.65, 0.035, 0.025),
        "sign": (0.19, 0.27, 0.24),
    }.items():
        material(name, rgb)
    material("glass", (0.095, 0.20, 0.24), 0.23, 0.35)
    material("glass_light", (0.18, 0.29, 0.32), 0.23, 0.3)
    material("glass_dark", (0.055, 0.10, 0.13), 0.23, 0.3)
    material("frame", (0.24, 0.30, 0.31), 0.42, 0.5)
    main_building()
    wings()
    entrances()
    landscape()
    root = create_meshes()
    add_sign(root)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.context.scene.objects:
        if obj == root or obj.type == "MESH" or obj.parent:
            obj.select_set(True)
    glb = ASSET / "glb/library_jinming.glb"
    bpy.ops.export_scene.gltf(filepath=str(glb), export_format="GLB", use_selection=True,
                             export_apply=True, export_extras=True, export_cameras=False,
                             export_lights=False, export_yup=True)
    shutil.copy2(glb, ROOT / "public/assets/glb/library_jinming.glb")
    camera = setup_scene()
    bpy.ops.object.select_all(action="DESELECT")
    root.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.wm.save_as_mainfile(filepath=str(ASSET / "blender/library_jinming.blend"))
    report = {"building": "library-jinming", "units": "meters", "floorsInferred": 8,
              "frontProfileXY": FRONT_PROFILE,
              "frontRecessDepth": FRONT_PROFILE[1][1] - FRONT_PROFILE[0][1],
              "frontReturnAngleDegrees": round(math.degrees(math.atan2(
                  FRONT_PROFILE[1][1] - FRONT_PROFILE[0][1], FRONT_PROFILE[1][0] - FRONT_PROFILE[0][0])), 2),
              "geometryBasis": "reference-image estimate, not surveyed dimensions",
              "referenceDimensions": [100, 70, 45], "glbBytes": glb.stat().st_size,
              "meshCount": sum(o.type == "MESH" for o in bpy.context.scene.objects),
              "triangles": sum(sum(len(p.vertices) - 2 for p in o.data.polygons)
                               for o in bpy.context.scene.objects if o.type == "MESH")}
    (ASSET / "glb/library_jinming.metadata.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print("LIBRARY_REPORT", json.dumps(report), flush=True)
    if args.render:
        for name, location, scale, target in [
            ("front", (92, -174, 82), 167, (0, 0, 12)),
            ("rear", (-126, 158, 108), 174, (0, 0, 12)),
            ("front_orthographic", (0, -180, 23), 118, (0, 0, 23)),
            ("front_oblique", (65, -175, 53), 137, (0, -8, 20)),
        ]:
            camera.location = location
            camera.data.ortho_scale = scale
            camera.rotation_euler = (Vector(target) - camera.location).to_track_quat("-Z", "Y").to_euler()
            bpy.context.scene.render.filepath = str(ASSET / f"previews/library_jinming_{name}.png")
            bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    main()
