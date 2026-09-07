import { Box3 } from "three";

export function hasPart(object, part) {
  for (let node = object; node; node = node.parent) {
    if (node.userData.part === part) return true;
  }
  return false;
}

export function isVisible(object) {
  for (let node = object; node; node = node.parent) {
    if (!node.visible) return false;
  }
  return true;
}

function expandByMesh(box, mesh) {
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
  if (mesh.isInstancedMesh) {
    if (!mesh.boundingBox) mesh.computeBoundingBox();
    box.union(mesh.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
  } else {
    box.union(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
  }
}

export function getVisibleBounds(root) {
  root.updateMatrixWorld(true);
  const bounds = new Box3();
  root.traverseVisible((object) => {
    if (object.isMesh) expandByMesh(bounds, object);
  });
  return bounds;
}

export function inspectModel(root) {
  root.updateMatrixWorld(true);
  const model = {
    root,
    meshes: [],
    partNodes: { roof: [], site: [] },
    partMeshes: { roof: [], site: [] },
    originalVisibility: new Map(),
    buildingBounds: new Box3(),
  };

  root.traverse((object) => {
    if (object.userData.part === "roof" || object.userData.part === "site") {
      model.partNodes[object.userData.part].push(object);
      model.originalVisibility.set(object, object.visible);
    }
    if (!object.isMesh) return;
    model.meshes.push(object);
    for (const part of ["roof", "site"]) {
      if (hasPart(object, part)) model.partMeshes[part].push(object);
    }
    if (!hasPart(object, "site") && isVisible(object)) expandByMesh(model.buildingBounds, object);
  });

  if (model.buildingBounds.isEmpty()) model.buildingBounds.copy(getVisibleBounds(root));
  return model;
}

export function setPartVisibility(model, part, visible) {
  for (const node of model.partNodes[part]) {
    node.visible = visible && model.originalVisibility.get(node);
  }
}

export function disposeModel(root) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  root.traverse((object) => {
    if (!object.isMesh) return;
    geometries.add(object.geometry);
    for (const material of [object.material].flat()) {
      if (!material) continue;
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value?.isTexture) textures.add(value);
      }
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
}
