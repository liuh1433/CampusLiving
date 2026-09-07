import { describe, expect, it } from "vitest";
import { Box3, PerspectiveCamera, Vector3 } from "three";
import { fitView, boxCorners, VIEW_DIRECTIONS } from "./camera.js";

describe("library camera framing", () => {
  const box = new Box3(new Vector3(-70, -1, -65), new Vector3(70, 45, 65));

  for (const [view, direction] of Object.entries(VIEW_DIRECTIONS)) {
    for (const [width, height] of [[1440, 672], [390, 546]]) {
      it(`keeps the whole site in frame for ${view} at ${width}x${height}`, () => {
        const aspect = width / height;
        const fit = fitView(box, { direction, aspect, target: new Vector3(0, 16, 0) });
        const camera = new PerspectiveCamera(38, aspect, 0.1, 10000);
        camera.position.copy(fit.position);
        camera.lookAt(fit.target);
        camera.updateMatrixWorld();

        for (const corner of boxCorners(box)) {
          const projected = corner.project(camera);
          expect(Math.abs(projected.x)).toBeLessThanOrEqual(1 / 1.1 + 0.00001);
          expect(Math.abs(projected.y)).toBeLessThanOrEqual(1 / 1.1 + 0.00001);
          expect(projected.z).toBeGreaterThan(-1);
          expect(projected.z).toBeLessThan(1);
        }
      });
    }
  }

  it("also fits an offset building instead of assuming a centered model", () => {
    const shifted = box.clone().translate(new Vector3(85, 4, -22));
    const fit = fitView(shifted, { direction: VIEW_DIRECTIONS.front, aspect: 0.6 });
    expect(fit.target.x).toBe(85);
    expect(fit.target.z).toBe(-22);
    expect(fit.position.distanceTo(fit.target)).toBeGreaterThan(100);
  });
});
