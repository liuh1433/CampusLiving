import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const source = path.resolve("assets/glb/library_jinming.glb");
const served = path.resolve("public/assets/glb/library_jinming.glb");

describe("Jinming library asset contract", () => {
  it("ships the same independent GLB to the viewer and source asset directory", () => {
    expect(fs.existsSync(source)).toBe(true);
    const bytes = fs.readFileSync(source);
    expect(bytes.subarray(0, 4).toString()).toBe("glTF");
    expect(bytes.readUInt32LE(4)).toBe(2);
    expect(bytes.readUInt32LE(8)).toBe(bytes.length);
    expect(bytes.length).toBeLessThan(8 * 1024 * 1024);
    expect(bytes.equals(fs.readFileSync(served))).toBe(true);
  });

  it("loads at architectural scale with separately addressable roof, site and eight levels", async () => {
    expect(fs.existsSync(source)).toBe(true);
    const bytes = fs.readFileSync(source);
    const gltf = await new GLTFLoader().parseAsync(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "",
    );
    gltf.scene.updateMatrixWorld(true);
    const box = new THREE.Box3();
    const parts = new Set();
    const levels = new Set();
    let meshCount = 0;
    gltf.scene.traverse((object) => {
      if (!object.isMesh) return;
      meshCount += 1;
      expect(object.userData.buildingId).toBe("library-jinming");
      parts.add(object.userData.part);
      if (object.userData.part !== "site") box.expandByObject(object);
      if (object.userData.part === "building" && object.userData.level > 0) levels.add(object.userData.level);
      expect(Array.from(object.geometry.attributes.position.array).every(Number.isFinite)).toBe(true);
    });
    const size = box.getSize(new THREE.Vector3());
    expect(size.x).toBeGreaterThanOrEqual(96);
    expect(size.x).toBeLessThanOrEqual(110);
    expect(size.y).toBeGreaterThanOrEqual(43);
    expect(size.y).toBeLessThanOrEqual(49);
    expect(size.z).toBeGreaterThanOrEqual(60);
    expect(size.z).toBeLessThanOrEqual(78);
    expect(parts).toEqual(new Set(["building", "roof", "site"]));
    expect([...levels].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(meshCount).toBeLessThan(220);
  });

  it("keeps upper floor plates behind the deep folded front glazing", async () => {
    const bytes = fs.readFileSync(source);
    const { scene } = await new GLTFLoader().parseAsync(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "",
    );
    scene.updateMatrixWorld(true);
    const point = new THREE.Vector3();
    const protrusions = [];
    let checked = 0;
    scene.traverse((object) => {
      if (!object.isMesh || !object.name.endsWith("_slab") || object.userData.level < 2) return;
      const positions = object.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        point.fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld);
        if (Math.abs(point.x) > 26.6) continue;
        // Blender -Y is glTF +Z. The central face retreats by 11.9 m.
        const facadeZ = 19.4 + Math.max(0, Math.abs(point.x) - 15.2) * 11.9 / 11.4;
        checked++;
        if (point.z > facadeZ + 0.15) protrusions.push([object.name, ...point.toArray()]);
      }
    });
    expect(checked).toBeGreaterThan(100);
    expect(protrusions.slice(0, 8)).toEqual([]);

    for (const x of [-23, -19, 0.6, 19, 23]) {
      const ray = new THREE.Raycaster(new THREE.Vector3(x, 20, 80), new THREE.Vector3(0, 0, -1));
      const hit = ray.intersectObject(scene, true)[0];
      expect(hit).toBeDefined();
      expect(hit.object.name).toMatch(/_glass/);
      const facadeZ = 19.4 + Math.max(0, Math.abs(x) - 15.2) * 11.9 / 11.4;
      expect(hit.point.z).toBeCloseTo(facadeZ, 0);
    }
  });
});
