// Edit these notifications freely
const notifications = [
  { icon: "🚀", text: "<b>Riya</b> deployed <b>orbit-web</b> to production", time: "2 min ago", unread: true },
  { icon: "💬", text: "<b>Kabir</b> replied to your comment on <b>Landing v2</b>", time: "18 min ago", unread: true },
  { icon: "⭐", text: "Your project got <b>12 new stars</b> today", time: "1 h ago", unread: true },
  { icon: "🧾", text: "Invoice <b>#1043</b> was paid", time: "Yesterday", unread: false },
];

const island = document.getElementById("island");
const links = [...document.querySelectorAll("#links a")];
const pill = document.querySelector("#links .pill");
const ringFill = document.getElementById("ring-fill");
const tabLinks = [...document.querySelectorAll(".tabbar a")];
const tabBubble = document.querySelector(".tab-bubble");
const sections = links.map((a) => document.getElementById(a.dataset.section));
let activeId = "home";

// ---------- Sliding pill ----------
const movePill = (link) => {
  pill.style.setProperty("--x", `${link.offsetLeft}px`);
  pill.style.setProperty("--w", `${link.offsetWidth}px`);
};
const activeLink = () => links.find((a) => a.dataset.section === activeId);

links.forEach((a) => {
  a.addEventListener("pointerenter", () => movePill(a)); // preview on hover
});
document.getElementById("links").addEventListener("pointerleave", () => movePill(activeLink()));

const setActive = (id) => {
  if (id === activeId && pill.style.getPropertyValue("--w")) return;
  activeId = id;
  links.forEach((a) => {
    const on = a.dataset.section === id;
    a.classList.toggle("is-active", on);
    on ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current");
  });
  tabLinks.forEach((a, i) => {
    const on = a.dataset.section === id;
    a.classList.toggle("is-active", on);
    if (on) tabBubble.style.setProperty("--i", i);
  });
  movePill(activeLink());
};

// ---------- Scroll: compact island, progress ring, scrollspy ----------
let ticking = false;
const onScroll = () => {
  ticking = false;
  const max = document.documentElement.scrollHeight - innerHeight;
  const progress = max > 0 ? scrollY / max : 0;
  ringFill.style.setProperty("--progress", progress.toFixed(4));
  island.classList.toggle("is-compact", scrollY > 40);

  // The section whose top has passed 40% of the screen is the active one
  const line = innerHeight * 0.4;
  let current = sections[0].id;
  for (const s of sections) if (s.getBoundingClientRect().top <= line) current = s.id;
  if (progress > 0.995) current = sections.at(-1).id;
  setActive(current);
};
window.addEventListener("scroll", () => {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(onScroll);
  }
}, { passive: true });
// Re-measure after the compact transition / font load / resize
island.addEventListener("transitionend", () => movePill(activeLink()));
window.addEventListener("resize", onScroll);
document.fonts?.ready.then(() => movePill(activeLink()));

// ---------- Dropdowns ----------
const pops = [...document.querySelectorAll(".pop")];
const closePops = (except) =>
  pops.forEach((p) => {
    if (p === except) return;
    p.classList.remove("is-open");
    p.querySelector("button").setAttribute("aria-expanded", "false");
  });

pops.forEach((pop) => {
  const btn = pop.querySelector("button");
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = !pop.classList.contains("is-open");
    closePops(pop);
    pop.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", open);
  });
  pop.querySelector(".panel").addEventListener("click", (e) => e.stopPropagation());
});
document.addEventListener("click", () => closePops());
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const open = pops.find((p) => p.classList.contains("is-open"));
  if (open) {
    closePops();
    open.querySelector("button").focus();
  }
});

// ---------- Notifications ----------
const notesEl = document.getElementById("notes");
const badge = document.getElementById("badge");
const bellBtn = document.getElementById("bell-btn");

const renderNotes = () => {
  notesEl.innerHTML = notifications
    .map((n, i) => `<li class="note ${n.unread ? "unread" : ""}" data-i="${i}">
      <span class="n-av" aria-hidden="true">${n.icon}</span>
      <div><p>${n.text}</p><small>${n.time}</small></div></li>`)
    .join("");
  const unread = notifications.filter((n) => n.unread).length;
  badge.textContent = unread;
  badge.classList.toggle("is-empty", unread === 0);
  bellBtn.setAttribute("aria-label", unread ? `Notifications, ${unread} unread` : "Notifications");
};

notesEl.addEventListener("click", (e) => {
  const li = e.target.closest(".note");
  if (!li) return;
  notifications[li.dataset.i].unread = false;
  renderNotes();
});
document.getElementById("mark-all").addEventListener("click", () => {
  notifications.forEach((n) => (n.unread = false));
  renderNotes();
});

// A new notification "arrives" a few seconds after load
setTimeout(() => {
  notifications.unshift({ icon: "🎉", text: "<b>Welcome!</b> Your workspace is ready.", time: "Just now", unread: true });
  renderNotes();
  bellBtn.classList.remove("ring-it");
  void bellBtn.offsetWidth;
  bellBtn.classList.add("ring-it");
}, 4000);

// ---------- Status (online / away / busy) ----------
const statusDot = document.getElementById("status-dot");
document.querySelectorAll(".status-row button").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".status-row button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    statusDot.dataset.status = b.dataset.status;
  });
});

renderNotes();
setActive("home");
onScroll();
