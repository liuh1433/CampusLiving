import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { buildings } from "../data/teachingComplex.js";

const loader = new GLTFLoader();

export async function loadGltf(url) {
  return await loader.loadAsync(url);
}

export function assignBuildingIds(root) {
  const prefixes = buildings.map((building) => [building.modelNodePrefix, building.id]);
  const groups = new Map(buildings.map((building) => [building.id, []]));

  root.traverse((object) => {
    if (!object.isMesh) return;
    const match = prefixes.find(([prefix]) => object.name.startsWith(prefix));
    if (!match) return;
    object.userData.buildingId = match[1];
    groups.get(match[1]).push(object);
  });

  return groups;
}

export function setGroupHighlight(meshes, highlighted) {
  meshes.forEach((mesh) => {
    if (!mesh.material) return;
    if (!mesh.userData.originalMaterial) {
      mesh.userData.originalMaterial = mesh.material;
    }
    mesh.material = highlighted ? mesh.userData.highlightMaterial : mesh.userData.originalMaterial;
  });
}
