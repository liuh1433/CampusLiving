import * as THREE from "three";

export function createMapCamera(width, height) {
  const aspect = width / Math.max(height, 1);
  const camera = new THREE.OrthographicCamera(-50 * aspect, 50 * aspect, 50, -50, 0.1, 1000);
  camera.position.set(58, 68, 72);
  camera.lookAt(0, 6, 0);
  return camera;
}

export function createFloorCamera(width, height) {
  const camera = new THREE.PerspectiveCamera(38, width / Math.max(height, 1), 0.1, 1000);
  camera.position.set(30, 22, 48);
  camera.lookAt(4, 6, 0);
  return camera;
}

export function resizeCamera(camera, width, height) {
  const aspect = width / Math.max(height, 1);
  if (camera.isOrthographicCamera) {
    const frustum = camera.userData.baseFrustum ?? 50;
    camera.left = -frustum * aspect;
    camera.right = frustum * aspect;
    camera.top = frustum;
    camera.bottom = -frustum;
  } else {
    camera.aspect = aspect;
  }
  camera.updateProjectionMatrix();
}

export function fitMapCameraToBox(camera, box, width, height, padding = 1.2) {
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const aspect = width / Math.max(height, 1);
  const neededHeight = Math.max(size.x / Math.max(aspect, 0.1), size.y) * padding;
  const frustum = Math.max(58, neededHeight / 2);
  const target = new THREE.Vector3(center.x, Math.max(6, center.y), center.z);

  camera.userData.baseFrustum = frustum;
  camera.left = -frustum * aspect;
  camera.right = frustum * aspect;
  camera.top = frustum;
  camera.bottom = -frustum;
  camera.position.set(target.x + 58, target.y + 62, target.z + 72);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  return target;
}
