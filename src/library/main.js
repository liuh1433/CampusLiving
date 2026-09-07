import "./library.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { MODEL_URL, MODEL_FILENAME, LOAD_TIMEOUT_MS, VIEW_LABELS } from "./config.js";
import { fitView, VIEW_DIRECTIONS } from "./camera.js";
import { inspectModel, setPartVisibility, getVisibleBounds, isVisible, disposeModel } from "./model.js";
import { createIcon, mountIcons } from "./vendor/icons.js";

mountIcons();

const $ = (id) => document.getElementById(id);
const app = $("library-app");
const canvas = $("library-canvas");
const select = $("view-select");
const download = $("download-model");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const state = {
  loaded: false, loading: false, error: null, view: "isometric",
  roof: true, site: true, autoRotate: false, renderedFrames: 0,
};
let renderer;
let scene;
let camera;
let controls;
let model;
let sunlight;
let environmentTarget;
let resizeObserver;
let frameId;
let loadAbort;
let transition = null;
let needsRender = true;
let interaction = false;
let lastTime = 0;
let toastTimer;
let viewRect = { width: 1, height: 1, top: 0, bottom: 0, fullHeight: 1 };

const stats = {};
Object.defineProperties(stats, {
  loaded: { enumerable: true, get: () => state.loaded },
  loading: { enumerable: true, get: () => state.loading },
  error: { enumerable: true, get: () => state.error },
  meshes: { enumerable: true, get: () => model?.meshes.length ?? 0 },
  renderedFrames: { enumerable: true, get: () => state.renderedFrames },
  roofsVisible: { enumerable: true, get: () => state.roof },
  siteVisible: { enumerable: true, get: () => state.site },
  visibleRoofs: { enumerable: true, get: () => model?.partMeshes.roof.filter(isVisible).length ?? 0 },
  visibleSite: { enumerable: true, get: () => model?.partMeshes.site.filter(isVisible).length ?? 0 },
  autoRotate: { enumerable: true, get: () => state.autoRotate },
  view: { enumerable: true, get: () => state.view },
  transitioning: { enumerable: true, get: () => Boolean(transition) },
  camera: { enumerable: true, get: () => Object.freeze(camera?.position.toArray() ?? []) },
  target: { enumerable: true, get: () => Object.freeze(controls?.target.toArray() ?? []) },
  viewport: { enumerable: true, get: () => Object.freeze({ ...viewRect }) },
});
Object.defineProperty(window, "__libraryViewer", { value: Object.freeze(stats), writable: false, configurable: true });

function enableTools(enabled) {
  document.querySelectorAll(".viewer-toolbar button, .viewer-toolbar select").forEach((control) => {
    control.disabled = !enabled;
  });
  if (enabled) {
    $("roof-toggle").disabled = model.partNodes.roof.length === 0;
    $("site-toggle").disabled = model.partNodes.site.length === 0;
  }
  download.setAttribute("aria-disabled", String(!enabled));
  download.tabIndex = enabled ? 0 : -1;
}

function setLoadState(status, title, detail) {
  app.dataset.state = status;
  $("load-state").hidden = status === "ready";
  $("load-title").textContent = title;
  $("load-detail").textContent = detail;
  $("load-icon").replaceChildren(createIcon(status === "error" ? "circle-alert" : "loader-circle"));
  $("retry-button").hidden = status !== "error";
  $("load-progress").hidden = status !== "loading";
  $("model-status").textContent = status === "ready" ? "外观模型" : status === "error" ? "加载失败" : "模型加载中";
  canvas.setAttribute("aria-busy", String(status === "loading"));
}

function notify(message) {
  clearTimeout(toastTimer);
  $("viewer-toast").textContent = message;
  $("viewer-toast").hidden = false;
  toastTimer = setTimeout(() => { $("viewer-toast").hidden = true; }, 3200);
}

function updateViewName(view) {
  state.view = view;
  select.value = view;
  $("current-view").textContent = VIEW_LABELS[view];
}

function setAutoRotate(enabled) {
  state.autoRotate = enabled;
  controls.autoRotate = enabled;
  $("auto-rotate").setAttribute("aria-checked", String(enabled));
  if (enabled) updateViewName("free");
  needsRender = true;
}

