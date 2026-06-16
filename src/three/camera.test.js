import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createMapCamera, fitMapCameraToBox } from "./camera.js";

describe("fitMapCameraToBox", () => {
  it("zooms the map camera out far enough for wide low-height viewports", () => {
    const camera = createMapCamera(1366, 768);
    const box = new THREE.Box3(new THREE.Vector3(-48, 0, -36), new THREE.Vector3(52, 16, 32));

    fitMapCameraToBox(camera, box, 1366, 768);

    expect(camera.top).toBeGreaterThanOrEqual(58);
    expect(camera.right - camera.left).toBeGreaterThan(camera.top - camera.bottom);
    expect(camera.position.y).toBeGreaterThan(60);
  });
});
