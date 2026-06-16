export function configureFixedSceneControls(controls) {
  controls.enabled = false;
  controls.enableRotate = false;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = false;
  controls.autoRotate = false;
  return controls;
}

export function setFixedSceneTarget(controls, x, y, z) {
  controls.target.set(x, y, z);
  controls.update?.();
}