function framingTarget(bounds) {
  const center = model.buildingBounds.getCenter(new THREE.Vector3());
  const size = model.buildingBounds.getSize(new THREE.Vector3());
  center.y = model.buildingBounds.min.y + size.y * (16 / 45);
  center.y = THREE.MathUtils.clamp(center.y, bounds.min.y, bounds.max.y);
  return center;
}

function moveCamera(position, target, instant = false) {
  // Flush OrbitControls' remaining damping before taking ownership of the camera.
  const damping = controls.enableDamping;
  controls.enableDamping = false;
  const rotate = controls.autoRotate;
  controls.autoRotate = false;
  controls.update(0);
  controls.enableDamping = damping;
  controls.autoRotate = rotate;

  if (instant || reducedMotion.matches) {
    transition = null;
    camera.position.copy(position);
    controls.target.copy(target);
    controls.update(0);
  } else {
    const from = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    const to = new THREE.Spherical().setFromVector3(position.clone().sub(target));
    to.theta = from.theta + THREE.MathUtils.euclideanModulo(to.theta - from.theta + Math.PI, Math.PI * 2) - Math.PI;
    transition = {
      from, to, targetFrom: controls.target.clone(), targetTo: target.clone(),
      start: performance.now(), duration: 720,
    };
  }
  needsRender = true;
}

function fitCurrentView(view = state.view, instant = false) {
  if (!model) return;
  const bounds = getVisibleBounds(model.root);
  if (bounds.isEmpty()) return;
  const direction = VIEW_DIRECTIONS[view] ?? camera.position.clone().sub(controls.target).normalize().toArray();
  const fit = fitView(bounds, { direction, aspect: camera.aspect, fov: camera.fov, target: framingTarget(bounds) });
  controls.maxDistance = Math.max(1000, fit.distance * 3);
  camera.far = Math.max(2500, controls.maxDistance * 2);
  camera.updateProjectionMatrix();
  moveCamera(fit.position, fit.target, instant);
}

function resize() {
  if (!renderer) return;
  const { width, height } = app.getBoundingClientRect();
  const top = Math.ceil($("library-header").getBoundingClientRect().bottom + 14);
  const bottom = Math.ceil(height - $("viewer-bottom").getBoundingClientRect().top + 8);
  viewRect = { width, height: Math.max(80, height - top - bottom), top, bottom, fullHeight: height };
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);
  renderer.setViewport(0, bottom, width, viewRect.height);
  camera.aspect = width / viewRect.height;
  camera.updateProjectionMatrix();
  $("load-state").style.top = `${top + viewRect.height / 2}px`;
  if (state.loaded) fitCurrentView(state.view, true);
  needsRender = true;
}

function render() {
  renderer.render(scene, camera);
  state.renderedFrames += 1;
  needsRender = false;
}

function tick(now) {
  frameId = requestAnimationFrame(tick);
  const delta = Math.min((now - lastTime) / 1000 || 0, 0.05);
  lastTime = now;
  if (document.hidden) return;
  if (transition) {
    const t = Math.min((now - transition.start) / transition.duration, 1);
    const eased = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
    const spherical = new THREE.Spherical(
      THREE.MathUtils.lerp(transition.from.radius, transition.to.radius, eased),
      THREE.MathUtils.lerp(transition.from.phi, transition.to.phi, eased),
      THREE.MathUtils.lerp(transition.from.theta, transition.to.theta, eased),
    );
    controls.target.lerpVectors(transition.targetFrom, transition.targetTo, eased);
    camera.position.setFromSpherical(spherical).add(controls.target);
    camera.lookAt(controls.target);
    needsRender = true;
    if (t === 1) {
      transition = null;
      controls.update(0);
    }
  } else if (state.loaded) {
    if (controls.update(delta)) needsRender = true;
  }
  if (needsRender) {
    const angle = THREE.MathUtils.radToDeg(Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z));
    $("orientation-icon").style.transform = `rotate(${-angle}deg)`;
    render();
  }
}

async function readModel(signal) {
  const response = await fetch(MODEL_URL, { signal, cache: "no-cache" });
  if (!response.ok) throw new Error(response.status === 404 ? "图书馆模型暂未就绪" : "暂时无法读取模型");
  if (response.headers.get("content-type")?.includes("text/html")) throw new Error("图书馆模型暂未就绪");
  const total = Number(response.headers.get("content-length")) || 0;
  if (!response.body) return response.arrayBuffer();
  const reader = response.body.getReader();
  const chunks = [];
  let loaded = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    if (total > 0) {
      const percent = Math.min(99, Math.round(loaded / total * 100));
      $("load-progress").value = percent;
      $("load-detail").textContent = `正在读取模型 · ${percent}%`;
    }
  }
  const bytes = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes.buffer;
}

