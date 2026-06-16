# 综合教学楼 MVP 实施计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框语法来跟踪进度。

**目标：** 构建一个基于综合教学楼 1-6 号楼的 3D 可交互原型，支持点击楼栋、进入楼层选择，并用平视透视楼层模型展示每层楼。

**架构：** 使用 Vite + Three.js 创建轻量 Web 原型。3D Canvas 负责建筑群、楼栋点击、镜头切换与楼层模型展示；HTML/CSS UI 负责信息面板、楼层列表、房间列表和状态提示。第一阶段仅使用本地静态数据和本地 `.glb` 资产，不接后端。

**技术栈：** Vite、Three.js、GLTFLoader、OrbitControls、Raycaster、原生 HTML/CSS/JS、Blender 生成的 `.glb` 模型。

---

## 功能边界

### 本阶段必须实现

- 综合教学楼 1-6 号楼 3D 场景加载。
- 参考当前 Low-Poly 校园地图风格。
- 用户可点击具体楼栋。
- 点击楼栋后进入楼层选择状态。
- 楼层选择使用平视 + 透视相机。
- 先实现 `1号教学楼` 的楼层爆炸视图。
- 楼层可 hover、选中、点击。
- 点击楼层后显示该层房间列表。
- UI 展示楼栋名称、楼层、在线人数、房间数量。
- 所有数据使用本地 mock。

### 本阶段暂不实现

- 完整校园地图。
- 真实账号系统。
- 实时 WebSocket 聊天。
- 后端服务和数据库。
- 精确室内装修。
- 真实教室门牌。
- 移动端深度适配。
- 多人实时在线状态。
- 热榜和共鸣传播完整机制。

### 可做但非首要

- 匿名身份生成弹窗。
- 房间座位图静态原型。
- 2-6 号教学楼楼层模型。
- 楼栋切换动画进一步打磨。

---

## 文件结构

创建以下前端项目结构：

```text
package.json
index.html
src/
  main.js
  styles.css
  data/
    teachingComplex.js
  three/
    scene.js
    assets.js
    camera.js
    picking.js
    floorView.js
  ui/
    state.js
    panels.js
    identity.js
assets/
  glb/
    teaching_complex_1_6.glb
    floors/
      teaching_1_floors.glb
  previews/
    teaching_complex_1_6_map_angle.png
scripts/
  blender/
    create_teaching_floor_models.py
```

文件职责：

- `src/main.js`：应用入口，初始化状态、3D 场景和 UI。
- `src/styles.css`：全局布局、面板、按钮、状态标签、响应式基础样式。
- `src/data/teachingComplex.js`：综合楼本地数据，包括楼栋、楼层、房间。
- `src/three/scene.js`：Three.js renderer、scene、基础灯光、地面、启动循环。
- `src/three/assets.js`：GLB 加载、模型缓存、楼栋节点映射。
- `src/three/camera.js`：地图视角、楼层视角、相机过渡。
- `src/three/picking.js`：Raycaster 点击和 hover 检测。
- `src/three/floorView.js`：楼层模型加载、爆炸楼层布局、高亮。
- `src/ui/state.js`：应用状态管理。
- `src/ui/panels.js`：右侧信息面板、楼层列表、房间列表渲染。
- `src/ui/identity.js`：匿名身份生成。
- `scripts/blender/create_teaching_floor_models.py`：生成 1 号教学楼楼层模型。

---

## 数据模型

### Building

```js
{
  id: 'teaching-1',
  name: '1号教学楼',
  shortName: '1号',
  modelNodePrefix: 'teaching_1',
  floors: ['teaching-1-1f', 'teaching-1-2f', 'teaching-1-3f', 'teaching-1-4f'],
  onlineUsers: 18,
  roomCount: 24,
  desc: '靠近马可广场的独立教学楼。'
}
```

### Floor

```js
{
  id: 'teaching-1-3f',
  buildingId: 'teaching-1',
  label: '3F',
  level: 3,
  onlineUsers: 6,
  rooms: ['teaching-1-3f-301', 'teaching-1-3f-302']
}
```

### Room

```js
{
  id: 'teaching-1-3f-301',
  floorId: 'teaching-1-3f',
  name: '301 自习室',
  type: 'study',
  capacity: 48,
  onlineUsers: 12,
  availableSeats: 16
}
```

### AppState

