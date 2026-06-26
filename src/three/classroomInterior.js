import * as THREE from "three";
import { rooms } from "../data/teachingComplex.js";

/**
 * 创建自习室内部 3D 视图
 * Low-Poly 卡通风格，展示座位占用/空闲状态
 */

// 房间常量
const ROOM_WIDTH = 10;
const ROOM_DEPTH = 8;
const ROOM_HEIGHT = 4;
const WALL_THICKNESS = 0.2;

// 座位布局
const DESK_ROWS = 4;
const DESK_COLS = 5;
const DESK_WIDTH = 1.0;
const DESK_DEPTH = 0.5;
const DESK_HEIGHT = 0.06;
const DESK_GAP_X = 0.4;
const DESK_GAP_Z = 0.8;
const DESK_OFFSET_X = -((DESK_COLS - 1) * (DESK_WIDTH + DESK_GAP_X)) / 2;
const DESK_OFFSET_Z = -ROOM_DEPTH / 2 + 2.0;

// 材质预设
const materials = {
  floor: new THREE.MeshStandardMaterial({ color: 0xe8d5b7, roughness: 0.9 }),
  wall: new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.95 }),
  ceiling: new THREE.MeshStandardMaterial({ color: 0xfafaf5, roughness: 0.95 }),
  board: new THREE.MeshStandardMaterial({ color: 0x2c5f3f, roughness: 0.7 }),
  boardFrame: new THREE.MeshStandardMaterial({ color: 0xb0a890, roughness: 0.6 }),
  window: new THREE.MeshStandardMaterial({ color: 0xb8d8f0, roughness: 0.3, emissive: 0x446688, emissiveIntensity: 0.3 }),
  windowFrame: new THREE.MeshStandardMaterial({ color: 0xd0c8b8, roughness: 0.6 }),
  deskAvailable: new THREE.MeshStandardMaterial({ color: 0x8fbc8f, roughness: 0.7 }),
  deskOccupied: new THREE.MeshStandardMaterial({ color: 0xe8a0a0, roughness: 0.7 }),
  chairAvailable: new THREE.MeshStandardMaterial({ color: 0xa8d8a8, roughness: 0.7 }),
  chairOccupied: new THREE.MeshStandardMaterial({ color: 0xf0b0b0, roughness: 0.7 }),
  door: new THREE.MeshStandardMaterial({ color: 0xb09070, roughness: 0.6 }),
  leg: new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5, metalness: 0.3 }),
  light: new THREE.MeshStandardMaterial({ color: 0xfffbe6, roughness: 0.3, emissive: 0xffffcc, emissiveIntensity: 0.6 }),
};

// 人物颜色池（衣服颜色）
const personColors = [
  0x1976d2, 0xef6c00, 0x43a047, 0xd81b60, 0x8e24aa,
  0x00acc1, 0xf4511e, 0x3949ab, 0xe91e63, 0x00897b,
  0x5c6bc0, 0xff7043, 0x66bb6a, 0xab47bc, 0x26a69a,
];

// 头发颜色池
const hairColorPool = [0x333333, 0x4a3728, 0x6b4226, 0x8b5e3c, 0x2c2c2c, 0x1a1a2e, 0x5c3d2e, 0x3d2b1f];

