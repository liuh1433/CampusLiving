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
  // --- 2号教学楼 ---
  "teaching-2-1f": f("teaching-2-1f", "teaching-2", "1F", 1, 6, ["teaching-2-1f-201", "teaching-2-1f-202", "teaching-2-1f-203"]),
  "teaching-2-2f": f("teaching-2-2f", "teaching-2", "2F", 2, 7, ["teaching-2-2f-204", "teaching-2-2f-205", "teaching-2-2f-206"]),
  "teaching-2-3f": f("teaching-2-3f", "teaching-2", "3F", 3, 5, ["teaching-2-3f-207", "teaching-2-3f-208", "teaching-2-3f-209"]),
  "teaching-2-4f": f("teaching-2-4f", "teaching-2", "4F", 4, 4, ["teaching-2-4f-210", "teaching-2-4f-211"]),
  // --- 3号教学楼 ---
  "teaching-3-1f": f("teaching-3-1f", "teaching-3", "1F", 1, 5, ["teaching-3-1f-301", "teaching-3-1f-302", "teaching-3-1f-303"]),
  "teaching-3-2f": f("teaching-3-2f", "teaching-3", "2F", 2, 4, ["teaching-3-2f-304", "teaching-3-2f-305", "teaching-3-2f-306"]),
  "teaching-3-3f": f("teaching-3-3f", "teaching-3", "3F", 3, 3, ["teaching-3-3f-307", "teaching-3-3f-308"]),
  "teaching-3-4f": f("teaching-3-4f", "teaching-3", "4F", 4, 4, ["teaching-3-4f-309", "teaching-3-4f-310", "teaching-3-4f-311"]),
  // --- 4号教学楼 ---
  "teaching-4-1f": f("teaching-4-1f", "teaching-4", "1F", 1, 8, ["teaching-4-1f-401", "teaching-4-1f-402", "teaching-4-1f-403"]),
  "teaching-4-2f": f("teaching-4-2f", "teaching-4", "2F", 2, 7, ["teaching-4-2f-404", "teaching-4-2f-405", "teaching-4-2f-406"]),
  "teaching-4-3f": f("teaching-4-3f", "teaching-4", "3F", 3, 6, ["teaching-4-3f-407", "teaching-4-3f-408", "teaching-4-3f-409"]),
  "teaching-4-4f": f("teaching-4-4f", "teaching-4", "4F", 4, 5, ["teaching-4-4f-410", "teaching-4-4f-411"]),
  "teaching-4-5f": f("teaching-4-5f", "teaching-4", "5F", 5, 5, ["teaching-4-5f-412", "teaching-4-5f-413"]),
  // --- 5号教学楼 ---
  "teaching-5-1f": f("teaching-5-1f", "teaching-5", "1F", 1, 3, ["teaching-5-1f-501", "teaching-5-1f-502", "teaching-5-1f-503"]),
  "teaching-5-2f": f("teaching-5-2f", "teaching-5", "2F", 2, 4, ["teaching-5-2f-504", "teaching-5-2f-505"]),
  "teaching-5-3f": f("teaching-5-3f", "teaching-5", "3F", 3, 3, ["teaching-5-3f-506", "teaching-5-3f-507"]),
  "teaching-5-4f": f("teaching-5-4f", "teaching-5", "4F", 4, 2, ["teaching-5-4f-508", "teaching-5-4f-509"]),
  // --- 6号教学楼 ---
  "teaching-6-1f": f("teaching-6-1f", "teaching-6", "1F", 1, 4, ["teaching-6-1f-601", "teaching-6-1f-602", "teaching-6-1f-603"]),
  "teaching-6-2f": f("teaching-6-2f", "teaching-6", "2F", 2, 3, ["teaching-6-2f-604", "teaching-6-2f-605"]),
  "teaching-6-3f": f("teaching-6-3f", "teaching-6", "3F", 3, 4, ["teaching-6-3f-606", "teaching-6-3f-607", "teaching-6-3f-608"]),
  "teaching-6-4f": f("teaching-6-4f", "teaching-6", "4F", 4, 3, ["teaching-6-4f-609", "teaching-6-4f-610"]),
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
  // --- 2号教学楼 ---
  "teaching-2-1f-201": room("teaching-2-1f-201", "teaching-2-1f", "201 普通教室", "classroom", 56, 8),
  "teaching-2-1f-202": room("teaching-2-1f-202", "teaching-2-1f", "202 讨论室", "discussion", 24, 5),
  "teaching-2-1f-203": room("teaching-2-1f-203", "teaching-2-1f", "203 自习室", "study", 48, 9),
  "teaching-2-2f-204": room("teaching-2-2f-204", "teaching-2-2f", "204 多媒体教室", "media", 72, 12),
  "teaching-2-2f-205": room("teaching-2-2f-205", "teaching-2-2f", "205 普通教室", "classroom", 56, 7),
  "teaching-2-2f-206": room("teaching-2-2f-206", "teaching-2-2f", "206 自习室", "study", 48, 10),
  "teaching-2-3f-207": room("teaching-2-3f-207", "teaching-2-3f", "207 大教室", "lecture", 96, 15),
  "teaching-2-3f-208": room("teaching-2-3f-208", "teaching-2-3f", "208 讨论室", "discussion", 24, 4),
  "teaching-2-3f-209": room("teaching-2-3f-209", "teaching-2-3f", "209 计算机房", "media", 48, 8),
  "teaching-2-4f-210": room("teaching-2-4f-210", "teaching-2-4f", "210 自习室", "study", 48, 11),
  "teaching-2-4f-211": room("teaching-2-4f-211", "teaching-2-4f", "211 普通教室", "classroom", 56, 6),
  // --- 3号教学楼 ---
  "teaching-3-1f-301": room("teaching-3-1f-301", "teaching-3-1f", "301 普通教室", "classroom", 56, 7),
  "teaching-3-1f-302": room("teaching-3-1f-302", "teaching-3-1f", "302 自习室", "study", 48, 8),
  "teaching-3-1f-303": room("teaching-3-1f-303", "teaching-3-1f", "303 大教室", "lecture", 96, 14),
  "teaching-3-2f-304": room("teaching-3-2f-304", "teaching-3-2f", "304 讨论室", "discussion", 24, 5),
  "teaching-3-2f-305": room("teaching-3-2f-305", "teaching-3-2f", "305 普通教室", "classroom", 56, 6),
  "teaching-3-2f-306": room("teaching-3-2f-306", "teaching-3-2f", "306 多媒体教室", "media", 72, 9),
  "teaching-3-3f-307": room("teaching-3-3f-307", "teaching-3-3f", "307 自习室", "study", 48, 10),
  "teaching-3-3f-308": room("teaching-3-3f-308", "teaching-3-3f", "308 普通教室", "classroom", 56, 8),
  "teaching-3-4f-309": room("teaching-3-4f-309", "teaching-3-4f", "309 大教室", "lecture", 96, 13),
  "teaching-3-4f-310": room("teaching-3-4f-310", "teaching-3-4f", "310 讨论室", "discussion", 24, 3),
  "teaching-3-4f-311": room("teaching-3-4f-311", "teaching-3-4f", "311 自习室", "study", 48, 9),
  // --- 4号教学楼 ---
  "teaching-4-1f-401": room("teaching-4-1f-401", "teaching-4-1f", "401 大厅", "lounge", 40, 12),
  "teaching-4-1f-402": room("teaching-4-1f-402", "teaching-4-1f", "402 大教室", "lecture", 96, 18),
  "teaching-4-1f-403": room("teaching-4-1f-403", "teaching-4-1f", "403 普通教室", "classroom", 56, 9),
  "teaching-4-2f-404": room("teaching-4-2f-404", "teaching-4-2f", "404 多媒体教室", "media", 72, 14),
  "teaching-4-2f-405": room("teaching-4-2f-405", "teaching-4-2f", "405 普通教室", "classroom", 56, 7),
  "teaching-4-2f-406": room("teaching-4-2f-406", "teaching-4-2f", "406 自习室", "study", 48, 11),
  "teaching-4-3f-407": room("teaching-4-3f-407", "teaching-4-3f", "407 大教室", "lecture", 96, 16),
  "teaching-4-3f-408": room("teaching-4-3f-408", "teaching-4-3f", "408 讨论室", "discussion", 24, 5),
  "teaching-4-3f-409": room("teaching-4-3f-409", "teaching-4-3f", "409 计算机房", "media", 48, 10),
  "teaching-4-4f-410": room("teaching-4-4f-410", "teaching-4-4f", "410 自习室", "study", 48, 12),
  "teaching-4-4f-411": room("teaching-4-4f-411", "teaching-4-4f", "411 普通教室", "classroom", 56, 8),
  "teaching-4-5f-412": room("teaching-4-5f-412", "teaching-4-5f", "412 研究室", "study", 24, 6),
  "teaching-4-5f-413": room("teaching-4-5f-413", "teaching-4-5f", "413 讨论室", "discussion", 24, 4),
  // --- 5号教学楼 ---
  "teaching-5-1f-501": room("teaching-5-1f-501", "teaching-5-1f", "501 普通教室", "classroom", 56, 6),
  "teaching-5-1f-502": room("teaching-5-1f-502", "teaching-5-1f", "502 多媒体教室", "media", 72, 8),
  "teaching-5-1f-503": room("teaching-5-1f-503", "teaching-5-1f", "503 自习室", "study", 48, 7),
  "teaching-5-2f-504": room("teaching-5-2f-504", "teaching-5-2f", "504 大教室", "lecture", 96, 12),
  "teaching-5-2f-505": room("teaching-5-2f-505", "teaching-5-2f", "505 普通教室", "classroom", 56, 8),
  "teaching-5-3f-506": room("teaching-5-3f-506", "teaching-5-3f", "506 讨论室", "discussion", 24, 4),
  "teaching-5-3f-507": room("teaching-5-3f-507", "teaching-5-3f", "507 自习室", "study", 48, 9),
  "teaching-5-4f-508": room("teaching-5-4f-508", "teaching-5-4f", "508 普通教室", "classroom", 56, 5),
  "teaching-5-4f-509": room("teaching-5-4f-509", "teaching-5-4f", "509 计算机房", "media", 48, 7),
  // --- 6号教学楼 ---
  "teaching-6-1f-601": room("teaching-6-1f-601", "teaching-6-1f", "601 普通教室", "classroom", 56, 7),
  "teaching-6-1f-602": room("teaching-6-1f-602", "teaching-6-1f", "602 自习室", "study", 48, 8),
  "teaching-6-1f-603": room("teaching-6-1f-603", "teaching-6-1f", "603 大教室", "lecture", 96, 11),
  "teaching-6-2f-604": room("teaching-6-2f-604", "teaching-6-2f", "604 讨论室", "discussion", 24, 3),
  "teaching-6-2f-605": room("teaching-6-2f-605", "teaching-6-2f", "605 多媒体教室", "media", 72, 9),
  "teaching-6-3f-606": room("teaching-6-3f-606", "teaching-6-3f", "606 普通教室", "classroom", 56, 6),
  "teaching-6-3f-607": room("teaching-6-3f-607", "teaching-6-3f", "607 自习室", "study", 48, 10),
  "teaching-6-3f-608": room("teaching-6-3f-608", "teaching-6-3f", "608 大教室", "lecture", 96, 13),
  "teaching-6-4f-609": room("teaching-6-4f-609", "teaching-6-4f", "609 研究室", "study", 24, 5),
  "teaching-6-4f-610": room("teaching-6-4f-610", "teaching-6-4f", "610 普通教室", "classroom", 56, 7),
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

function f(id, buildingId, label, level, onlineUsers, rooms) {
  return { id, buildingId, label, level, onlineUsers, rooms };
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
