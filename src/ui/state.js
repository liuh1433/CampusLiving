const identityColors = [
  ["蓝色", "#1976d2", "书签", "签"],
  ["橙色", "#ef6c00", "星标", "星"],
  ["绿色", "#43a047", "课表", "表"],
  ["粉色", "#d81b60", "便签", "签"],
];

export function createInitialState() {
  return {
    mode: "map",
    selectedBuildingId: null,
    hoveredBuildingId: null,
    selectedFloorId: null,
    hoveredFloorId: null,
    selectedRoomId: null,
    user: createIdentity(),
  };
}

export function createIdentity(index = 0) {
  const [colorName, color, animal, avatarText] = identityColors[index % identityColors.length];
  return {
    name: `${colorName}${animal}`,
    color,
    avatarText,
  };
}

export function selectBuilding(state, buildingId) {
  return {
    ...state,
    mode: "buildingFloors",
    selectedBuildingId: buildingId,
    hoveredBuildingId: null,
    selectedFloorId: null,
    hoveredFloorId: null,
    selectedRoomId: null,
  };
}

export function hoverBuilding(state, buildingId) {
  return {
    ...state,
    hoveredBuildingId: buildingId,
  };
}

export function selectFloor(state, floorId) {
  return {
    ...state,
    mode: "floorRooms",
    selectedFloorId: floorId,
    hoveredFloorId: null,
    selectedRoomId: null,
  };
}

export function hoverFloor(state, floorId) {
  return {
    ...state,
    hoveredFloorId: floorId,
  };
}

export function selectRoom(state, roomId) {
  return {
    ...state,
    mode: "room",
    selectedRoomId: roomId,
  };
}

export function goBackToMap(state) {
  return {
    ...state,
    mode: "map",
    selectedBuildingId: null,
    hoveredBuildingId: null,
    selectedFloorId: null,
    hoveredFloorId: null,
    selectedRoomId: null,
  };
}

export function goBackToFloors(state) {
  return {
    ...state,
    mode: "buildingFloors",
    selectedFloorId: null,
    hoveredFloorId: null,
    selectedRoomId: null,
  };
}
