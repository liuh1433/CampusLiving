// 模拟用户数据与在线状态
const studentNames = [
  { name: "李明", avatar: "李", color: "#1976d2" },
  { name: "王芳", avatar: "王", color: "#ef6c00" },
  { name: "张伟", avatar: "张", color: "#43a047" },
  { name: "刘洋", avatar: "刘", color: "#d81b60" },
  { name: "陈静", avatar: "陈", color: "#8e24aa" },
  { name: "赵磊", avatar: "赵", color: "#00acc1" },
  { name: "周婷", avatar: "周", color: "#f4511e" },
  { name: "吴昊", avatar: "吴", color: "#3949ab" },
  { name: "徐慧", avatar: "徐", color: "#e91e63" },
  { name: "孙鹏", avatar: "孙", color: "#00897b" },
  { name: "马超", avatar: "马", color: "#5e35b1" },
  { name: "朱丽", avatar: "朱", color: "#c2185b" },
];

const statuses = ["自习中", "看书", "做题中", "休息中", "查资料"];
const statusIcons = { "自习中": "📖", "看书": "📚", "做题中": "✏️", "休息中": "☕", "查资料": "💻" };

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 生成一批模拟用户 */
export function generateUsers(count = 12) {
  return studentNames.slice(0, count).map((s, i) => ({
    id: `user-${i + 1}`,
    name: s.name,
    avatar: s.avatar,
    color: s.color,
    status: statuses[randomInt(0, statuses.length - 1)],
    online: true,
    joinedAt: Date.now() - randomInt(0, 3600 * 1000),
  }));
}

/** 模拟用户状态变化 */
export function createUserSimulator(onUsersChange) {
  let users = generateUsers(12);
  let intervalId = null;

  function randomUpdate() {
    if (users.length === 0) return;

    // 随机改变 1-2 个用户的状态
    const changes = randomInt(1, 2);
    for (let i = 0; i < changes; i++) {
      const idx = randomInt(0, users.length - 1);
      users[idx] = { ...users[idx], status: statuses[randomInt(0, statuses.length - 1)] };
    }

    // 小概率模拟用户进出
    if (Math.random() < 0.15) {
      if (Math.random() < 0.5 && users.length < 15) {
        // 加入
        const newUser = studentNames[users.length % studentNames.length];
        users.push({
          id: `user-${users.length + 1}`,
          name: newUser.name,
          avatar: newUser.avatar,
          color: newUser.color,
          status: "自习中",
          online: true,
          joinedAt: Date.now(),
        });
      } else if (users.length > 6) {
        // 离开
        users.splice(randomInt(0, users.length - 1), 1);
      }
    }

    onUsersChange(users);
  }

  return {
    start() {
      users = generateUsers(12);
      onUsersChange(users);
      intervalId = setInterval(randomUpdate, 3000 + randomInt(0, 2000));
    },
    stop() {
      clearInterval(intervalId);
      intervalId = null;
    },
    getUsers() {
      return users;
    },
    getStatusIcon(status) {
      return statusIcons[status] ?? "";
    },
  };
}