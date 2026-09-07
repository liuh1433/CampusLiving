import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { CAMPUS_PLACEMENTS, mapPoint, LANDMARKS } from "./campusLayout.js";

describe("campus plan registration", () => {
  it("contains only the seven existing buildings", () => {
    expect(CAMPUS_PLACEMENTS.map((p) => p.id).sort()).toEqual([
      "library-jinming", "teaching-1", "teaching-2", "teaching-3", "teaching-4", "teaching-5", "teaching-6",
    ]);
  });
  it("maps north upward and places the library west of the plaza", () => {
    expect(mapPoint(650, 730).z).toBeLessThan(mapPoint(650, 900).z);
    const library = CAMPUS_PLACEMENTS.find((p) => p.id === "library-jinming");
    expect(library.center[0]).toBeLessThan(LANDMARKS.plaza[0]);
    expect(CAMPUS_PLACEMENTS.find((p) => p.id === "teaching-1").center[1]).toBeGreaterThan(LANDMARKS.plaza[1]);
    const forward = new Vector3(0, 0, 1).applyAxisAngle(new Vector3(0, 1, 0), library.rotation);
    expect(forward.x).toBeCloseTo(-1);
    expect(forward.z).toBeCloseTo(0);
  });
  it("orders the eastern teaching wings south to north", () => {
    const get = (n) => CAMPUS_PLACEMENTS.find((p) => p.id === `teaching-${n}`);
    expect(get(2).center[1]).toBeGreaterThan(get(3).center[1]);
    expect(get(3).center[1]).toBeGreaterThan(get(5).center[1]);
    expect(get(5).center[1]).toBeGreaterThan(get(6).center[1]);
    for (const n of [2, 3, 5, 6]) expect(get(4).center[0]).toBeGreaterThan(get(n).center[0]);
  });
});
