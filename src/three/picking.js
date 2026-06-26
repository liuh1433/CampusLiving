import * as THREE from "three";

/**
 * 创建拾取器（含防误触机制）
 *
 * 防误触规则：
 * 1. 按下到释放的时间必须在 50ms~500ms 之间（排除拖拽和快速抖动）
 * 2. 按下到释放的指针移动距离不能超过 5px（排除拖拽）
 * 3. 两次点击之间最少间隔 800ms（防止双击和快速连点）
 */
export function createPicker({ camera, domElement, getTargets, onHover, onClick }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hoveredId = null;

  // 防误触状态
  let pointerDownTime = 0;
  let pointerDownPos = new THREE.Vector2();
  let lastClickTime = 0;
  const CLICK_MIN_DURATION = 50;    // 最短按下时间 ms
  const CLICK_MAX_DURATION = 500;   // 最长按下时间 ms（超时视为拖拽）
  const CLICK_MAX_MOVE = 5;         // 最大移动距离 px
  const CLICK_COOLDOWN = 800;       // 冷却时间 ms

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

  function handlePointerDown(event) {
    pointerDownTime = performance.now();
    pointerDownPos.set(event.clientX, event.clientY);
  }

  function handleClick(event) {
    updatePointer(event);

    // 防误触检测
    const now = performance.now();
    const duration = now - pointerDownTime;
    const moveDist = Math.sqrt(
      (event.clientX - pointerDownPos.x) ** 2 +
      (event.clientY - pointerDownPos.y) ** 2
    );

    // 按下时间太短 -> 可能是抖动
    if (duration < CLICK_MIN_DURATION) {
      return;
    }
    // 按下时间太长 -> 可能是拖拽
    if (duration > CLICK_MAX_DURATION) {
      return;
    }
    // 移动距离太大 -> 拖拽
    if (moveDist > CLICK_MAX_MOVE) {
      return;
    }
    // 冷却期内 -> 防止连点
    if (now - lastClickTime < CLICK_COOLDOWN) {
      return;
    }

    const hit = pick();
    if (!hit) return;

    const id = hit.object.userData.buildingId ?? hit.object.userData.floorId;
    if (id) {
      lastClickTime = now;
    }
    onClick?.(id, hit.object);
  }

  domElement.addEventListener("pointermove", handleMove);
  domElement.addEventListener("pointerdown", handlePointerDown);
  domElement.addEventListener("click", handleClick);

  return {
    dispose() {
      domElement.removeEventListener("pointermove", handleMove);
      domElement.removeEventListener("pointerdown", handlePointerDown);
      domElement.removeEventListener("click", handleClick);
    },
  };
}
