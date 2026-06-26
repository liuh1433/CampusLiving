import * as THREE from "three";
import { buildings, getFloorsForBuilding } from "../data/teachingComplex.js";
import { loadGltf } from "./assets.js";

export async function createFloorView(scene) {
  const gltf = await loadGltf("/assets/glb/teaching_complex_1_6.glb");
  const root = gltf.scene;
  root.name = "floor_view_root";
  root.visible = false;
  root.position.set(0, -1, 0);

  // 按 buildingId → floorId → meshes 分组
  const buildingFloorGroups = new Map();
  // 按 floorId → meshes 扁平索引
  const floorGroups = new Map();

  root.traverse((object) => {
    if (!object.isMesh) return;
    // 匹配 teaching_N_floor_M 模式
    const match = object.name.match(/teaching_(\d)_floor_(\d)/);
    if (!match) return;
    const buildingId = `teaching-${match[1]}`;
    const floorId = `${buildingId}-${match[2]}f`;

    object.userData.floorId = floorId;
    object.userData.buildingId = buildingId;

    // 按 building 分组
    if (!buildingFloorGroups.has(buildingId)) {
      buildingFloorGroups.set(buildingId, new Map());
    }
    const bfMap = buildingFloorGroups.get(buildingId);
    if (!bfMap.has(floorId)) {
      bfMap.set(floorId, []);
    }
    bfMap.get(floorId).push(object);

    // 按 floor 分组
    if (!floorGroups.has(floorId)) {
      floorGroups.set(floorId, []);
    }
    floorGroups.get(floorId).push(object);
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

  let currentBuildingId = null;

  return {
    root,
    /** 当前可见楼栋的所有楼层 mesh */
    pickTargets: [],
    show(buildingId) {
      currentBuildingId = buildingId;
      root.visible = true;

      // 只显示当前楼栋的楼层 mesh，隐藏其他
      root.traverse((object) => {
        if (!object.isMesh) return;
        if (object.userData.buildingId) {
          object.visible = object.userData.buildingId === buildingId;
        }
      });

      // 更新 pick targets
      const bfMap = buildingFloorGroups.get(buildingId);
      this.pickTargets = bfMap ? [...bfMap.values()].flat() : [];
    },
    hide() {
      root.visible = false;
      currentBuildingId = null;
      this.pickTargets = [];
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
    getFloorsForBuilding(buildingId) {
      return buildingFloorGroups.get(buildingId) ?? new Map();
    },
  };
}
