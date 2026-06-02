let realtimeChannel = null;
let supabaseRealtime = null;

let activeConversationId = null;
let currentUser = null;
let conversations = [];

async function initializeRealtime() {
  try {
    const response = await authenticatedFetch(`${API_URL}/config/realtime`);
    const result = await response.json();

    if (!response.ok) throw new Error(result.message);

    supabaseRealtime = supabase.createClient(
      result.data.supabaseUrl,
      result.data.supabaseAnonKey,
    );
  } catch (err) {
    console.error(err);
  }
}

function subscribeConversation(conversationId) {
  if (!supabaseRealtime) return;

  if (realtimeChannel) supabaseRealtime.removeChannel(realtimeChannel);

  realtimeChannel = supabaseRealtime
    .channel(`conversation-${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
      },
      async (payload) => {
        const message = payload.new;

        if (Number(message.conversation_id) !== Number(conversationId))
          return;

        await loadChat(conversationId);
        await loadConversations();
      },
    )
    .subscribe();
}

/* -- Tampilkan user yang sedang login -- */
async function loadCurrentUser() {
  try {
    const response = await authenticatedFetch(`${API_URL}/users/me`);
    if (!response.ok) return;

    const result = await response.json();
    const user = result.data;
    currentUser = user;
  } catch (err) {
    console.error(err);
  }
}

async function loadConversations() {
  try {
    const response = await authenticatedFetch(`${API_URL}/conversations`);
    const result = await response.json();

    if (!response.ok) throw new Error(result.message);
    conversations = result.data || [];

    renderConversationList();
  } catch (err) {
    console.error(err);
  }
}

function renderConversationList() {
  const container = document.getElementById("contactList");
  container.innerHTML = "";
  if (conversations.length > 0) {
    conversations.forEach((conversation) => {
      const user = conversation.other_user;
      const div = document.createElement("div");
      div.className = "contact-item";
      div.dataset.id = conversation.id;
      div.innerHTML = `
      <div class="contact-avatar">
        ${(user.name || "?")
          .split(" ")
          .map((s) => s[0])
          .slice(0, 2)
          .join("")}
      </div>
      <div class="contact-body">
        <div class="contact-name">${user.name}</div>
        <div class="contact-preview ${
          conversation.unread_count > 0 ? "unread" : ""
        }">
          ${conversation.last_message || ""}
        </div>
      </div>
      <div class="contact-meta">
        ${
          conversation.unread_count > 0
            ? `<span class="unread-badge">${conversation.unread_count}</span>`
            : ""
        }
      </div>
    `;
      div.onclick = () => openConversation(conversation);
      container.appendChild(div);
    });
  } else {
    document.getElementById("chatMessages").innerHTML =
      `<div class="empty-chat">
      <div class="big">💬</div>
      <p>Belum ada percakapan</p>
      <small>Mulai chat dari halaman produk</small>
    </div>`;
  }
}

async function openConversation(conversation) {
  activeConversationId = conversation.id;
  document.getElementById("headerName").textContent =
    conversation.other_user.name;
  const avatar = document.getElementById("headerAvatar");
  avatar.innerHTML = conversation.other_user.avatar_url
    ? `
  <img
    src="${conversation.other_user.avatar_url}"
    style="width:100%;height:100%;border-radius:50%;object-fit:cover;"
  >`
    : (conversation.other_user.name || "?")
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
  subscribeConversation(conversation.id);
  await loadChat(conversation.id);
  await markConversationAsRead(conversation.id);
  await loadConversations();
}

async function loadChat(conversationId) {
  try {
    const response = await authenticatedFetch(
      `${API_URL}/conversations/${conversationId}/messages`,
    );
    const result = await response.json();

    if (!response.ok) throw new Error(result.message);
    bukaChat(result.data);
  } catch (err) {
    console.error(err);
  }
}

/* ── Buka chat ── */
function bukaChat(messages) {
  // render pesan
  const box = document.getElementById("chatMessages");
  box.innerHTML = "";
  messages.forEach((m) => {
    const isMe = m.sender_id === currentUser.id;
    renderBubble(m, isMe);
  });
  box.scrollTop = box.scrollHeight;

  // mobile: sembunyikan kontak
  if (window.innerWidth <= 700) {
    document.getElementById("contacts").classList.remove("show");
    document.getElementById("btnBack").style.display = "flex";
  }
}

/* ── Render bubble ── */
function renderBubble(message, isMe) {
  const box = document.getElementById("chatMessages");
  const row = document.createElement("div");
  row.className = `bubble-row ${isMe ? "me" : ""}`;

  let content = "";
  if (message.media_url)
    content += `<img src="${message.media_url}" class="chat-img" alt="media">`;
  if (message.body)
    content += `<div style="margin-top:6px;">${message.body}</div>`;

  row.innerHTML = `
    <div class="bubble ${isMe ? "me" : "them"}">
      ${content}

      <div class="bubble-time">
        ${new Date(message.created_at).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>

      ${
        isMe
          ? `<span class="read-tick ${message.is_read ? "read" : ""}">
              ✓✓
            </span>`
          : ""
      }
    </div>
  `;
  box.appendChild(row);
}

/* ── Kirim pesan ── */
async function kirimPesan() {
  if (!activeConversationId) return;
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text) return;

  try {
    await authenticatedFetch(
      `${API_URL}/conversations/${activeConversationId}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      },
    );
    input.value = "";
  } catch (err) {
    console.error(err);
  }
}

/* ── Kirim gambar ── */
async function kirimGambar(event) {
  if (!activeConversationId) return;
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("media", file);

  const caption = document.getElementById("msgInput").value.trim();
  if (caption) formData.append("body", caption);
  try {
    await authenticatedFetch(
      `${API_URL}/conversations/${activeConversationId}/messages`,
      {
        method: "POST",
        body: formData,
      },
    );
    document.getElementById("msgInput").value = "";
  } catch (err) {
    console.error(err);
  }
  event.target.value = "";
}

async function markConversationAsRead(conversationId) {
  try {
    await authenticatedFetch(
      `${API_URL}/conversations/${conversationId}/read`,
      {
        method: "PUT",
      },
    );
  } catch (err) {
    console.error(err);
  }
}

/* ── Typing indicator ── */
function showTyping() {
  const row = document.getElementById("typingRow");
  row.style.display = "flex";
  document.getElementById("chatMessages").scrollTop = 9999;
}
function hideTyping() {
  document.getElementById("typingRow").style.display = "none";
}

/* ── Keyboard enter ── */
function handleKey(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    kirimPesan();
  }
}

/* ── Auto resize textarea ── */
function autoResize(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 100) + "px";
}

/* ── Emoji ── */
function toggleEmoji() {
  document.getElementById("emojiRow").classList.toggle("show");
}
function insertEmoji(e) {
  const input = document.getElementById("msgInput");
  input.value += e;
  input.focus();
}

/* ── Filter kontak ── */
function filterContacts(q) {
  document.querySelectorAll(".contact-item").forEach((el) => {
    const name = el.dataset.name.toLowerCase();
    el.style.display = name.includes(q.toLowerCase()) ? "flex" : "none";
  });
}

/* ── Mobile: kembali ke list kontak ── */
function kembaliKontak() {
  document.getElementById("contacts").classList.add("show");
  document.getElementById("btnBack").style.display = "none";
}

window.onload = async () => {
  await loadCurrentUser();
  await initializeRealtime();
  await loadConversations();
  if (conversations.length > 0) {
    await openConversation(conversations[0]);
  }
};
