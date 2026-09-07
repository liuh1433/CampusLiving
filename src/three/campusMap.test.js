import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { Box3, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { assembleCampus } from "./campusMap.js";
import { CAMPUS_PLACEMENTS, mapPoint, MAP_SCALE } from "../data/campusLayout.js";

async function asset(name) {
  const bytes = readFileSync(`public/assets/glb/${name}.glb`);
  return (await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "")).scene;
}

describe("shared campus models", () => {
  let teaching, library, campus;
  beforeAll(async () => {
    teaching = await asset("teaching_complex_1_6");
    library = await asset("library_jinming");
    campus = assembleCampus(teaching, library);
  });
  it("registers every model to its plan footprint", () => {
    expect(campus.models.size).toBe(7);
    for (const placement of CAMPUS_PLACEMENTS) {
      const model = campus.models.get(placement.id);
      const box = new Box3().setFromObject(model);
      const center = box.getCenter(new Vector3());
      const expected = mapPoint(...placement.center);
      const size = box.getSize(new Vector3());
      expect(center.x).toBeCloseTo(expected.x, 3);
      expect(center.z).toBeCloseTo(expected.z, 3);
      expect(size.x).toBeCloseTo(placement.size[0] * MAP_SCALE, 3);
      expect(size.z).toBeCloseTo(placement.size[1] * MAP_SCALE, 3);
      expect(box.min.y).toBeCloseTo(0.08, 3);
      model.traverse((node) => {
        if (node.isMesh) expect(node.userData.buildingId).toBe(placement.id);
      });
    }
  });
  it("keeps source meshes unchanged and excludes presentation sites", () => {
    expect(teaching.getObjectByName("complex_green_base")).toBeTruthy();
    expect(new Box3().setFromObject(library).getSize(new Vector3()).x).toBeGreaterThan(100);
    campus.root.traverse((node) => {
      expect(node.userData.part).not.toBe("site");
      expect(node.name).not.toMatch(/complex_green_base|marco_plaza|_label$/);
    });
    const box = new Box3().setFromObject(campus.models.get("library-jinming"));
    for (const n of [1, 2, 3, 4, 5, 6]) {
      expect(box.intersectsBox(new Box3().setFromObject(campus.models.get(`teaching-${n}`)))).toBe(false);
    }
  });
});
