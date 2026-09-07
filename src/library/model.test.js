import { describe, expect, it } from "vitest";
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { inspectModel, setPartVisibility, getVisibleBounds, isVisible } from "./model.js";

function fixture() {
  const root = new Group();
  root.userData.buildingId = "library-jinming";
  const body = new Mesh(new BoxGeometry(100, 40, 70), new MeshStandardMaterial());
  body.position.y = 20;
  root.add(body);
  const roof = new Group();
  roof.userData.part = "roof";
  const roofMesh = new Mesh(new BoxGeometry(100, 5, 70), new MeshStandardMaterial());
  roofMesh.position.y = 42.5;
  roof.add(roofMesh);
  root.add(roof);
  const site = new Group();
  site.userData.part = "site";
  const nested = new Group();
  const siteMesh = new Mesh(new BoxGeometry(140, 1, 130), new MeshStandardMaterial());
  siteMesh.position.y = -0.5;
  nested.add(siteMesh);
  site.add(nested);
  root.add(site);
  return { root, roof, roofMesh, site, siteMesh };
}

describe("library model groups", () => {
  it("measures the architecture without inherited site geometry", () => {
    const model = inspectModel(fixture().root);
    expect(model.buildingBounds.getSize(new Vector3()).toArray()).toEqual([100, 45, 70]);
    expect(model.partMeshes.roof).toHaveLength(1);
    expect(model.partMeshes.site).toHaveLength(1);
  });

  it("hides group descendants independently and updates the bounds used for framing", () => {
    const { root, roofMesh, siteMesh } = fixture();
    const model = inspectModel(root);
    setPartVisibility(model, "site", false);
    expect(isVisible(siteMesh)).toBe(false);
    expect(isVisible(roofMesh)).toBe(true);
    expect(getVisibleBounds(root).getSize(new Vector3()).toArray()).toEqual([100, 45, 70]);
    setPartVisibility(model, "roof", false);
    expect(getVisibleBounds(root).max.y).toBe(40);
    setPartVisibility(model, "site", true);
    expect(isVisible(siteMesh)).toBe(true);
    expect(isVisible(roofMesh)).toBe(false);
  });

  it("preserves intentionally hidden nodes when a part is re-enabled", () => {
    const { root, roof } = fixture();
    roof.visible = false;
    const model = inspectModel(root);
    setPartVisibility(model, "roof", false);
    setPartVisibility(model, "roof", true);
    expect(roof.visible).toBe(false);
  });
});
