import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { buildings } from "../data/teachingComplex.js";
import { assignBuildingIds, loadGltf } from "./assets.js";
import { createFloorCamera, createMapCamera, fitMapCameraToBox, resizeCamera } from "./camera.js";
import { configureFixedSceneControls, setFixedSceneTarget } from "./controls.js";
import { createFloorView } from "./floorView.js";
import { createPicker } from "./picking.js";
import { createCameraAnimator, createFlightPath, computeMeshCenter, smoothstep, bezierQuadratic } from "./cameraAnimator.js";
import { createClassroomInterior } from "./classroomInterior.js";

export function createAppScene({ canvas, onStatus, onBuildingClick, onFloorClick }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x79c8b5);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x79c8b5, 120, 230);

  const mapCamera = createMapCamera(window.innerWidth, window.innerHeight);
  const floorCamera = createFloorCamera(window.innerWidth, window.innerHeight);
  let activeCamera = mapCamera;

  const controls = new OrbitControls(activeCamera, renderer.domElement);
  configureFixedSceneControls(controls);
  setFixedSceneTarget(controls, 0, -2, 8);

  let mapRoot = null;
  let mapTarget = new THREE.Vector3(0, -2, 8);
  let buildingGroups = new Map();
  let floorView = null;
  let classroomInterior = null;
  let mode = "map";
  let picker = null;
  let cameraAnimator = null;
  let pendingBuildingClick = null; // 动画完成后执行的回调

  // 保存地图摄像机的原始状态，动画结束后恢复
  let mapCameraOriginalPos = new THREE.Vector3();
  let mapCameraOriginalTarget = new THREE.Vector3();

  const buildingHighlightMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd48a,
    roughness: 0.8,
  });

  addLights(scene);

  // 创建摄像机动画器
  cameraAnimator = createCameraAnimator({
    getCamera: () => activeCamera,
    onStart: () => {
      controls.enabled = false;
      onStatus("摄像机飞行中...");
    },
    onComplete: () => {
      controls.enabled = false;
      onStatus("飞行完成。");

      // 执行延迟的回调
      if (pendingBuildingClick) {
        const callback = pendingBuildingClick;
        pendingBuildingClick = null;
        callback();
      }
    },
  });

  async function init() {
    onStatus("加载综合教学楼模型...");
    try {
      const gltf = await loadGltf("/assets/glb/teaching_complex_1_6.glb");
      mapRoot = gltf.scene;
      scene.add(mapRoot);
    } catch (err) {
      console.error("[Scene] 模型加载失败:", err);
      onStatus(`模型加载失败: ${err.message}。请刷新页面重试。`);
      return;
    }

    buildingGroups = assignBuildingIds(mapRoot);
    const mapFocusBox = new THREE.Box3();
    buildingGroups.forEach((meshes) => {
      meshes.forEach((mesh) => {
        mesh.userData.originalMaterial = mesh.material;
        mesh.userData.highlightMaterial = buildingHighlightMaterial;
        mapFocusBox.expandByObject(mesh);
      });
    });
    if (!mapFocusBox.isEmpty()) {
      mapTarget = fitMapCameraToBox(mapCamera, mapFocusBox, window.innerWidth, window.innerHeight);
      setFixedSceneTarget(controls, mapTarget.x, mapTarget.y, mapTarget.z);
    }

    // 保存地图摄像机的原始状态（动画会移动它，返回地图时需恢复）
    mapCameraOriginalPos.copy(mapCamera.position);
    mapCameraOriginalTarget.copy(mapTarget);

    floorView = createFloorView(scene, mapRoot);
    classroomInterior = createClassroomInterior(scene);
    setupPicker();
    onStatus("点击任意楼栋进入楼层选择。");
    animate();
  }

  function setupPicker() {
    picker?.dispose();
    picker = createPicker({
      camera: () => activeCamera,
      domElement: renderer.domElement,
      getTargets: () => {
        if (mode === "map") return [...buildingGroups.values()].flat();
        if (mode === "classroom") return []; // 教室模式不处理拾取
        return floorView.pickTargets;
      },
      onHover: (id) => {
        if (mode === "classroom") return;
        if (mode === "map") {
          highlightBuilding(id);
        } else {
          floorView.highlight(id);
        }
      },
      onClick: (id) => {
        if (!id) return;
        if (mode === "classroom") return;
        if (mode === "map") {
          const targetMeshes = buildingGroups.get(id);
          if (targetMeshes && targetMeshes.length > 0 && !cameraAnimator.isAnimating()) {
            // 保存动画前的地图摄像机状态
            mapCameraOriginalPos.copy(mapCamera.position);
            mapCameraOriginalTarget.copy(controls.target);

            const center = computeMeshCenter(targetMeshes);

            // 动画终点 = 楼层摄像机位置，确保最后一帧与静止时一致
            const endPos = new THREE.Vector3(
              center.x + 26, center.y + 16, center.z + 48
            );

            const pathOptions = {
              totalFrames: 60,
              customEndPos: endPos,
              customLookAt: center.clone(),
            };

            const pathData = createFlightPath(activeCamera, targetMeshes, pathOptions);
            pendingBuildingClick = () => onBuildingClick(id);
            cameraAnimator.start(pathData);
          } else {
            onBuildingClick(id);
          }
          return;
        }
        onFloorClick(id);
      },
    });
  }

  function showMap() {
    mode = "map";
    activeCamera = mapCamera;

    // 恢复地图摄像机原始位置和朝向
    mapCamera.position.copy(mapCameraOriginalPos);
    mapCamera.lookAt(mapCameraOriginalTarget);

    controls.object = activeCamera;
    setFixedSceneTarget(controls, mapCameraOriginalTarget.x, mapCameraOriginalTarget.y, mapCameraOriginalTarget.z);
    mapRoot.visible = true;
    floorView.hide();
    classroomInterior.hide();
    highlightBuilding(null);
    onStatus("建筑群地图视角。点击楼栋进入楼层选择。");
  }

  function showBuildingFloors(buildingId) {
    const building = buildings.find((item) => item.id === buildingId);
    if (!building) return;

    // 根据建筑的实际 mesh 计算中心，动态定位楼层摄像机
    const meshes = buildingGroups.get(buildingId);
    const center = meshes && meshes.length > 0
      ? computeMeshCenter(meshes)
      : new THREE.Vector3(4, 6, 0);

    // 将楼层摄像机放到建筑前方 + 上方
    floorCamera.position.set(center.x + 26, center.y + 16, center.z + 48);
    floorCamera.lookAt(center);

    mode = "floors";
    activeCamera = floorCamera;
    controls.object = activeCamera;
    setFixedSceneTarget(controls, center.x, center.y, center.z);
    mapRoot.visible = false;
    classroomInterior.hide();
    floorView.show(buildingId);
    floorView.clearHighlight();
    onStatus(`${building?.name ?? buildingId} 楼层选择：悬停高亮，点击查看房间。`);
  }

  function showClassroomInterior(roomId) {
    if (cameraAnimator.isAnimating()) return;

    const config = classroomInterior.getCameraConfig();

    // 保存当前摄像机位置作为动画起点
    const startPos = activeCamera.position.clone();

    // 终点：教室内部视角
    const endPos = config.position.clone();
    const endLookAt = config.lookAt.clone();

    // 弧线中点
    const midPos = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
    const arcHeight = startPos.distanceTo(endPos) * 0.3;
    midPos.y += arcHeight;

    // 生成动画帧
    const totalFrames = 60;
    const frames = [];
    for (let frame = 0; frame < totalFrames; frame++) {
      const t = frame / (totalFrames - 1);
      const tEased = smoothstep(t);
      const u = 1 - tEased;
      const position = new THREE.Vector3(
        u * u * startPos.x + 2 * u * tEased * midPos.x + tEased * tEased * endPos.x,
        u * u * startPos.y + 2 * u * tEased * midPos.y + tEased * tEased * endPos.y,
        u * u * startPos.z + 2 * u * tEased * midPos.z + tEased * tEased * endPos.z,
      );
      frames.push({ position, lookAt: endLookAt.clone() });
    }

    mode = "classroom";
    mapRoot.visible = false;
    floorView.hide();
    classroomInterior.show(roomId);

    const pathData = { frames, keyDuration: totalFrames };
    cameraAnimator.start(pathData, () => {
      // 动画完成后：将 controls 目标同步到教室内部视角
      setFixedSceneTarget(controls, endLookAt.x, endLookAt.y, endLookAt.z);
      onStatus("教室内部视图。点击底部返回按钮退出。");
    });

    onStatus("正在进入教室内部视图...");
  }

  function selectFloor(floorId) {
    floorView.highlight(floorId);
    onStatus(`${floorId.toUpperCase()} 已选中，右侧显示房间列表。`);
  }

  function highlightBuilding(buildingId) {
    buildingGroups.forEach((meshes, id) => {
      meshes.forEach((mesh) => {
        mesh.material = id === buildingId ? mesh.userData.highlightMaterial : mesh.userData.originalMaterial;
      });
    });
  }

  function animate() {
    requestAnimationFrame(animate);
    if (!cameraAnimator.isAnimating()) {
      controls.update();
    }
    renderer.render(scene, activeCamera);
  }

  function handleResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    resizeCamera(mapCamera, window.innerWidth, window.innerHeight);
    resizeCamera(floorCamera, window.innerWidth, window.innerHeight);
  }

  window.addEventListener("resize", handleResize);

  return {
    init,
    showMap,
    showBuildingFloors,
    showClassroomInterior,
    selectFloor,
  };
}

function addLights(scene) {
  const hemisphere = new THREE.HemisphereLight(0xe7fff8, 0x66836e, 2.3);
  scene.add(hemisphere);

  const sun = new THREE.DirectionalLight(0xffffff, 2.6);
  sun.position.set(48, -42, 70);
  scene.add(sun);
}
