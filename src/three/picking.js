import * as THREE from "three";

export function createPicker({ camera, domElement, getTargets, onHover, onClick }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hoveredId = null;

  function updatePointer(event) {
    const rect = domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function pick() {
    raycaster.setFromCamera(pointer, camera());
    const intersections = raycaster.intersectObjects(getTargets(), true);
    return intersections.find((hit) => hit.object.userData.buildingId || hit.object.userData.floorId);
  }

  function handleMove(event) {
    updatePointer(event);
    const hit = pick();
    const id = hit?.object.userData.buildingId ?? hit?.object.userData.floorId ?? null;
    if (id !== hoveredId) {
      hoveredId = id;
      onHover?.(id);
    }
  }

  function handleClick(event) {
    updatePointer(event);
    const hit = pick();
    if (!hit) return;
    const id = hit.object.userData.buildingId ?? hit.object.userData.floorId;
    onClick?.(id, hit.object);
  }

  domElement.addEventListener("pointermove", handleMove);
  domElement.addEventListener("click", handleClick);

  return {
    dispose() {
      domElement.removeEventListener("pointermove", handleMove);
      domElement.removeEventListener("click", handleClick);
    },
  };
}
