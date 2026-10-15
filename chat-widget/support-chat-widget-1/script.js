// ---------- Bot brain: first matching rule answers (edit freely) ----------
const TOPICS = ["💳 Pricing", "📅 Book a demo", "📦 Track my order", "🙋 Talk to a human"];
const rules = [
  {
    match: /price|pricing|plan|cost/i,
    text: "Plans start at ₹999/month. Most growing teams pick Pro 👇",
    card: { title: "Pro plan", price: "₹2,499 / month", note: "Unlimited projects · 100 GB · priority support", cta: "Compare all plans" },
    chips: ["📅 Book a demo", "🙋 Talk to a human"],
  },
  { match: /demo|call|meeting/i, text: "Happy to show you around! Pick a slot that suits you:", chips: ["Tomorrow 11:00", "Tomorrow 16:30", "Friday 10:00"] },
  { match: /^(tomorrow|friday)/i, text: "Booked ✅ A calendar invite is on its way to your inbox." },
  { match: /human|agent|person|someone/i, handoff: true },
  { match: /track|order|delivery/i, text: "Sure! Share your order ID — it starts with #NB (try #NB2048)." },
  { match: /#?nb\d+/i, text: "Found it 📦 Your order is out for delivery and should arrive today by 7 PM." },
  { match: /\[image\]/i, text: "Thanks for the screenshot! Looking into it 👀" },
  { match: /thank|thanks|great|awesome|cool/i, text: "Anytime! 💜 Anything else I can help with?" },
  { match: /^(hi|hello|hey)\b/i, text: "Hey there! 👋 What can I help you with today?", chips: TOPICS },
];
const FALLBACK = { text: "Got it — I've shared this with the team and someone will reply here shortly. Anything else meanwhile?", chips: TOPICS };
const EMOJIS = "😀 😂 🥹 😍 😎 🤔 😅 🙌 👍 👋 🙏 💜 🔥 ✨ 🎉 ✅ ❌ 👀 💡 📦 📅 💳 🚀 ☕".split(" ");

const BOT = { name: "Nimbus Assistant", initial: "N", color: "#6d5dfc" };
const AGENT = { name: "Riya", initial: "R", color: "#f59e0b" };
const STORE_KEY = "nimbus-chat";

// ---------- State ----------
const $ = (id) => document.getElementById(id);
const chat = $("chat");
const launcher = $("launcher");
const list = $("messages");
const input = $("input");
const sendBtn = $("send");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) ?? { messages: [], human: false, sound: true };
  } catch {
    return { messages: [], human: false, sound: true };
  }
};
const state = load();
const save = () => {
  try {
    // Images aren't saved (they'd bloat storage) — they come back as a label
    const messages = state.messages.map((m) => (m.image ? { ...m, image: null, text: "📷 Image" } : m));
    localStorage.setItem(STORE_KEY, JSON.stringify({ ...state, messages }));
  } catch {
    /* storage blocked */
  }
};

let unread = 0;
const isOpen = () => chat.classList.contains("is-open");
const time = (t) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// ---------- Sound (a tiny blip, no audio file needed) ----------
let audio;
const blip = () => {
  if (!state.sound) return;
  try {
    audio ??= new AudioContext();
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.frequency.setValueAtTime(880, audio.currentTime);
    o.frequency.exponentialRampToValueAtTime(1320, audio.currentTime + 0.08);
    g.gain.setValueAtTime(0.06, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.18);
    o.connect(g).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + 0.2);
  } catch {
    /* audio not available */
  }
};

// ---------- Rendering ----------
const who = (m) => (m.from === "agent" ? AGENT : BOT);