export function createClassroomInterior(scene) {
  const root = new THREE.Group();
  root.name = "classroom_interior_root";
  root.visible = false;

  // ---- 地板 ----
  const floorGeo = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH);
  const floor = new THREE.Mesh(floorGeo, materials.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 0);
  floor.receiveShadow = true;
  root.add(floor);

  // ---- 墙壁 ----
  // 后墙 (z = -ROOM_DEPTH/2)
  const backWall = createWall(ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS);
  backWall.position.set(0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2);
  root.add(backWall);

  // 左墙 (x = -ROOM_WIDTH/2)
  const leftWall = createWall(WALL_THICKNESS, ROOM_HEIGHT, ROOM_DEPTH);
  leftWall.position.set(-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0);
  root.add(leftWall);

  // 右墙 (x = ROOM_WIDTH/2)
  const rightWall = createWall(WALL_THICKNESS, ROOM_HEIGHT, ROOM_DEPTH);
  rightWall.position.set(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0);
  root.add(rightWall);

  // ---- 天花板 ----
  const ceilingGeo = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH);
  const ceiling = new THREE.Mesh(ceilingGeo, materials.ceiling);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, ROOM_HEIGHT, 0);
  root.add(ceiling);

  // ---- 黑板 (后墙) ----
  const boardGeo = new THREE.BoxGeometry(ROOM_WIDTH * 0.6, ROOM_HEIGHT * 0.4, 0.05);
  const board = new THREE.Mesh(boardGeo, materials.board);
  board.position.set(0, ROOM_HEIGHT * 0.6, -ROOM_DEPTH / 2 + WALL_THICKNESS / 2 + 0.03);
  root.add(board);

  // 黑板边框
  const frameGeo = new THREE.BoxGeometry(ROOM_WIDTH * 0.62, ROOM_HEIGHT * 0.42, 0.06);
  const frame = new THREE.Mesh(frameGeo, materials.boardFrame);
  frame.position.copy(board.position);
  frame.position.z -= 0.01;
  root.add(frame);

  // ---- 窗户 (左右墙) ----
  for (let i = 0; i < 2; i++) {
    const wx = i === 0 ? -ROOM_WIDTH / 2 - WALL_THICKNESS / 2 - 0.01 : ROOM_WIDTH / 2 + WALL_THICKNESS / 2 + 0.01;
    for (let j = 0; j < 2; j++) {
      const winGeo = new THREE.PlaneGeometry(1.2, 1.6);
      const win = new THREE.Mesh(winGeo, materials.window);
      win.position.set(wx, ROOM_HEIGHT * 0.62, -ROOM_DEPTH / 4 + j * ROOM_DEPTH * 0.45);
      if (i === 0) win.rotation.y = Math.PI / 2;
      else win.rotation.y = -Math.PI / 2;
      root.add(win);
    }
  }

  // ---- 灯具 (天花板) ----
  for (let r = 0; r < 2; r++) {
    const lightGeo = new THREE.BoxGeometry(ROOM_WIDTH * 0.7, 0.08, 0.3);
    const light = new THREE.Mesh(lightGeo, materials.light);
    light.position.set(0, ROOM_HEIGHT - 0.1, -ROOM_DEPTH / 4 + r * ROOM_DEPTH * 0.35);
    root.add(light);
  }

  // ---- 门 (右墙前方) ----
  const doorGeo = new THREE.BoxGeometry(0.05, 2.2, 0.9);
  const door = new THREE.Mesh(doorGeo, materials.door);
  door.position.set(ROOM_WIDTH / 2 + WALL_THICKNESS / 2 + 0.02, 1.1, ROOM_DEPTH / 2 - 1.0);
  root.add(door);

  // ---- 讲台 ----
  const podiumGeo = new THREE.BoxGeometry(1.4, 0.8, 0.6);
  const podium = new THREE.Mesh(podiumGeo, materials.boardFrame);
  podium.position.set(0, 0.4, -ROOM_DEPTH / 2 + 1.0);
  root.add(podium);

  // ---- 座位系统 ----
  const deskGroups = [];
  const seatMeshes = []; // 用于后续更新座位状态

  for (let row = 0; row < DESK_ROWS; row++) {
    for (let col = 0; col < DESK_COLS; col++) {
      const group = new THREE.Group();
      const x = DESK_OFFSET_X + col * (DESK_WIDTH + DESK_GAP_X);
      const z = DESK_OFFSET_Z + row * (DESK_DEPTH + DESK_GAP_Z);

      // 桌面
      const deskGeo = new THREE.BoxGeometry(DESK_WIDTH, DESK_HEIGHT, DESK_DEPTH);
      const desk = new THREE.Mesh(deskGeo, materials.deskAvailable);
      desk.position.set(0, 0.72, 0);
      desk.castShadow = true;
      group.add(desk);

      // 桌腿 x4
      const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.72, 6);
      const legOffsets = [
        [DESK_WIDTH / 2 - 0.1, 0, DESK_DEPTH / 2 - 0.1],
        [-DESK_WIDTH / 2 + 0.1, 0, DESK_DEPTH / 2 - 0.1],
        [DESK_WIDTH / 2 - 0.1, 0, -DESK_DEPTH / 2 + 0.1],
        [-DESK_WIDTH / 2 + 0.1, 0, -DESK_DEPTH / 2 + 0.1],
      ];
      legOffsets.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, materials.leg);
        leg.position.set(lx, 0.36, lz);
        group.add(leg);
      });

      // 椅子 (桌子后方)
      const chairSeatGeo = new THREE.BoxGeometry(0.4, 0.04, 0.4);
      const chairBackGeo = new THREE.BoxGeometry(0.4, 0.35, 0.04);
      const chair = new THREE.Group();
      const chairSeat = new THREE.Mesh(chairSeatGeo, materials.chairAvailable);
      chairSeat.position.set(0, 0.4, 0);
      chair.add(chairSeat);
      const chairBack = new THREE.Mesh(chairBackGeo, materials.chairAvailable);
      chairBack.position.set(0, 0.57, -0.2);
      chair.add(chairBack);
      chair.position.set(0, 0, DESK_DEPTH / 2 + 0.25);
      group.add(chair);

      // 保存座位引用
      const seatData = {
        group,
        desk,
        chairSeat,
        chairBack,
        row,
        col,
        occupied: false,
        person: null, // 人物模型引用
      };
      deskGroups.push(seatData);
      seatMeshes.push(seatData);

      group.position.set(x, 0, z);
      root.add(group);
    }
  }

  // 人物容器（用于统一管理）
  const personContainer = new THREE.Group();
  personContainer.name = "person_container";
  root.add(personContainer);

  // 存储引用
  root.userData = {
    deskGroups,
    seatMeshes,
    materials,
    center: new THREE.Vector3(0, ROOM_HEIGHT / 2, 0),
    cameraPosition: new THREE.Vector3(0, ROOM_HEIGHT * 0.65, ROOM_DEPTH / 2 + 5),
    cameraLookAt: new THREE.Vector3(0, ROOM_HEIGHT * 0.45, 0),
  };

  // ---- 室内灯光 ----
  const ambientLight = new THREE.AmbientLight(0xfff5e8, 0.6);
  ambientLight.name = "classroom_ambient";
  root.add(ambientLight);

  const ceilingLight1 = new THREE.PointLight(0xfffbe6, 1.2, 12);
  ceilingLight1.position.set(-ROOM_WIDTH * 0.25, ROOM_HEIGHT - 0.3, -ROOM_DEPTH * 0.25);
  ceilingLight1.name = "classroom_light_1";
  root.add(ceilingLight1);

  const ceilingLight2 = new THREE.PointLight(0xfffbe6, 1.2, 12);
  ceilingLight2.position.set(ROOM_WIDTH * 0.25, ROOM_HEIGHT - 0.3, ROOM_DEPTH * 0.25);
  ceilingLight2.name = "classroom_light_2";
  root.add(ceilingLight2);

  scene.add(root);

  /**
   * 根据房间数据更新座位状态
   */
  function updateSeats(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    const totalSeats = DESK_ROWS * DESK_COLS;
    const occupiedCount = Math.min(room.onlineUsers, totalSeats);

    // 随机分配占用/空闲座位
    const seatIndices = Array.from({ length: totalSeats }, (_, i) => i);
    for (let i = seatIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [seatIndices[i], seatIndices[j]] = [seatIndices[j], seatIndices[i]];
    }

    const occupiedSet = new Set(seatIndices.slice(0, occupiedCount));

    // 清除旧人物
    while (personContainer.children.length > 0) {
      const child = personContainer.children[0];
      disposePerson(child);
      personContainer.remove(child);
    }

    seatMeshes.forEach((seat, idx) => {
      const isOccupied = occupiedSet.has(idx);
      seat.occupied = isOccupied;
      seat.desk.material = isOccupied ? materials.deskOccupied : materials.deskAvailable;
      seat.chairSeat.material = isOccupied ? materials.chairOccupied : materials.chairAvailable;
      seat.chairBack.material = isOccupied ? materials.chairOccupied : materials.chairAvailable;

      // 占用座位添加小人
      if (isOccupied) {
        const gx = seat.group.position.x;
        const gz = seat.group.position.z;
        const color = personColors[idx % personColors.length];
        const hairColor = hairColorPool[idx % hairColorPool.length];
        const person = createPerson(color, hairColor, idx);
        person.position.set(gx, 0.4, gz + DESK_DEPTH / 2 + 0.25);
        personContainer.add(person);
      }
    });
  }

  return {
    root,
    show(roomId) {
      root.visible = true;
      updateSeats(roomId);
    },
    hide() {
      root.visible = false;
    },
    getCameraConfig() {
      return {
        position: root.userData.cameraPosition.clone(),
        lookAt: root.userData.cameraLookAt.clone(),
        center: root.userData.center.clone(),
      };
    },
    updateSeats,
  };
}

