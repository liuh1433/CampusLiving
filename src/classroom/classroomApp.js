import { rooms } from "../data/teachingComplex.js";
import { createUserSimulator } from "./userSimulator.js";
import { createChatModule } from "./chatModule.js";
import "./classroom.css";

export function createClassroomApp({ container, roomId, user, onBack }) {
  const room = rooms[roomId];
  if (!room) {
    container.innerHTML = `<p class="classroom-error">教室数据加载失败</p>`;
    return { dispose() {} };
  }

  let userSimulator = null;
  let chatModule = null;

  // 渲染结构
  container.innerHTML = `
    <div class="classroom-root">
      <!-- 顶部栏 -->
      <header class="cr-header" id="cr-header-container">
        <button class="cr-back-btn" id="cr-back-btn" type="button">← 返回</button>
        <div class="cr-room-wrapper" id="cr-room-wrapper">
          <div class="cr-room-info">
            <h2 class="cr-room-name">${room.name}</h2>
            <span class="cr-room-meta">${roomTypeLabel(room.type)} · ${room.capacity} 人容量</span>
          </div>
          <div class="cr-online" id="cr-online-count">
            <span class="cr-dot"></span>
            <span id="cr-online-num">${room.onlineUsers}</span> 人在线
          </div>
        </div>
        <button class="cr-header-toggle" id="cr-header-toggle" type="button" title="折叠信息">
          <span class="cr-toggle-icon">▲</span>
        </button>
      </header>

      <!-- 主体区 -->
      <div class="cr-body">
        <!-- 左侧：内容区 -->
        <div class="cr-main">
          <!-- 教室介绍 -->
          <section class="cr-section cr-section--intro" id="cr-intro-section">
            <div class="cr-section-header">
              <h4 class="cr-section-title">教室介绍</h4>
              <button class="cr-section-toggle" type="button" data-section="intro" title="折叠">
                <span class="cr-toggle-icon">▲</span>
              </button>
            </div>
            <div class="cr-section-body" id="cr-intro-body">
              <div class="cr-content-placeholder">
                <div class="cr-content-icon">📚</div>
                <h3>${room.name}</h3>
                <p>${roomTypeLabel(room.type)} · 空座 ${room.availableSeats} 个</p>
                <p class="cr-content-hint">自习室座位视图 —— 左侧 3D 视图展示教室内部实况</p>
              </div>
            </div>
          </section>

          <!-- 用户列表 -->
          <section class="cr-section cr-section--users" id="cr-users-section">
            <div class="cr-section-header">
              <h4 class="cr-section-title">在线用户 <span id="cr-user-count">0</span></h4>
              <button class="cr-section-toggle" type="button" data-section="users" title="折叠">
                <span class="cr-toggle-icon">▲</span>
              </button>
            </div>
            <div class="cr-section-body" id="cr-users-body">
              <div class="cr-user-items" id="cr-user-items"></div>
            </div>
          </section>
        </div>

        <!-- 右侧：聊天面板 -->
        <aside class="cr-chat" id="cr-chat-panel">
          <div class="cr-chat-header">
            <h4 class="cr-section-title">教室聊天</h4>
            <button class="cr-chat-toggle" id="cr-chat-toggle" type="button" title="折叠聊天面板">
              <span class="cr-toggle-icon">◀</span>
            </button>
          </div>
          <div class="cr-chat-body" id="cr-chat-body">
            <div class="cr-chat-messages" id="cr-chat-messages"></div>
            <div class="cr-quick-replies" id="cr-quick-replies"></div>
            <div class="cr-chat-input-row">
              <input
                class="cr-chat-input"
                id="cr-chat-input"
                type="text"
                placeholder="输入消息，按 Enter 发送..."
                maxlength="200"
              />
              <button class="cr-chat-send" id="cr-chat-send" type="button">发送</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `;

  // 绑定事件
  container.querySelector("#cr-back-btn").addEventListener("click", onBack);

  // 通用折叠：所有 section 的折叠按钮
  container.querySelectorAll(".cr-section-toggle").forEach((btn) => {
    const sectionId = btn.dataset.section;
    const body = container.querySelector(`#cr-${sectionId}-body`);
    const icon = btn.querySelector(".cr-toggle-icon");
    let collapsed = false;

    btn.addEventListener("click", () => {
      collapsed = !collapsed;
      if (collapsed) {
        body.style.display = "none";
        icon.textContent = "▼";
      } else {
        body.style.display = "";
        icon.textContent = "▲";
      }
    });
  });

  // 顶部栏折叠
  const headerContainer = container.querySelector("#cr-header-container");
  const headerToggle = container.querySelector("#cr-header-toggle");
  const roomWrapper = container.querySelector("#cr-room-wrapper");
  const headerToggleIcon = headerToggle.querySelector(".cr-toggle-icon");

  let headerCollapsed = false;
  headerToggle.addEventListener("click", () => {
    headerCollapsed = !headerCollapsed;
    if (headerCollapsed) {
      headerContainer.classList.add("cr-header--collapsed");
      roomWrapper.style.display = "none";
      headerToggleIcon.textContent = "▼";
    } else {
      headerContainer.classList.remove("cr-header--collapsed");
      roomWrapper.style.display = "";
      headerToggleIcon.textContent = "▲";
    }
  });

  const chatPanel = container.querySelector("#cr-chat-panel");
  const chatToggle = container.querySelector("#cr-chat-toggle");
  const chatBody = container.querySelector("#cr-chat-body");
  const toggleIcon = chatToggle.querySelector(".cr-toggle-icon");

  let chatCollapsed = false;
  chatToggle.addEventListener("click", () => {
    chatCollapsed = !chatCollapsed;
    if (chatCollapsed) {
      chatPanel.classList.add("cr-chat--collapsed");
      chatBody.style.display = "none";
      toggleIcon.textContent = "▶";
    } else {
      chatPanel.classList.remove("cr-chat--collapsed");
      chatBody.style.display = "";
      toggleIcon.textContent = "◀";
    }
  });

  const chatMessagesEl = container.querySelector("#cr-chat-messages");
  const chatInputEl = container.querySelector("#cr-chat-input");
  const chatSendEl = container.querySelector("#cr-chat-send");
  const quickRepliesEl = container.querySelector("#cr-quick-replies");
  const userItemsEl = container.querySelector("#cr-user-items");
  const userCountEl = container.querySelector("#cr-user-count");
  const onlineNumEl = container.querySelector("#cr-online-num");

  // 聊天模块
  chatModule = createChatModule({
    onNewMessage: (msg) => {
      appendChatMessage(chatMessagesEl, msg);
    },
  });

  function appendChatMessage(el, msg) {
    const isMe = msg.user === "我";
    const bubble = document.createElement("div");
    bubble.className = `cr-msg ${isMe ? "cr-msg-self" : ""} ${msg.user === "系统" ? "cr-msg-system" : ""}`;
    bubble.innerHTML = `
      <span class="cr-msg-user" style="color:${msg.color}">${msg.user}</span>
      <span class="cr-msg-text">${msg.text}</span>
      <span class="cr-msg-time">${msg.time}</span>
    `;
    el.appendChild(bubble);
    el.scrollTop = el.scrollHeight;
  }

  function sendMessage() {
    const text = chatInputEl.value.trim();
    if (!text) return;
    chatModule.send(text);
    chatInputEl.value = "";
    chatInputEl.focus();
  }

  chatSendEl.addEventListener("click", sendMessage);
  chatInputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // 快捷回复
  const quickReplies = chatModule.getQuickReplies();
  quickRepliesEl.innerHTML = quickReplies
    .map((qr) => `<button class="cr-qr-btn" type="button">${qr}</button>`)
    .join("");
  quickRepliesEl.querySelectorAll(".cr-qr-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      chatModule.send(btn.textContent);
    });
  });

  // 用户模拟器
  userSimulator = createUserSimulator((users) => {
    renderUsers(userItemsEl, userCountEl, onlineNumEl, users, userSimulator);
  });

  function renderUsers(listEl, countEl, onlineEl, users, sim) {
    countEl.textContent = users.length;
    onlineEl.textContent = users.length;

    listEl.innerHTML = users
      .map((u) => {
        const icon = sim.getStatusIcon(u.status);
        return `
          <div class="cr-user-item">
            <span class="cr-user-avatar" style="background:${u.color}">${u.avatar}</span>
            <span class="cr-user-name">${u.name}</span>
            <span class="cr-user-status">${icon} ${u.status}</span>
          </div>
        `;
      })
      .join("");
  }

  // 启动
  userSimulator.start();
  chatModule.start();

  return {
    dispose() {
      userSimulator?.stop();
      chatModule?.stop();
    },
  };
}

function roomTypeLabel(type) {
  return {
    lecture: "大教室",
    classroom: "普通教室",
    study: "自习室",
    discussion: "讨论室",
    lounge: "公共区",
    media: "多媒体",
  }[type] ?? "教室";
}