const messageHTML = (m, prev) => {
  if (m.type === "system") return `<p class="system">${esc(m.text)}</p>`;
  const grouped = prev && prev.from === m.from && prev.type !== "system";
  const body = m.image ? `<img src="${m.image}" alt="Attached image" />` : esc(m.text).replace(/\n/g, "<br>");
  const card = m.card
    ? `<div class="card"><b>${m.card.title}</b><div class="price">${m.card.price}</div><small>${m.card.note}</small><br><br><a href="#">${m.card.cta}</a></div>`
    : "";
  const av = m.from === "me" ? "" : `<span class="m-av" style="--c:${who(m).color}" aria-hidden="true">${who(m).initial}</span>`;
  const ticks = m.from === "me" ? `<span class="ticks ${m.status === "read" ? "read" : ""}" aria-label="${m.status}">${m.status === "sent" ? "✓" : "✓✓"}</span>` : "";
  const chips = m.chips && m === state.messages.at(-1) ? `<div class="chips">${m.chips.map((c) => `<button type="button" class="chip">${c}</button>`).join("")}</div>` : "";
  return `<div class="msg ${m.from === "me" ? "me" : "them"} ${grouped ? "grouped" : ""}" data-id="${m.id}">${av}<div class="bubble">${body}${card}</div></div>
    <div class="meta ${m.from === "me" ? "me" : "them"}" data-meta="${m.id}">${m.from === "me" ? "" : `${who(m).name} · `}${time(m.time)} ${ticks}</div>${chips}`;
};

const renderAll = () => {
  list.classList.add("no-anim");
  list.innerHTML = `<p class="day">Today</p>${state.messages.map((m, i) => messageHTML(m, state.messages[i - 1])).join("")}`;
  list.scrollTop = list.scrollHeight;
  requestAnimationFrame(() => list.classList.remove("no-anim"));
};

const append = (m) => {
  list.querySelectorAll(".chips").forEach((c) => c.remove()); // old quick replies go away
  const prev = state.messages.at(-1);
  state.messages.push(m);
  list.insertAdjacentHTML("beforeend", messageHTML(m, prev));
  list.scrollTop = list.scrollHeight;
  save();
  if (m.from !== "me" && m.type !== "system") {
    blip();
    if (!isOpen()) setUnread(unread + 1);
  }
};

const setStatus = (m, status) => {
  m.status = status;
  const meta = list.querySelector(`[data-meta="${m.id}"] .ticks`);
  if (meta) {
    meta.textContent = status === "sent" ? "✓" : "✓✓";
    meta.classList.toggle("read", status === "read");
    meta.setAttribute("aria-label", status);
  }
  save();
};

const setUnread = (n) => {
  unread = n;
  $("unread").textContent = n;
  $("unread").hidden = n === 0;
  launcher.setAttribute("aria-label", n ? `Open chat, ${n} unread` : "Open chat");
};

// ---------- Typing indicator + replies ----------
const showTyping = (person) => {
  list.insertAdjacentHTML(
    "beforeend",
    `<div class="msg them typing" id="typing"><span class="m-av" style="--c:${person.color}">${person.initial}</span><div class="bubble"><i></i><i></i><i></i></div></div>`,
  );
  list.scrollTop = list.scrollHeight;
};
const hideTyping = () => $("typing")?.remove();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let busy = Promise.resolve();
const reply = (userMsg) => {
  busy = busy.then(async () => {
    await wait(500);
    setStatus(userMsg, "read");
    const text = userMsg.image ? "[image]" : userMsg.text;
    const rule = rules.find((r) => r.match.test(text.replace(/^[^\w#\[]+/, ""))) ?? FALLBACK;

    if (rule.handoff && !state.human) {
      append({ id: Date.now(), type: "system", text: "Connecting you to a human…", time: Date.now() });
      showTyping(AGENT);
      await wait(1800);
      hideTyping();
      state.human = true;
      append({ id: Date.now(), type: "system", text: "Riya joined the conversation", time: Date.now() });
      append({ id: Date.now() + 1, from: "agent", text: "Hi, I'm Riya 👋 I've read the chat so far — how can I help?", time: Date.now() });
      return;
    }

    const person = state.human ? AGENT : BOT;
    showTyping(person);
    await wait(700 + Math.min((rule.text ?? "").length * 18, 1600));
    hideTyping();
    append({ id: Date.now(), from: state.human ? "agent" : "bot", text: rule.text, card: rule.card, chips: rule.chips, time: Date.now() });
  });
};

const send = ({ text, image }) => {
  const m = { id: Date.now(), from: "me", text, image, time: Date.now(), status: "sent" };
  append(m);
  setTimeout(() => setStatus(m, m.status === "read" ? "read" : "delivered"), 350);
  reply(m);
};

// ---------- Open / close ----------
const welcome = () => {
  if (state.messages.length) return;
  append({ id: Date.now(), from: "bot", text: "Hi! I'm the Nimbus assistant 🤖 Ask me anything, or pick a topic:", chips: TOPICS, time: Date.now() });
};

const setOpen = (open) => {
  chat.classList.toggle("is-open", open);
  chat.setAttribute("aria-hidden", !open);
  launcher.setAttribute("aria-expanded", open);
  $("greeting").hidden = true;
  if (open) {
    setUnread(0);
    welcome();
    list.scrollTop = list.scrollHeight;
    setTimeout(() => input.focus(), reduceMotion ? 0 : 250);
  } else {
    launcher.focus();
  }
};

launcher.addEventListener("click", () => setOpen(!isOpen()));
$("minimize-btn").addEventListener("click", () => setOpen(false));
$("greeting-open").addEventListener("click", () => setOpen(true));
$("greeting").querySelector(".greeting-close").addEventListener("click", () => {
  $("greeting").hidden = true;
  setUnread(0);
  sessionStorage.setItem("nimbus-greeted", "1");
});

// ---------- Composer ----------
const autoGrow = () => {
  input.style.height = "auto";
  input.style.height = `${input.scrollHeight}px`;
  sendBtn.disabled = !input.value.trim();
};
input.addEventListener("input", autoGrow);
input.addEventListener("keydown", (e) => {
  // Enter sends, Shift+Enter adds a new line
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    $("composer").requestSubmit();
  }
});
$("composer").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  autoGrow();
  $("emoji-panel").hidden = true;
  send({ text });
});

list.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (chip) send({ text: chip.textContent });
});