function createWall(w, h, d) {
  const geo = new THREE.BoxGeometry(w, h, d);
  return new THREE.Mesh(geo, materials.wall);
}

/**
 * 创建 Q 版卡通小人（Chibi 风格）
 * @param {number} color - 衣服颜色
 * @param {number} hairColor - 头发颜色
 * @param {number} seed - 随机种子，用于姿态微调
 */
function createPerson(color, hairColor, seed = 0) {
  const group = new THREE.Group();

  // 皮肤材质
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbb4, roughness: 0.4 });

  // ---- 腿（短小可爱）----
  const legGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.2, 8);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.6 });

  const leftLeg = new THREE.Mesh(legGeo, legMat);
  leftLeg.position.set(-0.06, 0.1, 0);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, legMat);
  rightLeg.position.set(0.06, 0.1, 0);
  group.add(rightLeg);

  // 鞋子
  const shoeGeo = new THREE.BoxGeometry(0.08, 0.04, 0.12);
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.5 });
  const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
  leftShoe.position.set(-0.06, 0.02, 0.03);
  group.add(leftShoe);
  const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
  rightShoe.position.set(0.06, 0.02, 0.03);
  group.add(rightShoe);

  // ---- 身体（圆润梯形）----
  const bodyGeo = new THREE.CylinderGeometry(0.1, 0.13, 0.35, 10);
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.32;
  body.castShadow = true;
  group.add(body);

  // 衣领装饰
  const collarGeo = new THREE.TorusGeometry(0.09, 0.02, 6, 8);
  const collarMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const collar = new THREE.Mesh(collarGeo, collarMat);
  collar.position.y = 0.49;
  collar.rotation.x = Math.PI / 2;
  group.add(collar);

  // ---- 手臂（圆润短小）----
  const armGeo = typeof THREE.CapsuleGeometry === "function"
    ? new THREE.CapsuleGeometry(0.04, 0.18, 4, 8)
    : new THREE.CylinderGeometry(0.04, 0.04, 0.22, 8);
  const armMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });

  const leftArm = new THREE.Mesh(armGeo, armMat);
  leftArm.position.set(-0.16, 0.4, 0);
  leftArm.rotation.z = 0.3;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, armMat);
  rightArm.position.set(0.16, 0.4, 0);
  rightArm.rotation.z = -0.3;
  group.add(rightArm);

  // 手（小球）
  const handGeo = new THREE.SphereGeometry(0.045, 6, 6);
  const handMat = new THREE.MeshStandardMaterial({ color: 0xffdbb4, roughness: 0.4 });
  const leftHand = new THREE.Mesh(handGeo, handMat);
  leftHand.position.set(-0.22, 0.32, 0);
  group.add(leftHand);
  const rightHand = new THREE.Mesh(handGeo, handMat);
  rightHand.position.set(0.22, 0.32, 0);
  group.add(rightHand);

  // ---- 大头（Q版比例）----
  const headGeo = new THREE.SphereGeometry(0.14, 12, 12);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbb4, roughness: 0.35 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 0.58;
  head.castShadow = true;
  group.add(head);

  // ---- 头发（多种样式）----
  const hairStyle = seed % 3;
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.7 });

  if (hairStyle === 0) {
    // 锅盖头（半球覆盖）
    const hairGeo = new THREE.SphereGeometry(0.145, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 0.59;
    group.add(hair);
  } else if (hairStyle === 1) {
    // 刘海 + 后脑勺
    const hairGeo = new THREE.SphereGeometry(0.145, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 0.59;
    group.add(hair);
    // 小辫子
    const ponytailGeo = new THREE.SphereGeometry(0.06, 6, 6);
    const ponytail = new THREE.Mesh(ponytailGeo, hairMat);
    ponytail.position.set(0, 0.68, -0.1);
    group.add(ponytail);
  } else {
    // 短发（小巧）
    const hairGeo = new THREE.SphereGeometry(0.145, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.45);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 0.59;
    group.add(hair);
    // 小刘海
    const bangsGeo = new THREE.BoxGeometry(0.2, 0.04, 0.08);
    const bangs = new THREE.Mesh(bangsGeo, hairMat);
    bangs.position.set(0, 0.66, 0.12);
    group.add(bangs);
  }

  // ---- 眼睛（大眼萌）----
  // 左眼白
  const eyeWhiteGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
  const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
  leftEyeWhite.position.set(-0.05, 0.6, 0.12);
  group.add(leftEyeWhite);

  const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
  rightEyeWhite.position.set(0.05, 0.6, 0.12);
  group.add(rightEyeWhite);

  // 瞳孔
  const pupilGeo = new THREE.SphereGeometry(0.022, 6, 6);
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.05 });
  const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
  leftPupil.position.set(-0.05, 0.6, 0.155);
  group.add(leftPupil);
  const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
  rightPupil.position.set(0.05, 0.6, 0.155);
  group.add(rightPupil);

  // 眼睛高光
  const highlightGeo = new THREE.SphereGeometry(0.01, 4, 4);
  const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const leftHighlight = new THREE.Mesh(highlightGeo, highlightMat);
  leftHighlight.position.set(-0.04, 0.615, 0.16);
  group.add(leftHighlight);
  const rightHighlight = new THREE.Mesh(highlightGeo, highlightMat);
  rightHighlight.position.set(0.06, 0.615, 0.16);
  group.add(rightHighlight);

  // ---- 腮红 ----
  const blushGeo = new THREE.CircleGeometry(0.025, 8);
  const blushMat = new THREE.MeshBasicMaterial({ color: 0xffaaaa, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
  const leftBlush = new THREE.Mesh(blushGeo, blushMat);
  leftBlush.position.set(-0.09, 0.55, 0.13);
  group.add(leftBlush);
  const rightBlush = new THREE.Mesh(blushGeo, blushMat);
  rightBlush.position.set(0.09, 0.55, 0.13);
  group.add(rightBlush);

  // ---- 小嘴（微笑）----
  const mouthGeo = new THREE.BoxGeometry(0.04, 0.008, 0.01);
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0xdd6666, roughness: 0.3 });
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.position.set(0, 0.53, 0.135);
  group.add(mouth);

  return group;
}

function disposePerson(group) {
  group.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
}