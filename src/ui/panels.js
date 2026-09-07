import { buildings, floors, getBuildingById, getFloorsForBuilding, getRoomsForFloor, rooms } from "../data/teachingComplex.js";
import { createClassroomApp } from "../classroom/classroomApp.js";

export function createPanels({ sidePanel, identityPill, onSelectBuilding, onSelectFloor, onSelectRoom, onBackFromRoom }) {
  let classroomApp = null;

  function disposeClassroom() {
    if (classroomApp) {
      classroomApp.dispose();
      classroomApp = null;
    }
  }

  function renderRoomPanel(target, state) {
    // 先销毁旧实例
    disposeClassroom();

    // 教室模式：展开侧面板
    target.classList.add("side-panel--room");

    // 同步创建教室
    try {
      classroomApp = createClassroomApp({
        container: target,
        roomId: state.selectedRoomId,
        user: state.user,
        onBack: () => {
          target.classList.remove("side-panel--room");
          disposeClassroom();
          onBackFromRoom?.();
        },
      });
    } catch (err) {
      console.error("[Classroom] 创建失败:", err);
      target.innerHTML = `<p class="classroom-error">教室加载失败: ${err.message}</p>`;
    }
  }

  return {
    render(state) {
      renderIdentity(identityPill, state.user);

      if (state.mode === "map") {
        disposeClassroom();
        sidePanel.classList.remove("side-panel--room");
        renderMapPanel(sidePanel, state, onSelectBuilding);
        return;
      }

      if (state.mode === "buildingExterior") {
        disposeClassroom();
        sidePanel.classList.remove("side-panel--room");
        sidePanel.innerHTML = `
          <p class="panel-kicker">校园空间 / 图书馆</p>
          <h2 class="panel-title">金明校区图书馆</h2>
          <img class="library-panel-preview" src="/assets/previews/library_jinming_front_oblique.webp" alt="图书馆正面凹入幕墙" />
          <dl class="building-facts"><div><dt>位置</dt><dd>马可广场西侧</dd></div><div><dt>入口朝向</dt><dd>西大门</dd></div><div><dt>模型范围</dt><dd>建筑外观</dd></div><div><dt>室内空间</dt><dd>尚未建模</dd></div></dl>
          <a class="building-detail-link" href="/library.html">打开图书馆独立视图</a>
        `;
        return;
      }

      if (state.mode === "buildingFloors") {
        disposeClassroom();
        sidePanel.classList.remove("side-panel--room");
        renderBuildingFloorsPanel(sidePanel, state, onSelectFloor);
        return;
      }

      if (state.mode === "floorRooms") {
        disposeClassroom();
        sidePanel.classList.remove("side-panel--room");
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
    <p class="panel-kicker">校园空间</p>
    <h2 class="panel-title">图书馆与教学区</h2>
    <div class="stats">
      <div class="stat"><strong>7</strong><span>已建模建筑</span></div>
      <div class="stat"><strong>${buildings.reduce((sum, building) => sum + building.onlineUsers, 0)}</strong><span>模拟在线</span></div>
    </div>
    <div class="list">
      <button class="list-button library-list-button" type="button" data-building-id="library-jinming"><span>图书馆</span><span class="tag">外观模型</span></button>
      ${buildings.map((building) => buildingButton(building, state.selectedBuildingId)).join("")}
    </div>
    <div class="map-key"><span><i class="key-model"></i>已建模</span><span><i class="key-plan"></i>平面底图</span></div>
    <a class="building-detail-link" href="/library.html">打开图书馆独立视图</a>
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
    <div class="list">
      ${buildingFloors.map((floor) => floorButton(floor, state.selectedFloorId)).join("")}
    </div>
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
    <p class="panel-copy">模拟房间与座位状态</p>
    <div class="list">
      ${floorRooms
        .map(
          (room) => {
            const availabilityClass = room.availableSeats > 0 ? "room-available" : "room-full";
            const availabilityText = room.availableSeats > 0
              ? `<span class="room-seats-tag available">空闲 ${room.availableSeats} 座</span>`
              : `<span class="room-seats-tag full">已满</span>`;
            return `
          <button class="room-card ${availabilityClass}" type="button" data-room-id="${room.id}">
            <div class="room-card-header">
              <h3>${room.name}</h3>
              ${availabilityText}
            </div>
            <p>${roomType(room.type)} · ${room.onlineUsers}/${room.capacity} 人</p>
          </button>
        `;
          },
        )
        .join("")}
    </div>
  `;

  // 绑定房间卡片点击
  target.querySelectorAll("[data-room-id]").forEach((btn) => {
    btn.addEventListener("click", () => onSelectRoom(btn.dataset.roomId));
  });
}

function buildingButton(building, selectedBuildingId) {
  const active = building.id === selectedBuildingId ? " active" : "";
  return `
    <button class="list-button${active}" type="button" data-building-id="${building.id}">
      <span>${building.shortName}教学楼</span>
      <span class="tag">${building.onlineUsers} 人</span>
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
