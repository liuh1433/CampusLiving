import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { buildings } from "../data/teachingComplex.js";
import { CAMPUS_PLACEMENTS } from "../data/campusLayout.js";
import { loadGltf } from "./assets.js";
import { assembleCampus, createCampusGround } from "./campusMap.js";
import { fitView } from "../library/camera.js";
import { createPicker } from "./picking.js";
import { createClassroomInterior } from "./classroomInterior.js";

const CORE_DIRECTION = [-0.4, 1.45, 1.1];
const TOP_DIRECTION = [0, 1, 0.0001];

export function createAppScene({ canvas, onStatus, onBuildingClick, onReady }) {
  const stage = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0xe9eeec);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 6000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.minDistance = 25;
  controls.maxDistance = 3500;
  controls.screenSpacePanning = true;
  const hemisphere = new THREE.HemisphereLight(0xf6faf8, 0x7e8b80, 2.4);
  const sun = new THREE.DirectionalLight(0xffffff, 2.8);
  sun.position.set(-160, 300, 180);
  scene.add(hemisphere, sun);

  let campus, ground, classroom, transition, picker;
  let loaded = false;
  let mode = "map";
  let view = "core";
  let selected = null;
  let mapVisible = true;
  let frameCount = 0;
  const labelRoot = document.getElementById("building-labels");
  const labels = new Map();
  const highlight = new THREE.MeshStandardMaterial({ color: 0xe6bb72, roughness: 0.75 });

  function boundsForView() {
    if (selected && mode !== "map") return new THREE.Box3().setFromObject(campus.models.get(selected));
    return view === "campus" ? new THREE.Box3().setFromObject(ground) : campus.bounds.clone();
  }

  function flyTo(position, target, instant = false) {
    transition = null;
    if (instant || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      return;
    }
    transition = {
      start: performance.now(), from: camera.position.clone(), targetFrom: controls.target.clone(),
      position, target,
    };
  }

  function fit(instant = false) {
    if (!loaded) return;
    if (mode === "classroom") {
      const config = classroom.getCameraConfig();
      flyTo(config.position, config.lookAt, instant);
      return;
    }
    const direction = view === "top" || view === "campus" ? TOP_DIRECTION : CORE_DIRECTION;
    const fitted = fitView(boundsForView(), { direction, aspect: camera.aspect, fov: camera.fov, padding: 1.2 });
    flyTo(fitted.position, fitted.target, instant);
  }

  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    fit(true);
  }

  function highlightBuilding(id) {
    if (!campus) return;
    for (const [buildingId, meshes] of campus.meshes) {
      for (const mesh of meshes) mesh.material = buildingId === id ? highlight : mesh.userData.originalMaterial;
    }
    canvas.style.cursor = id ? "pointer" : "grab";
  }

  function updateLabels() {
    if (!loaded) return;
    const placed = [];
    for (const [id, label] of labels) {
      const model = campus.models.get(id);
      const box = new THREE.Box3().setFromObject(model);
      const point = box.getCenter(new THREE.Vector3());
      point.y = box.max.y + 1;
      point.project(camera);
      const x = (point.x * 0.5 + 0.5) * stage.clientWidth;
      const y = (-point.y * 0.5 + 0.5) * stage.clientHeight;
      const rect = { left: x - 46, right: x + 46, top: y - 28, bottom: y };
      const overlaps = placed.some((p) => rect.left < p.right && rect.right > p.left && rect.top < p.bottom && rect.bottom > p.top);
      const visible = mode === "map" && view !== "campus" && !overlaps
        && rect.left > 4 && rect.right < stage.clientWidth - 4 && rect.top > 4 && y < stage.clientHeight - 70;
      label.hidden = !visible;
      if (visible) {
        label.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
        placed.push(rect);
      }
    }
  }

  async function init() {
    onStatus("正在加载校园底图与建筑");
    try {
      const teaching = await loadGltf("/assets/glb/teaching_complex_1_6.glb");
      const library = await loadGltf("/assets/glb/library_jinming.glb");
      campus = assembleCampus(teaching.scene, library.scene);
      ground = await createCampusGround(renderer);
      scene.add(ground, campus.root);
      classroom = createClassroomInterior(scene);
      for (const meshes of campus.meshes.values()) {
        for (const mesh of meshes) mesh.userData.originalMaterial = mesh.material;
      }
      for (const placement of CAMPUS_PLACEMENTS) {
        const label = document.createElement("button");
        label.className = "building-label";
        label.type = "button";
        label.textContent = placement.name;
        label.dataset.buildingLabel = placement.id;
        label.addEventListener("click", () => onBuildingClick(placement.id));
        labelRoot.append(label);
        labels.set(placement.id, label);
      }
      picker = createPicker({
        camera: () => camera, domElement: canvas,
        getTargets: () => mode === "map" ? [...campus.meshes.values()].flat() : [],
        onHover: highlightBuilding,
        onClick: (id) => { if (loaded && mode === "map") onBuildingClick(id); },
      });
      loaded = true;
      resize();
      onReady?.();
      onStatus("7 栋建筑已就位 · 示意图配准");
    } catch (error) {
      console.error("[Campus]", error);
      onStatus("校园资源加载失败，请重试");
      document.getElementById("campus-load-error").hidden = false;
    }
  }

  function showMap() {
    if (!loaded) return;
    mode = "map";
    selected = null;
    campus.root.visible = true;
    for (const model of campus.models.values()) model.visible = true;
    ground.visible = mapVisible;
    classroom.hide();
    controls.enabled = true;
    highlightBuilding(null);
    fit();
    onStatus("7 栋建筑已就位 · 示意图配准");
  }

  function showBuildingFloors(id) {
    if (!loaded || !campus.models.has(id)) return;
    selected = id;
    mode = id === "library-jinming" ? "exterior" : "floors";
    view = "core";
    highlightBuilding(null);
    campus.root.visible = true;
    for (const [buildingId, model] of campus.models) model.visible = buildingId === id;
    ground.visible = false;
    classroom.hide();
    controls.enabled = true;
    fit();
    onStatus(id === "library-jinming" ? "图书馆 · 外观模型" : `${buildings.find((b) => b.id === id)?.name} · 楼层数据为演示`);
  }

  function showClassroomInterior(roomId) {
    if (!loaded) return;
    mode = "classroom";
    campus.root.visible = false;
    ground.visible = false;
    classroom.show(roomId);
    controls.enabled = false;
    fit();
    onStatus("自习空间 · 模拟在线状态");
  }

  function setMapView(nextView) {
    view = nextView;
    showMap();
  }

  function zoom(factor) {
    if (!loaded || mode === "classroom") return;
    transition = null;
    const offset = camera.position.clone().sub(controls.target);
    offset.setLength(THREE.MathUtils.clamp(offset.length() / factor, controls.minDistance, controls.maxDistance));
    camera.position.copy(controls.target).add(offset);
    controls.update();
  }

  controls.addEventListener("start", () => { transition = null; });
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  renderer.setAnimationLoop(() => {
    if (transition) {
      const t = Math.min((performance.now() - transition.start) / 650, 1);
      const eased = t * t * (3 - 2 * t);
      camera.position.lerpVectors(transition.from, transition.position, eased);
      controls.target.lerpVectors(transition.targetFrom, transition.target, eased);
      camera.lookAt(controls.target);
      if (t === 1) transition = null;
    } else if (controls.enabled) controls.update();
    renderer.render(scene, camera);
    updateLabels();
    frameCount++;
  });

  Object.defineProperty(window, "__campusViewer", { configurable: true, get: () => ({
    loaded, mode, view, selected, mapVisible: ground?.visible ?? false, transitioning: !!transition,
    frames: frameCount, camera: camera.position.toArray(),
    modelIds: campus ? [...campus.models.keys()] : [],
    visibleModels: campus?.root.visible ? [...campus.models].filter(([, m]) => m.visible).map(([id]) => id) : [],
  }) });

  return {
    init, showMap, showBuildingFloors, showClassroomInterior, setMapView, zoom,
    selectFloor: (id) => onStatus(`${id.toUpperCase()} · 房间数据为演示`),
    setMapVisible(visible) { mapVisible = visible; if (ground && mode === "map") ground.visible = visible; },
    capture() {
      const link = document.createElement("a");
      renderer.render(scene, camera);
      link.href = canvas.toDataURL("image/png");
      link.download = "campus-jinming.png";
      link.click();
    },
    dispose() { renderer.setAnimationLoop(null); resizeObserver.disconnect(); picker?.dispose(); controls.dispose(); renderer.dispose(); },
  };
}
