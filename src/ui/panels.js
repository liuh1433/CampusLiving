import { buildings, floors, getBuildingById, getFloorsForBuilding, getRoomsForFloor, rooms } from "../data/teachingComplex.js";

export function createPanels({ sidePanel, identityPill, onSelectBuilding, onSelectFloor, onSelectRoom }) {
  return {
    render(state) {
      renderIdentity(identityPill, state.user);

      if (state.mode === "map") {
        renderMapPanel(sidePanel, state, onSelectBuilding);
        return;
      }

      if (state.mode === "buildingFloors") {
        renderBuildingFloorsPanel(sidePanel, state, onSelectFloor);
        return;
      }

      if (state.mode === "floorRooms") {
        renderFloorRoomsPanel(sidePanel, state, onSelectRoom);
        return;
      }

      renderRoomPanel(sidePanel, state);
    },
  };
}

function renderIdentity(target, user) {
  target.innerHTML = `
    <span class="avatar" style="background:${user.color}">${user.avatarText}</span>
    <span>${user.name}</span>
  `;
}

function renderMapPanel(target, state, onSelectBuilding) {
  target.innerHTML = `
    <p class="panel-kicker">建筑群地图</p>
    <h2 class="panel-title">综合教学楼 1-6号</h2>
    <p class="panel-copy">点击具体楼栋进入楼层选择。第一版完整链路优先支持 1号教学楼。</p>
    <div class="stats">
      <div class="stat"><strong>6</strong><span>楼栋</span></div>
      <div class="stat"><strong>${buildings.reduce((sum, building) => sum + building.onlineUsers, 0)}</strong><span>在线</span></div>
      <div class="stat"><strong>${buildings.reduce((sum, building) => sum + building.roomCount, 0)}</strong><span>房间</span></div>
    </div>
    <div class="list">
      ${buildings.map((building) => buildingButton(building, state.selectedBuildingId)).join("")}
    </div>
  `;
  bindButtons(target, "[data-building-id]", (button) => onSelectBuilding(button.dataset.buildingId));
}

function renderBuildingFloorsPanel(target, state, onSelectFloor) {
  const building = getBuildingById(state.selectedBuildingId);
  const buildingFloors = getFloorsForBuilding(state.selectedBuildingId);
  target.innerHTML = `
    <p class="panel-kicker">楼层选择</p>
    <h2 class="panel-title">${building?.name ?? "未知楼栋"}</h2>
    <p class="panel-copy">${building?.desc ?? ""}</p>
    <div class="stats">
      <div class="stat"><strong>${buildingFloors.length}</strong><span>楼层</span></div>
      <div class="stat"><strong>${building?.onlineUsers ?? 0}</strong><span>在线</span></div>
      <div class="stat"><strong>${building?.roomCount ?? 0}</strong><span>房间</span></div>
    </div>
    ${
      state.selectedBuildingId === "teaching-1"
        ? `<div class="list">${buildingFloors.map((floor) => floorButton(floor, state.selectedFloorId)).join("")}</div>`
        : `<p class="panel-copy">这栋楼的楼层模型将在 1号教学楼链路验证后复用生成。</p>`
    }
  `;
  bindButtons(target, "[data-floor-id]", (button) => onSelectFloor(button.dataset.floorId));
}

function renderFloorRoomsPanel(target, state, onSelectRoom) {
  const floor = floors[state.selectedFloorId];
  const building = getBuildingById(state.selectedBuildingId);
  const floorRooms = getRoomsForFloor(state.selectedFloorId);
  target.innerHTML = `
    <p class="panel-kicker">${building?.name ?? ""}</p>
    <h2 class="panel-title">${floor?.label ?? "楼层"} 房间</h2>
    <p class="panel-copy">选择房间后进入座位与聊天原型。当前为本地模拟数据。</p>
    <div class="list">
      ${floorRooms
        .map(
          (room) => `
          <button class="room-card" type="button" data-room-id="${room.id}">
            <h3>${room.name}</h3>
            <p>${roomType(room.type)} · ${room.onlineUsers}/${room.capacity} 人 · 空座 ${room.availableSeats}</p>
          </button>
        `,
        )
        .join("")}
    </div>
  `;
  bindButtons(target, "[data-room-id]", (button) => onSelectRoom(button.dataset.roomId));
}

function renderRoomPanel(target, state) {
  const room = rooms[state.selectedRoomId];
  target.innerHTML = `
    <p class="panel-kicker">房间占位</p>
    <h2 class="panel-title">${room?.name ?? "房间"}</h2>
    <p class="panel-copy">座位图和聊天面板会在下一阶段接入。当前先完成空间路径闭环。</p>
    <div class="stats">
      <div class="stat"><strong>${room?.onlineUsers ?? 0}</strong><span>在线</span></div>
      <div class="stat"><strong>${room?.availableSeats ?? 0}</strong><span>空座</span></div>
      <div class="stat"><strong>${room?.capacity ?? 0}</strong><span>容量</span></div>
    </div>
  `;
}

function buildingButton(building, selectedBuildingId) {
  const active = building.id === selectedBuildingId ? " active" : "";
  return `
    <button class="list-button${active}" type="button" data-building-id="${building.id}">
      <span>${building.name}</span>
      <span class="tag">${building.onlineUsers} 在线</span>
    </button>
  `;
}

function floorButton(floor, selectedFloorId) {
  const active = floor.id === selectedFloorId ? " active" : "";
  return `
    <button class="list-button${active}" type="button" data-floor-id="${floor.id}">
      <span>${floor.label}</span>
      <span class="tag">${floor.onlineUsers} 在线</span>
    </button>
  `;
}

function roomType(type) {
  return {
    lecture: "大教室",
    classroom: "普通教室",
    study: "自习室",
    discussion: "讨论室",
    lounge: "公共区",
    media: "多媒体",
  }[type] ?? "房间";
}

function bindButtons(root, selector, handler) {
  root.querySelectorAll(selector).forEach((button) => {
    button.addEventListener("click", () => handler(button));
  });
}