async function loadModel() {
  if (state.loading) return;
  state.loading = true;
  state.loaded = false;
  state.error = null;
  enableTools(false);
  setLoadState("loading", "正在加载图书馆", "正在读取模型");
  $("load-progress").removeAttribute("value");
  loadAbort = new AbortController();
  const signal = loadAbort.signal;
  const timeout = setTimeout(() => loadAbort.abort(), LOAD_TIMEOUT_MS);
  let pendingRoot;
  try {
    const bytes = await readModel(signal);
    $("load-detail").textContent = "正在准备建筑视图";
    const gltf = await new GLTFLoader().parseAsync(bytes, new URL("/assets/glb/", location.href).href);
    pendingRoot = gltf.scene;
    if (signal.aborted) throw new DOMException("Model load aborted", "AbortError");
    const nextModel = inspectModel(pendingRoot);
    if (nextModel.meshes.length === 0 || nextModel.buildingBounds.isEmpty()) throw new Error("模型内容暂不可用");
    if (model) { scene.remove(model.root); disposeModel(model.root); }
    model = nextModel;
    for (const mesh of model.meshes) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      for (const material of [mesh.material].flat()) {
        if (material && "envMapIntensity" in material) material.envMapIntensity = 0.6;
      }
    }
    scene.add(model.root);
    pendingRoot = null;
    setPartVisibility(model, "roof", state.roof);
    setPartVisibility(model, "site", state.site);

    const bounds = getVisibleBounds(model.root);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const span = Math.max(size.x, size.y, size.z);
    sunlight.position.copy(center).add(new THREE.Vector3(-span * 0.55, span, span * 0.75));
    sunlight.target.position.copy(center);
    const shadow = sunlight.shadow.camera;
    shadow.left = shadow.bottom = -span * 0.75;
    shadow.right = shadow.top = span * 0.75;
    shadow.near = 1;
    shadow.far = span * 4;
    shadow.updateProjectionMatrix();
    sunlight.shadow.normalBias = 0.08;
    renderer.shadowMap.needsUpdate = true;

    const buildingSize = model.buildingBounds.getSize(new THREE.Vector3());
    $("dimension-width").textContent = `约 ${Math.round(buildingSize.x)}`;
    $("dimension-height").textContent = `约 ${Math.round(buildingSize.y)}`;
    $("dimension-depth").textContent = `约 ${Math.round(buildingSize.z)}`;
    controls.minDistance = Math.max(8, buildingSize.length() * 0.1);
    controls.enabled = true;
    state.loaded = true;
    state.loading = false;
    updateViewName("isometric");
    fitCurrentView("isometric", true);
    render();
    setLoadState("ready", "", "");
    enableTools(true);
  } catch (error) {
    if (pendingRoot) disposeModel(pendingRoot);
    state.loading = false;
    state.loaded = false;
    state.error = error.name === "AbortError" ? "模型加载超时" : error.message || "模型加载失败";
    console.error("[Library viewer]", error);
    setLoadState("error", "暂时无法打开图书馆", error.name === "AbortError" ? "加载超时，请重试" : error.message?.includes("模型") ? error.message : "读取未完成，请重试");
    enableTools(false);
  } finally {
    clearTimeout(timeout);
  }
}

function togglePart(part) {
  if (!state.loaded) return;
  state[part] = !state[part];
  setPartVisibility(model, part, state[part]);
  $(`${part}-toggle`).setAttribute("aria-checked", String(state[part]));
  renderer.shadowMap.needsUpdate = true;
  fitCurrentView();
  needsRender = true;
}

function zoom(factor) {
  if (!state.loaded) return;
  const offset = camera.position.clone().sub(controls.target);
  offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
  moveCamera(controls.target.clone().add(offset), controls.target);
}

