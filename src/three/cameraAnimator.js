import * as THREE from "three";

// ============================================================
// 相机动画模块 - 核心算法
// ============================================================

/**
 * Smoothstep 缓动函数 (Ease-In-Out)
 * 公式: t = t * t * (3.0 - 2.0 * t)
 * 效果: 开始慢 → 中间加速 → 接近终点迅速减速（电影级刹车效果）
 */
export function smoothstep(t) {
  return t * t * (3.0 - 2.0 * t);
}

/**
 * 二次贝塞尔曲线插值
 * B(t) = (1-t)²·P0 + 2(1-t)t·P1 + t²·P2
 */
export function bezierQuadratic(p0, p1, p2, t) {
  const u = 1 - t;
  return new THREE.Vector3(
    u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
    u * u * p0.z + 2 * u * t * p1.z + t * t * p2.z
  );
}

/**
 * 计算一组对象的包围盒中心
 */
export function computeMeshCenter(meshes) {
  const box = new THREE.Box3();
  meshes.forEach((mesh) => box.expandByObject(mesh));
  return box.getCenter(new THREE.Vector3());
}

/**
 * 计算摄像机终点位置
 * @param {THREE.Vector3} center - 建筑中心点
 * @param {number} distance - 距离建筑的距离
 * @param {number} height - 抬高高度
 * @returns {THREE.Vector3} 终点位置
 */
export function computeEndPosition(center, distance = 25, height = 8) {
  return new THREE.Vector3(
    center.x,
    center.y + height,
    center.z + distance
  );
}

/**
 * 计算贝塞尔曲线的弧线中点
 * @param {THREE.Vector3} start - 起点
 * @param {THREE.Vector3} end - 终点
 * @returns {THREE.Vector3} 弧线高点
 */
export function computeArcMidpoint(start, end) {
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const arcHeight = start.distanceTo(end) * 0.4;
  mid.y += arcHeight;
  return mid;
}

/**
 * 创建摄像机飞行关键帧数组
 * 包含每一帧的 { position, lookAt } 数据
 *
 * @param {THREE.Camera} camera - 当前摄像机
 * @param {Array<THREE.Mesh>} targetMeshes - 目标建筑的所有 mesh
 * @param {Object} options
 * @param {number} options.totalFrames - 总帧数 (默认 90)
 * @param {number} options.distance - 终点距建筑距离 (默认 25)
 * @param {number} options.height - 终点抬高高度 (默认 8)
 * @returns {{ frames: Array<{position:THREE.Vector3, lookAt:THREE.Vector3}>, keyDuration: number }}
 */
export function createFlightPath(camera, targetMeshes, options = {}) {
  const {
    totalFrames = 90,
    distance = 25,
    height = 8,
    customEndPos = null,
    customLookAt = null,
  } = options;

  // 起点：当前摄像机位置
  const startPos = camera.position.clone();

  // 终点：建筑前方 + 上方（或自定义终点）
  const center = computeMeshCenter(targetMeshes);
  const endPos = customEndPos
    ? customEndPos.clone()
    : computeEndPosition(center, distance, height);

  // 对焦点：建筑中心（或自定义）
  const lookAtTarget = customLookAt
    ? customLookAt.clone()
    : center.clone();

  // 弧线高点
  const midPos = computeArcMidpoint(startPos, endPos);

  // 生成每一帧的位置和目标点
  const frames = [];
  for (let frame = 0; frame < totalFrames; frame++) {
    const t = frame / (totalFrames - 1);
    const tEased = smoothstep(t);
    const position = bezierQuadratic(startPos, midPos, endPos, tEased);

    frames.push({
      position,
      lookAt: lookAtTarget.clone(),
    });
  }

  return {
    frames,
    keyDuration: totalFrames,
    startPos: startPos.clone(),
    endPos: endPos.clone(),
    midPos: midPos.clone(),
    center: center.clone(),
  };
}

/**
 * 创建摄像机动画器
 *
 * @param {Object} config
 * @param {() => THREE.Camera} config.getCamera - 获取当前摄像机
 * @param {() => void} config.onStart - 动画开始回调
 * @param {() => void} config.onComplete - 动画完成回调
 * @param {number} config.fps - 帧率 (默认 30)
 * @returns {Object} animator API
 */
export function createCameraAnimator(config = {}) {
  const { getCamera, onStart, onComplete, fps = 30 } = config;

  let animating = false;
  let frames = [];
  let currentFrame = 0;
  let totalFrames = 0;
  let rafId = null;
  let startTime = 0;
  let frameInterval = 1000 / fps;

  function animate(timestamp) {
    if (!animating) return;

    if (!startTime) {
      startTime = timestamp;
    }

    const elapsed = timestamp - startTime;
    const frameIndex = Math.min(
      Math.floor(elapsed / frameInterval),
      totalFrames - 1
    );

    if (frameIndex !== currentFrame && frameIndex < totalFrames) {
      currentFrame = frameIndex;
      const frame = frames[currentFrame];
      const camera = getCamera();

      if (camera) {
        camera.position.copy(frame.position);
        camera.lookAt(frame.lookAt);
      }
    }

    if (frameIndex >= totalFrames - 1) {
      stop();
      return;
    }

    rafId = requestAnimationFrame(animate);
  }

  function start(pathData) {
    if (animating) {
      cancelAnimationFrame(rafId);
    }

    frames = pathData.frames;
    totalFrames = pathData.keyDuration;
    currentFrame = 0;
    startTime = 0;
    animating = true;

    onStart?.();
    rafId = requestAnimationFrame(animate);
  }

  function stop() {
    animating = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    // 确保到达最终位置
    if (frames.length > 0) {
      const lastFrame = frames[frames.length - 1];
      const camera = getCamera();
      if (camera) {
        camera.position.copy(lastFrame.position);
        camera.lookAt(lastFrame.lookAt);
      }
    }

    onComplete?.();
  }

  function isAnimating() {
    return animating;
  }

  return { start, stop, isAnimating };
}