import "./styles.css";
import "./campus.css";
import { mountIcons } from "./library/vendor/icons.js";
import { createInitialState, goBackToFloors, goBackToMap, selectBuilding, selectFloor, selectRoom } from "./ui/state.js";
import { createAppScene } from "./three/scene.js";
import { createPanels } from "./ui/panels.js";

const canvas = document.querySelector("#scene-canvas");
const sidePanel = document.querySelector("#side-panel");
const statusText = document.querySelector("#status-text");
const backMapButton = document.querySelector("#back-map-button");
const identityPill = document.querySelector("#identity-pill");

let appState = createInitialState();
let ready = false;
mountIcons();

function openBuilding(buildingId) {
  if (!ready) return;
  viewSelect.value = "core";
  updateState(selectBuilding(appState, buildingId));
  scene.showBuildingFloors(buildingId);
}

const panels = createPanels({
  sidePanel,
  identityPill,
  onSelectBuilding: openBuilding,
  onSelectFloor: (floorId) => {
    updateState(selectFloor(appState, floorId));
    scene.selectFloor(floorId);
  },
  onSelectRoom: (roomId) => {
    updateState(selectRoom(appState, roomId));
    scene.showClassroomInterior(roomId);
  },
  onBackFromRoom: () => {
    updateState(goBackToFloors(appState));
    scene.showBuildingFloors(appState.selectedBuildingId);
  },
});

const scene = createAppScene({
  canvas,
  onStatus: (message) => {
    statusText.textContent = message;
  },
  onBuildingClick: openBuilding,
  onFloorClick: (floorId) => {
    updateState(selectFloor(appState, floorId));
    scene.selectFloor(floorId);
  },
  onReady: () => {
    ready = true;
    document.querySelector("#app").dataset.loading = "false";
    document.querySelectorAll(".campus-map-tools button, .campus-map-tools input, .campus-map-tools select").forEach((element) => { element.disabled = false; });
  },
});

const viewSelect = document.querySelector("#campus-view");
viewSelect.addEventListener("change", () => {
  updateState(goBackToMap(appState));
  scene.setMapView(viewSelect.value);
});
document.querySelector("#campus-reset").addEventListener("click", () => {
  viewSelect.value = "core";
  updateState(goBackToMap(appState));
  scene.setMapView("core");
});
document.querySelector("#campus-zoom-in").addEventListener("click", () => scene.zoom(1.25));
document.querySelector("#campus-zoom-out").addEventListener("click", () => scene.zoom(0.8));
document.querySelector("#map-layer").addEventListener("change", (event) => scene.setMapVisible(event.target.checked));
document.querySelector("#campus-capture").addEventListener("click", () => scene.capture());
document.querySelector("#campus-retry").addEventListener("click", () => location.reload());

backMapButton.addEventListener("click", () => {
  if (appState.mode === "room") {
    updateState(goBackToFloors(appState));
    scene.showBuildingFloors(appState.selectedBuildingId);
    return;
  }
  updateState(goBackToMap(appState));
  scene.showMap();
});

function updateState(nextState) {
  appState = nextState;
  document.querySelector("#app").dataset.mode = appState.mode;
  panels.render(appState);
  backMapButton.disabled = appState.mode === "map";
  backMapButton.querySelector("span:last-child").textContent = appState.mode === "room" ? "返回楼层" : "返回校园";
}

updateState(appState);
scene.init();