```js
{
  mode: 'map' | 'buildingFloors' | 'floorRooms' | 'room',
  selectedBuildingId: null,
  hoveredBuildingId: null,
  selectedFloorId: null,
  hoveredFloorId: null,
  selectedRoomId: null,
  user: {
    name: '蓝色刺猬',
    color: '#1976d2',
    avatarText: '刺'
  }
}
```

---

## 3D 交互设计

### 地图状态

- 加载 `assets/glb/teaching_complex_1_6.glb`。
- 使用正交相机，保持当前效果图风格。
- 鼠标 hover 楼栋时：
  - 楼栋轻微变亮。
  - 显示浮动标签。
  - 右侧面板预览楼栋信息。
- 鼠标 click 楼栋时：
  - 更新 `selectedBuildingId`。
  - 切换 `mode = 'buildingFloors'`。
  - 镜头切换到楼层选择视角。

### 楼层选择状态

- 第一版只对 `teaching-1` 加载真实楼层模型。
- 使用透视相机，平视略俯。
- 隐藏或弱化综合楼全局模型。
- 显示 `teaching_1_floors.glb`。
- 每一层作为独立 group：
  - `teaching_1_floor_1`
  - `teaching_1_floor_2`
  - `teaching_1_floor_3`
  - `teaching_1_floor_4`
- 楼层垂直间距固定，例如 `2.2m`。
- hover 楼层时，楼层材质变亮。
- click 楼层时，右侧显示该层房间列表。

### 镜头

地图视角：

```js
camera.type = OrthographicCamera
position = [58, -72, 68]
target = [0, -2, 8]
```

楼层视角：

```js
camera.type = PerspectiveCamera
position = [18, -28, 14]
target = [0, 0, 6]
fov = 42
```

相机过渡：

- MVP 可先用直接切换。
- 第二版再做插值动画。

---

## 建模计划

### 1号教学楼楼层模型

创建 `scripts/blender/create_teaching_floor_models.py`：

- 生成 4 层楼。
- 每层包含：
  - 楼板。
  - 半高外墙。
  - 走廊。
  - 4-6 个教室分区。
  - 楼梯核心。
  - 蓝色窗带。
  - 楼层文字标签。
- 导出：
  - `assets/glb/floors/teaching_1_floors.glb`
  - `assets/previews/teaching_1_floor_view.png`

命名规则：

```text
teaching_1_floor_1
teaching_1_floor_2
teaching_1_floor_3
teaching_1_floor_4
teaching_1_room_301
teaching_1_corridor_3
teaching_1_stair_core
```

### 后续楼栋

- 2/3/5/6 号楼复用 1 号楼模型生成逻辑。
- 4 号主楼单独生成纵向主楼楼层模型。

---

## 实施任务

### 任务 1：创建 Vite 前端项目

**文件：**

- 创建：`package.json`
- 创建：`index.html`
- 创建：`src/main.js`
- 创建：`src/styles.css`

- [ ] 初始化 npm 项目。
- [ ] 安装 `vite` 和 `three`。
- [ ] 创建全屏 Canvas 容器。
- [ ] 创建基础 UI 外壳：顶部栏、右侧面板、底部状态条。
- [ ] `npm run dev` 能启动页面。

验收：

- 浏览器可打开本地页面。
- 页面有全屏 3D 区域和 UI 面板。

### 任务 2：加载综合教学楼 GLB

**文件：**

- 创建：`src/three/scene.js`
- 创建：`src/three/assets.js`
- 修改：`src/main.js`

- [ ] 创建 renderer、scene、camera、lights。
- [ ] 加载 `assets/glb/teaching_complex_1_6.glb`。
- [ ] 设置等距地图相机。
- [ ] 添加 OrbitControls。
- [ ] 限制缩放和旋转范围。

验收：

- 页面能看到综合教学楼模型。
- 视角接近当前预览图。

### 任务 3：建立综合楼数据与楼栋映射

**文件：**

- 创建：`src/data/teachingComplex.js`
- 创建：`src/ui/state.js`
- 修改：`src/three/assets.js`

- [ ] 定义 1-6 号楼数据。
- [ ] 建立楼栋 ID 与模型节点名前缀的映射。
- [ ] 遍历 GLB 场景，将 mesh 归属到楼栋。
- [ ] 给每个 mesh 写入 `userData.buildingId`。

验收：

- 控制台能打印每栋楼对应的 mesh 数量。

### 任务 4：实现楼栋 hover 和 click

**文件：**

