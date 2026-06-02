/* ── Data percakapan per kontak ── */
const chatData = {
  olip: {
    name: "Olivia Gabriella",
    initial: "OG",
    color: "#7aab22",
    online: true,
    messages: [], // sudah dirender di HTML
  },
  yana: {
    name: "Alfiyana",
    initial: "AL",
    color: "#e67e22",
    online: false,
    messages: [
      {
        me: false,
        text: "Halo kak, pesanan kue kukusnya sudah ready!",
        time: "Kemarin 14.10",
      },
      {
        me: true,
        text: "Wah makasih ya kak! Nanti aku jemput jam 2 siang 🙏",
        time: "Kemarin 14.12",
      },
      {
        me: false,
        text: "Siap kak! Pesanannya udah ready 😊",
        time: "Kemarin 14.15",
      },
    ],
  },
  qistan: {
    name: "Muhammad Qistan",
    initial: "MQ",
    color: "#8e44ad",
    online: true,
    messages: [
      { me: false, text: "Kak, jual jus mangga ga?", time: "Kemarin 10.00" },
      {
        me: true,
        text: "Ada kak! Mau pesan? Rp 10.000 per gelas 😄",
        time: "Kemarin 10.05",
      },
      {
        me: false,
        text: "Jus mangganya masih ada kak?",
        time: "Kemarin 10.08",
      },
    ],
  },
  sari: {
    name: "Sari Dewi",
    initial: "SD",
    color: "#2980b9",
    online: false,
    messages: [
      {
        me: false,
        text: "Halo kak! Donat coklat masih ada ga?",
        time: "Sen 09.00",
      },
      { me: true, text: "Masih ada kak, mau pesan berapa?", time: "Sen 09.05" },
    ],
  },
  rara: {
    name: "Rara Fitri",
    initial: "RF",
    color: "#c0392b",
    online: false,
    messages: [
      {
        me: false,
        text: "Makasih pesanannya kak! Enak banget 😍",
        time: "Ming 15.00",
      },
      {
        me: true,
        text: "Makasih juga udah pesan ya kak! 🙏",
        time: "Ming 15.02",
      },
    ],
  },
};

let activeContact = "olip";

/* ── Buka chat ── */
function bukaChat(el, id) {
  document
    .querySelectorAll(".contact-item")
    .forEach((c) => c.classList.remove("active"));
  el.classList.add("active");
  // hapus unread badge
  const badge = el.querySelector(".unread-badge");
  if (badge) badge.remove();
  const preview = el.querySelector(".contact-preview");
  if (preview) preview.classList.remove("unread");

  activeContact = id;
  const d = chatData[id];

  // update header
  document.getElementById("headerAvatar").textContent = d.initial;
  document.getElementById("headerAvatar").style.background = d.color;
  document.getElementById("headerName").textContent = d.name;
  const statusEl = document.getElementById("headerStatus");
  statusEl.textContent = d.online ? "● Online" : "○ Offline";
  statusEl.className = "chat-header-status" + (d.online ? "" : " offline");

  // render pesan
  const box = document.getElementById("chatMessages");
  if (id === "olip") {
    // sudah ada di HTML, scroll ke bawah saja
    box.scrollTop = box.scrollHeight;
    return;
  }
  box.innerHTML = '<div class="date-sep"><span>Kemarin</span></div>';
  d.messages.forEach((m) =>
    renderBubble(m.text, m.time, m.me, d.initial, d.color),
  );
  box.scrollTop = box.scrollHeight;

  // mobile: sembunyikan kontak
  if (window.innerWidth <= 700) {
    document.getElementById("contacts").classList.remove("show");
    document.getElementById("btnBack").style.display = "flex";
  }
}

/* ── Render bubble ── */
function renderBubble(text, time, isMe, initial, color) {
  const box = document.getElementById("chatMessages");
  const row = document.createElement("div");
  row.className = "bubble-row" + (isMe ? " me" : "");

  const avatarColor = isMe ? "var(--green-light)" : color;
  const avatarInitial = isMe ? "CA" : initial;

  row.innerHTML = `
      <div class="bubble-avatar" style="background:${avatarColor};">${avatarInitial}</div>
      <div class="bubble ${isMe ? "me" : "them"}">
        ${text}
        <div class="bubble-time">${time}${isMe ? ' <span class="read-tick read">✓✓</span>' : ""}</div>
      </div>`;
  box.appendChild(row);
  box.scrollTop = box.scrollHeight;
}

/* ── Kirim pesan ── */
function kirimPesan() {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text) return;

  const now = new Date();
  const time =
    now.getHours().toString().padStart(2, "0") +
    "." +
    now.getMinutes().toString().padStart(2, "0");

  renderBubble(text, time, true, "", "");
  input.value = "";
  input.style.height = "auto";

  // Simpan ke data
  if (chatData[activeContact].messages) {
    chatData[activeContact].messages.push({ me: true, text, time });
  }

  // Update preview kontak
  const activeEl = document.querySelector(
    ".contact-item.active .contact-preview",
  );
  if (activeEl) {
    activeEl.textContent = text;
    activeEl.classList.remove("unread");
  }

  // Simulasi balas otomatis
  if (activeContact === "olip") {
    showTyping();
    setTimeout(() => {
      hideTyping();
      const replies = [
        "Oke kak siap! 😊",
        "Noted kak, nanti aku konfirm lagi ya!",
        "Makasih kak udah chat! 🙏",
        "Baik kak, segera aku proses!",
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      renderBubble(reply, time, false, "OG", "#7aab22");
    }, 2000);
  }
}

/* ── Kirim gambar ── */
function kirimGambar(e) {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const box = document.getElementById("chatMessages");
  const now = new Date();
  const time =
    now.getHours().toString().padStart(2, "0") +
    "." +
    now.getMinutes().toString().padStart(2, "0");
  const row = document.createElement("div");
  row.className = "bubble-row me";
  row.innerHTML = `
      <div class="bubble-avatar" style="background:var(--green-light);">CA</div>
      <div class="bubble me" style="padding:6px;">
        <img src="${url}" class="chat-img" alt="gambar">
        <div class="bubble-time">${time} <span class="read-tick read">✓✓</span></div>
      </div>`;
  box.appendChild(row);
  box.scrollTop = box.scrollHeight;
  e.target.value = "";
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

/* scroll ke bawah saat load */
window.onload = () => {
  const box = document.getElementById("chatMessages");
  box.scrollTop = box.scrollHeight;
};
