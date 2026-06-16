export const buildingGroup = {
  id: "teaching-complex",
  name: "综合教学楼",
  modelUrl: "/assets/glb/teaching_complex_1_6.glb",
  previewUrl: "/assets/previews/teaching_complex_1_6_map_angle.png",
  buildings: ["teaching-1", "teaching-2", "teaching-3", "teaching-4", "teaching-5", "teaching-6"],
};

export const buildings = [
  {
    id: "teaching-1",
    name: "1号教学楼",
    shortName: "1号",
    modelNodePrefix: "teaching_1",
    floorModelUrl: "/assets/glb/floors/teaching_1_floors.glb",
    floors: ["teaching-1-1f", "teaching-1-2f", "teaching-1-3f", "teaching-1-4f"],
    onlineUsers: 18,
    roomCount: 24,
    desc: "靠近马可广场的独立教学楼，是第一阶段的完整交互样板。",
  },
  {
    id: "teaching-2",
    name: "2号教学楼",
    shortName: "2号",
    modelNodePrefix: "teaching_2",
    floors: ["teaching-2-1f", "teaching-2-2f", "teaching-2-3f", "teaching-2-4f"],
    onlineUsers: 22,
    roomCount: 28,
    desc: "综合楼下部横向楼体，靠近底部道路。",
  },
  {
    id: "teaching-3",
    name: "3号教学楼",
    shortName: "3号",
    modelNodePrefix: "teaching_3",
    floors: ["teaching-3-1f", "teaching-3-2f", "teaching-3-3f", "teaching-3-4f"],
    onlineUsers: 16,
    roomCount: 26,
    desc: "综合楼中部横向楼体，连接主楼公共区域。",
  },
  {
    id: "teaching-4",
    name: "综合教学楼 / 4号教学楼",
    shortName: "4号",
    modelNodePrefix: "teaching_4",
    floors: ["teaching-4-1f", "teaching-4-2f", "teaching-4-3f", "teaching-4-4f", "teaching-4-5f"],
    onlineUsers: 31,
    roomCount: 36,
    desc: "右侧纵向主楼，连接 2、3、5、6 号教学楼。",
  },
  {
    id: "teaching-5",
    name: "5号教学楼",
    shortName: "5号",
    modelNodePrefix: "teaching_5",
    floors: ["teaching-5-1f", "teaching-5-2f", "teaching-5-3f", "teaching-5-4f"],
    onlineUsers: 12,
    roomCount: 22,
    desc: "综合楼中上部横向楼体，以普通教室和多媒体教室为主。",
  },
  {
    id: "teaching-6",
    name: "6号教学楼",
    shortName: "6号",
    modelNodePrefix: "teaching_6",
    floors: ["teaching-6-1f", "teaching-6-2f", "teaching-6-3f", "teaching-6-4f"],
    onlineUsers: 14,
    roomCount: 24,
    desc: "综合楼顶部横向楼体，靠近孔子像和马可广场区域。",
  },
];

export const floors = {
  "teaching-1-1f": {
    id: "teaching-1-1f",
    buildingId: "teaching-1",
    label: "1F",
    level: 1,
    onlineUsers: 4,
    rooms: ["teaching-1-1f-101", "teaching-1-1f-102", "teaching-1-1f-lobby"],
  },
  "teaching-1-2f": {
    id: "teaching-1-2f",
    buildingId: "teaching-1",
    label: "2F",
    level: 2,
    onlineUsers: 5,
    rooms: ["teaching-1-2f-201", "teaching-1-2f-202", "teaching-1-2f-203"],
  },
  "teaching-1-3f": {
    id: "teaching-1-3f",
    buildingId: "teaching-1",
    label: "3F",
    level: 3,
    onlineUsers: 6,
    rooms: ["teaching-1-3f-301", "teaching-1-3f-302", "teaching-1-3f-303"],
  },
  "teaching-1-4f": {
    id: "teaching-1-4f",
    buildingId: "teaching-1",
    label: "4F",
    level: 4,
    onlineUsers: 3,
    rooms: ["teaching-1-4f-401", "teaching-1-4f-402", "teaching-1-4f-study"],
  },
};

export const rooms = {
  "teaching-1-1f-101": room("teaching-1-1f-101", "teaching-1-1f", "101 大教室", "lecture", 96, 10),
  "teaching-1-1f-102": room("teaching-1-1f-102", "teaching-1-1f", "102 公共教室", "classroom", 64, 8),
  "teaching-1-1f-lobby": room("teaching-1-1f-lobby", "teaching-1-1f", "一楼大厅", "lounge", 30, 4),
  "teaching-1-2f-201": room("teaching-1-2f-201", "teaching-1-2f", "201 普通教室", "classroom", 56, 7),
  "teaching-1-2f-202": room("teaching-1-2f-202", "teaching-1-2f", "202 自习室", "study", 48, 12),
  "teaching-1-2f-203": room("teaching-1-2f-203", "teaching-1-2f", "203 讨论室", "discussion", 24, 5),
  "teaching-1-3f-301": room("teaching-1-3f-301", "teaching-1-3f", "301 自习室", "study", 48, 12),
  "teaching-1-3f-302": room("teaching-1-3f-302", "teaching-1-3f", "302 普通教室", "classroom", 56, 9),
  "teaching-1-3f-303": room("teaching-1-3f-303", "teaching-1-3f", "303 小组讨论室", "discussion", 24, 6),
  "teaching-1-4f-401": room("teaching-1-4f-401", "teaching-1-4f", "401 多媒体教室", "media", 72, 11),
  "teaching-1-4f-402": room("teaching-1-4f-402", "teaching-1-4f", "402 普通教室", "classroom", 56, 5),
  "teaching-1-4f-study": room("teaching-1-4f-study", "teaching-1-4f", "四楼安静自习区", "study", 36, 8),
};

function room(id, floorId, name, type, capacity, onlineUsers) {
  return {
    id,
    floorId,
    name,
    type,
    capacity,
    onlineUsers,
    availableSeats: Math.max(capacity - onlineUsers, 0),
  };
}

export function getBuildingById(id) {
  return buildings.find((building) => building.id === id) ?? null;
}

export function getFloorsForBuilding(buildingId) {
  const building = getBuildingById(buildingId);
  if (!building) return [];
  return building.floors.map((floorId) => floors[floorId]).filter(Boolean);
}

export function getRoomsForFloor(floorId) {
  const floor = floors[floorId];
  if (!floor) return [];
  return floor.rooms.map((roomId) => rooms[roomId]).filter(Boolean);
}