- 创建：`src/three/picking.js`
- 修改：`src/ui/state.js`
- 修改：`src/ui/panels.js`

- [ ] 使用 Raycaster 检测鼠标 hover。
- [ ] hover 楼栋时高亮。
- [ ] click 楼栋时选中。
- [ ] 右侧面板显示楼栋名称、楼层数、在线人数、房间数。

验收：

- 鼠标移动到楼栋时有视觉反馈。
- 点击 `1号教学楼` 后面板显示 `1号教学楼`。

### 任务 5：生成 1号教学楼楼层 GLB

**文件：**

- 创建：`scripts/blender/create_teaching_floor_models.py`
- 创建输出：`assets/glb/floors/teaching_1_floors.glb`
- 创建输出：`assets/previews/teaching_1_floor_view.png`

- [ ] 用 Blender Python 生成 4 层爆炸视图。
- [ ] 每层独立命名。
- [ ] 每层有楼板、走廊、教室分区、楼梯核心。
- [ ] 导出 GLB。
- [ ] 渲染预览图。

验收：

- `teaching_1_floors.glb` 存在。
- 预览图能看清 4 层结构。

### 任务 6：实现楼层选择视图

**文件：**

- 创建：`src/three/floorView.js`
- 创建：`src/three/camera.js`
- 修改：`src/main.js`
- 修改：`src/ui/panels.js`

- [ ] 点击 `1号教学楼` 后加载 `teaching_1_floors.glb`。
- [ ] 切换为平视透视相机。
- [ ] 隐藏或弱化综合楼地图模型。
- [ ] 显示 4 层楼层模型。
- [ ] 右侧显示楼层列表。

验收：

- 点击 1 号楼后进入楼层选择。
- 画面从地图变成平视楼层模型。

### 任务 7：实现楼层 hover / click

**文件：**

- 修改：`src/three/picking.js`
- 修改：`src/three/floorView.js`
- 修改：`src/ui/panels.js`

- [ ] Raycaster 检测楼层 group。
- [ ] hover 楼层时高亮。
- [ ] click 楼层时选中。
- [ ] 面板显示该层房间列表。

验收：

- Hover `3F` 时 3F 变亮。
- Click `3F` 后右侧显示 301/302 等房间。

### 任务 8：房间列表与返回流程

**文件：**

- 修改：`src/ui/panels.js`
- 修改：`src/ui/state.js`
- 修改：`src/main.js`

- [ ] 房间列表展示类型、容量、在线人数、空座。
- [ ] 点击房间进入房间占位页面。
- [ ] 支持从楼层返回楼栋地图。
- [ ] 支持从房间返回楼层。

验收：

- 完成 `地图 → 楼栋 → 楼层 → 房间 → 返回` 闭环。

---

## 验证方式

开发过程中每个阶段至少执行：

```bash
npm run dev
```

如引入构建脚本：

```bash
npm run build
```

人工验证：

- 页面能加载。
- 控制台无红色错误。
- GLB 模型显示。
- 点击和 hover 状态正确。
- 右侧 UI 数据与选中对象一致。

视觉验证：

- 建筑地图视角接近 `assets/previews/teaching_complex_1_6_map_angle.png`。
- 楼层选择视角为平视透视，不再是等距俯视。
- Low-Poly 风格和当前模型统一。

---

## 风险与处理

| 风险 | 处理 |
|---|---|
| GLB 节点命名不稳定 | 在 Blender 脚本中统一对象前缀，前端按前缀归属 |
| 模型点击区域过碎 | 将同一楼栋 mesh 归为同一个 `buildingId` |
| 楼层模型与楼栋模型尺度不一致 | Blender 统一 1 unit = 1 meter |
| 中文字体在 Three.js 文本中麻烦 | 第一阶段楼层标签优先用 HTML overlay 或简单 Font 对象 |
| 页面性能不足 | 控制 mesh 数量，避免过多透明材质和复杂后处理 |
| 需求继续扩大到全校园 | 第一阶段只做综合教学楼，完整校园放第二阶段 |

---

## 推荐开发顺序

1. 前端项目骨架。
2. 综合楼 GLB 加载。
3. 楼栋点击识别。
4. 1号教学楼楼层模型生成。
5. 楼层选择视图。
6. 楼层点击和房间列表。
7. 匿名身份和基础聊天占位。

先把 `1号教学楼` 的完整链路做通，再复制能力到 2-6 号楼。
