import "./styles.css";
import { createInitialState, goBackToFloors, goBackToMap, selectBuilding, selectFloor, selectRoom } from "./ui/state.js";
import { createAppScene } from "./three/scene.js";
import { createPanels } from "./ui/panels.js";

const canvas = document.querySelector("#scene-canvas");
const sidePanel = document.querySelector("#side-panel");
const statusText = document.querySelector("#status-text");
const backMapButton = document.querySelector("#back-map-button");
const identityPill = document.querySelector("#identity-pill");

let appState = createInitialState();

const panels = createPanels({
  sidePanel,
  identityPill,
  onSelectBuilding: (buildingId) => {
    updateState(selectBuilding(appState, buildingId));
    scene.showBuildingFloors(buildingId);
  },
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
  onBuildingClick: (buildingId) => {
    updateState(selectBuilding(appState, buildingId));
    scene.showBuildingFloors(buildingId);
  },
  onFloorClick: (floorId) => {
    updateState(selectFloor(appState, floorId));
    scene.selectFloor(floorId);
  },
});

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
  panels.render(appState);
  backMapButton.disabled = appState.mode === "map";
}

updateState(appState);
scene.init();
