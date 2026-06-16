import * as THREE from "three";
import { loadGltf } from "./assets.js";

export async function createFloorView(scene) {
  const gltf = await loadGltf("/assets/glb/floors/teaching_1_floors.glb");
  const root = gltf.scene;
  root.name = "teaching_1_floor_view";
  root.visible = false;
  root.position.set(0, -1, 0);

  const floorGroups = new Map();
  root.traverse((object) => {
    if (!object.isMesh) return;
    const match = object.name.match(/teaching_1_floor_(\d)/);
    if (!match) return;
    const floorId = `teaching-1-${match[1]}f`;
    object.userData.floorId = floorId;
    floorGroups.set(floorId, [...(floorGroups.get(floorId) ?? []), object]);
  });

  const highlightMaterial = new THREE.MeshStandardMaterial({
    color: 0xffdf8c,
    roughness: 0.8,
  });

  floorGroups.forEach((meshes) => {
    meshes.forEach((mesh) => {
      mesh.userData.originalMaterial = mesh.material;
      mesh.userData.highlightMaterial = highlightMaterial;
    });
  });

  scene.add(root);

  return {
    root,
    pickTargets: [...floorGroups.values()].flat(),
    show() {
      root.visible = true;
    },
    hide() {
      root.visible = false;
      this.clearHighlight();
    },
    highlight(floorId) {
      floorGroups.forEach((meshes, id) => {
        meshes.forEach((mesh) => {
          mesh.material = id === floorId ? mesh.userData.highlightMaterial : mesh.userData.originalMaterial;
        });
      });
    },
    clearHighlight() {
      floorGroups.forEach((meshes) => {
        meshes.forEach((mesh) => {
          mesh.material = mesh.userData.originalMaterial;
        });
      });
    },
  };
}
