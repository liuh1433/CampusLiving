// 聊天模块 —— 模拟自习室公屏聊天系统

const quickReplies = ["👍", "好的", "小声点~", "有空位吗", "借支笔", "谢谢！", "一起自习", "🙋"];

const simMessages = [
  { user: "李明", text: "第一排男生敲键盘的声音小一点！", color: "#1976d2" },
  { user: "王芳", text: "谁有红笔，借一根，谢谢！", color: "#ef6c00" },
  { user: "张伟", text: "后排靠窗还有空位吗？", color: "#43a047" },
  { user: "刘洋", text: "这里有人坐吗？", color: "#d81b60" },
  { user: "陈静", text: "有没有人一起拼个学习小组～", color: "#8e24aa" },
  { user: "赵磊", text: "空调温度有点低，能调高一点吗？", color: "#00acc1" },
  { user: "周婷", text: "这间教室晚上开到几点呀？", color: "#f4511e" },
  { user: "吴昊", text: "推荐靠窗的位置，光线好～", color: "#3949ab" },
  { user: "徐慧", text: "有没有人看到我的水杯？落在第三排了", color: "#e91e63" },
  { user: "系统", text: "欢迎进入自习室！请保持安静，共同营造良好学习氛围。", color: "#888" },
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function createChatModule({ onNewMessage }) {
  let messages = [];
  let simInterval = null;

  function addMessage(user, text, color = "#333") {
    const msg = {
      id: Date.now() + Math.random(),
      user,
      text,
      color,
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    };
    messages.push(msg);
    if (messages.length > 200) messages.shift();
    onNewMessage?.(msg);
    return msg;
  }

  function simulateMessage() {
    const sim = simMessages[randomInt(0, simMessages.length - 1)];
    addMessage(sim.user, sim.text, sim.color);
  }

  return {
    start() {
      messages = [];
      // 初始几条消息
      addMessage("系统", "欢迎进入自习室！当前有空位，请保持安静。", "#888");
      addMessage("系统", "如需帮助可在公屏发言，祝学习愉快！", "#888");
      // 定时模拟消息
      simInterval = setInterval(() => {
        if (Math.random() < 0.6) simulateMessage();
      }, 4000 + randomInt(0, 3000));
    },
    stop() {
      clearInterval(simInterval);
      simInterval = null;
    },
    send(text) {
      return addMessage("我", text, "#1976d2");
    },
    getMessages() {
      return messages;
    },
    getQuickReplies() {
      return quickReplies;
    },
  };
}