// Emoji picker
const emojiPanel = $("emoji-panel");
emojiPanel.innerHTML = EMOJIS.map((e) => `<button type="button" aria-label="${e}">${e}</button>`).join("");
$("emoji-btn").addEventListener("click", (e) => {
  emojiPanel.hidden = !emojiPanel.hidden;
  e.currentTarget.setAttribute("aria-expanded", !emojiPanel.hidden);
});
emojiPanel.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  const pos = input.selectionStart ?? input.value.length;
  input.value = input.value.slice(0, pos) + b.textContent + input.value.slice(pos);
  input.focus();
  input.selectionStart = input.selectionEnd = pos + b.textContent.length;
  autoGrow();
});

// Image attachment
$("attach").addEventListener("change", (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file || !file.type.startsWith("image/")) return;
  if (file.size > 5 * 1024 * 1024) return append({ id: Date.now(), type: "system", text: "Images must be under 5 MB", time: Date.now() });
  const reader = new FileReader();
  reader.onload = () => send({ image: reader.result, text: "" });
  reader.readAsDataURL(file);
});

// Header: sound + more menu
const soundBtn = $("sound-btn");
const syncSound = () => {
  soundBtn.setAttribute("aria-pressed", state.sound);
  soundBtn.setAttribute("aria-label", state.sound ? "Sound on" : "Sound off");
};
soundBtn.addEventListener("click", () => {
  state.sound = !state.sound;
  syncSound();
  save();
});

const more = document.querySelector(".more");
$("more-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  more.classList.toggle("is-open");
  e.currentTarget.setAttribute("aria-expanded", more.classList.contains("is-open"));
});
document.addEventListener("click", () => more.classList.remove("is-open"));
$("clear-chat").addEventListener("click", () => {
  state.messages = [];
  state.human = false;
  save();
  renderAll();
  welcome();
});
$("email-transcript").addEventListener("click", () =>
  append({ id: Date.now(), type: "system", text: "Transcript sent to your email ✉️", time: Date.now() }),
);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && isOpen()) setOpen(false);
});

// ---------- Init ----------
syncSound();
renderAll();
// A friendly nudge after a few seconds (once per visit)
setTimeout(() => {
  if (isOpen() || sessionStorage.getItem("nimbus-greeted")) return;
  $("greeting").hidden = false;
  setUnread(1);
  sessionStorage.setItem("nimbus-greeted", "1");
}, 2500);
