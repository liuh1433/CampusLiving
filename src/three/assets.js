import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { buildings } from "../data/teachingComplex.js";

const loader = new GLTFLoader();

export async function loadGltf(url) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`模型加载超时: ${url}（请检查文件是否存在或网络连接）`));
    }, 15000);

    loader.load(
      url,
      (gltf) => {
        clearTimeout(timeout);
        resolve(gltf);
      },
      (progress) => {
        if (progress.total > 0) {
          const pct = Math.round((progress.loaded / progress.total) * 100);
          console.log(`[GLTF] ${url} 加载进度: ${pct}%`);
        }
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
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
