import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { buildings } from "../data/teachingComplex.js";
import { assignBuildingIds, loadGltf } from "./assets.js";
import { createFloorCamera, createMapCamera, fitMapCameraToBox, resizeCamera } from "./camera.js";
import { configureFixedSceneControls, setFixedSceneTarget } from "./controls.js";
import { createFloorView } from "./floorView.js";
import { createPicker } from "./picking.js";

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
  let mode = "map";
  let picker = null;

  const buildingHighlightMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd48a,
    roughness: 0.8,
  });

  addLights(scene);

  async function init() {
    onStatus("加载综合教学楼模型...");
    const gltf = await loadGltf("/assets/glb/teaching_complex_1_6.glb");
    mapRoot = gltf.scene;
    scene.add(mapRoot);

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

    floorView = await createFloorView(scene);
    setupPicker();
    onStatus("点击 1号教学楼进入楼层选择；其他楼栋可查看信息。");
    animate();
  }

  function setupPicker() {
    picker?.dispose();
    picker = createPicker({
      camera: () => activeCamera,
      domElement: renderer.domElement,
      getTargets: () => (mode === "map" ? [...buildingGroups.values()].flat() : floorView.pickTargets),
      onHover: (id) => {
        if (mode === "map") {
          highlightBuilding(id);
        } else {
          floorView.highlight(id);
        }
      },
      onClick: (id) => {
        if (!id) return;
        if (mode === "map") {
          onBuildingClick(id);
          return;
        }
        onFloorClick(id);
      },
    });
  }

  function showMap() {
    mode = "map";
    activeCamera = mapCamera;
    controls.object = activeCamera;
    setFixedSceneTarget(controls, mapTarget.x, mapTarget.y, mapTarget.z);
    mapRoot.visible = true;
    floorView.hide();
    highlightBuilding(null);
    onStatus("建筑群地图视角。点击楼栋进入楼层选择。");
  }

  function showBuildingFloors(buildingId) {
    const building = buildings.find((item) => item.id === buildingId);
    if (buildingId !== "teaching-1") {
      highlightBuilding(buildingId);
      onStatus(`${building?.name ?? "该楼栋"} 的楼层模型将在后续复用生成。`);
      return;
    }

    mode = "floors";
    activeCamera = floorCamera;
    controls.object = activeCamera;
    setFixedSceneTarget(controls, 4, 6, 0);
    mapRoot.visible = false;
    floorView.show();
    floorView.clearHighlight();
    onStatus("1号教学楼楼层选择：悬停楼层高亮，点击楼层查看房间。");
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
    controls.update();
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