async function capture() {
  if (!state.loaded) return;
  const button = $("capture-view");
  button.disabled = true;
  try {
    render();
    const ratio = renderer.getPixelRatio();
    const snapshot = document.createElement("canvas");
    snapshot.width = Math.round(viewRect.width * ratio);
    snapshot.height = Math.round(viewRect.height * ratio);
    snapshot.getContext("2d").drawImage(canvas,
      0, Math.round(viewRect.top * ratio), snapshot.width, snapshot.height,
      0, 0, snapshot.width, snapshot.height);
    const blob = await new Promise((resolve) => snapshot.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Empty capture");
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `henan-library-${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    notify("当前视图已保存");
  } catch (error) {
    console.error("[Library capture]", error);
    notify("视图保存失败，请重试");
  } finally {
    button.disabled = !state.loaded;
  }
}

function initialize() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#f4f5f4");
  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 3000);
  camera.position.set(110, 85, 135);
  controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 16, 0);
  controls.enableDamping = !reducedMotion.matches;
  controls.dampingFactor = 0.075;
  controls.autoRotateSpeed = 0.65;
  controls.maxPolarAngle = Math.PI / 2 - 0.015;
  controls.minPolarAngle = 0.0001;
  controls.screenSpacePanning = true;
  controls.enabled = false;
  controls.update(0);
  controls.addEventListener("start", () => { transition = null; interaction = true; });
  controls.addEventListener("end", () => { interaction = false; });
  controls.addEventListener("change", () => {
    needsRender = true;
    if (interaction) updateViewName("free");
  });

  scene.add(new THREE.HemisphereLight(0xffffff, 0xa3aaa0, 1.25));
  sunlight = new THREE.DirectionalLight(0xfff8ee, 2.7);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 2048);
  sunlight.shadow.bias = -0.00015;
  scene.add(sunlight, sunlight.target);
  const room = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  environmentTarget = pmrem.fromScene(room, 0.04);
  scene.environment = environmentTarget.texture;
  scene.environmentIntensity = 0.65;
  room.dispose();
  pmrem.dispose();

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(app);
  resizeObserver.observe($("library-header"));
  resizeObserver.observe($("viewer-bottom"));
  resize();
  frameId = requestAnimationFrame(tick);
  loadModel();
}

select.addEventListener("change", () => {
  setAutoRotate(false);
  updateViewName(select.value);
  fitCurrentView(select.value);
});
$("auto-rotate").addEventListener("click", () => setAutoRotate(!state.autoRotate));
$("roof-toggle").addEventListener("click", () => togglePart("roof"));
$("site-toggle").addEventListener("click", () => togglePart("site"));
$("zoom-in").addEventListener("click", () => zoom(0.8));
$("zoom-out").addEventListener("click", () => zoom(1.25));
$("reset-view").addEventListener("click", () => {
  setAutoRotate(false);
  updateViewName("isometric");
  fitCurrentView("isometric");
});
$("capture-view").addEventListener("click", capture);
$("retry-button").addEventListener("click", () => {
  if (!renderer || !controls || renderer.getContext().isContextLost()) location.reload();
  else loadModel();
});
download.href = MODEL_URL;
download.download = MODEL_FILENAME;
download.addEventListener("click", (event) => { if (!state.loaded) event.preventDefault(); });
canvas.addEventListener("webglcontextlost", (event) => {
  event.preventDefault();
  loadAbort?.abort();
  state.loaded = false;
  state.error = "图形连接已中断";
  enableTools(false);
  setLoadState("error", "图形连接已中断", "请重新加载视图");
});
canvas.addEventListener("webglcontextrestored", () => location.reload());
reducedMotion.addEventListener("change", () => {
  if (!controls) return;
  controls.enableDamping = !reducedMotion.matches;
  if (reducedMotion.matches) setAutoRotate(false);
});
document.addEventListener("visibilitychange", () => { lastTime = performance.now(); needsRender = true; });

function dispose() {
  loadAbort?.abort();
  cancelAnimationFrame(frameId);
  clearTimeout(toastTimer);
  resizeObserver?.disconnect();
  controls?.dispose();
  if (model) disposeModel(model.root);
  sunlight?.shadow.dispose();
  environmentTarget?.dispose();
  renderer?.dispose();
}
window.addEventListener("pagehide", (event) => { if (!event.persisted) dispose(); });
if (import.meta.hot) import.meta.hot.dispose(dispose);

try {
  initialize();
} catch (error) {
  state.error = "无法启动三维视图";
  console.error("[Library initialization]", error);
  setLoadState("error", "无法启动三维视图", "当前浏览器的图形功能暂不可用");
  enableTools(false);
}
