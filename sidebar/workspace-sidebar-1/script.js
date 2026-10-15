// ---------- Data (edit freely) ----------
const ICONS = {
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  inbox: '<path d="M3 13l3-8h12l3 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3 13h5l1 3h6l1-3h5"/>',
  check: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 12l3 3 5-6"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  chart: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 7M22 20a6 6 0 0 0-4-5.6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01"/>',
  caret: '<path d="M9 6l6 6-6 6"/>',
};

const nav = [
  {
    items: [
      { id: "home", label: "Home", icon: "home", sub: "Your workspace at a glance." },
      { id: "inbox", label: "Inbox", icon: "inbox", badge: 12, sub: "12 unread conversations." },
      { id: "tasks", label: "My tasks", icon: "check", badge: 3, sub: "3 tasks due this week." },
    ],
  },
  {
    title: "Workspace",
    items: [
      {
        id: "projects", label: "Projects", icon: "folder",
        children: [
          { id: "p-web", label: "Website redesign" },
          { id: "p-app", label: "Mobile app" },
          { id: "p-mkt", label: "Marketing site" },
        ],
      },
      { id: "calendar", label: "Calendar", icon: "calendar", sub: "Meetings, launches and deadlines." },
      {
        id: "reports", label: "Reports", icon: "chart",
        children: [
          { id: "r-overview", label: "Overview" },
          { id: "r-revenue", label: "Revenue" },
          { id: "r-retention", label: "Retention" },
        ],
      },
      { id: "team", label: "Team", icon: "users", sub: "12 members, 3 guests." },
    ],
  },
  {
    title: "Favorites",
    favorites: true,
    items: [
      { id: "f-q4", label: "Q4 launch plan", color: "#f59e0b" },
      { id: "f-brand", label: "Brand guidelines", color: "#10b981" },
      { id: "f-hiring", label: "Hiring pipeline", color: "#ef4444" },
      { id: "f-okr", label: "Team OKRs", color: "#3b82f6" },
    ],
  },
  {
    items: [
      { id: "settings", label: "Settings", icon: "settings", sub: "Workspace, billing and members." },
      { id: "help", label: "Help & support", icon: "help", sub: "Docs, chat and status." },
    ],
  },
];

const workspaces = [
  { name: "Acme Inc", plan: "Pro · 12 members", letter: "A", bg: "linear-gradient(135deg, #5b5bd6, #a855f7)" },
  { name: "Side Project", plan: "Free · 2 members", letter: "S", bg: "linear-gradient(135deg, #10b981, #06b6d4)" },
  { name: "Freelance", plan: "Pro · just you", letter: "F", bg: "linear-gradient(135deg, #f59e0b, #ef4444)" },
];

const STORAGE = { used: 7.4, total: 10 };

// ---------- Helpers ----------
const $ = (id) => document.getElementById(id);
const sidebar = $("sidebar");
const navEl = $("sb-nav");
const indicator = navEl.querySelector(".indicator");
const mobile = window.matchMedia("(max-width: 820px)");
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } },
};
const svg = (name, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

// Restore saved order of favorites
const favSection = nav.find((s) => s.favorites);
const savedOrder = store.get("sb-fav-order", null);
if (savedOrder) favSection.items.sort((a, b) => savedOrder.indexOf(a.id) - savedOrder.indexOf(b.id));

const allItems = () => nav.flatMap((s) => s.items.flatMap((i) => [i, ...(i.children ?? []).map((c) => ({ ...c, parent: i }))]));
const findItem = (id) => allItems().find((i) => i.id === id);

let activeId = store.get("sb-active", "home");
let collapsed = store.get("sb-collapsed", false);
let query = "";

// ---------- Render navigation ----------
const linkHTML = (item) => {
  const lead = item.color ? `<span class="fav-dot"><i style="--c:${item.color}"></i></span>` : svg(item.icon);
  const badge = item.badge ? `<span class="nav-badge">${item.badge}</span><span class="badge-dot"></span>` : "";
  const label = query ? item.label.replace(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"), "<mark>$1</mark>") : item.label;
  if (item.children) {
    const open = store.get(`sb-open-${item.id}`, false) || item.children.some((c) => c.id === activeId) || Boolean(query);
    return `<button type="button" class="nav-link" data-id="${item.id}" data-label="${item.label}" aria-expanded="${open}">${lead}<span class="label">${label}</span>${svg("caret", "caret")}</button>
      <div class="sub"><ul>${item.children.map((c) => `<li><button type="button" class="nav-link" data-id="${c.id}" data-label="${c.label}">${matchLabel(c.label)}</button></li>`).join("")}</ul></div>`;
  }
  return `<button type="button" class="nav-link" data-id="${item.id}" data-label="${item.label}">${lead}<span class="label">${label}</span>${badge}</button>`;
};
const matchLabel = (text) =>
  `<span class="label">${query ? text.replace(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"), "<mark>$1</mark>") : text}</span>`;

const matches = (item) => {
  if (!query) return true;
  const q = query.toLowerCase();
  return item.label.toLowerCase().includes(q) || (item.children ?? []).some((c) => c.label.toLowerCase().includes(q));
};

const renderNav = () => {
  const html = nav
    .map((section) => {
      const items = section.items.filter(matches);
      if (!items.length) return "";
      const title = section.title ? `<p class="nav-title">${section.title}${section.favorites ? '<span class="drag-hint">drag to sort</span>' : ""}</p>` : "";
      return `<div class="nav-section">${title}<ul class="nav-list">${items
        .map((i) => `<li class="${section.favorites ? "fav-item" : ""}" ${section.favorites && !query ? `draggable="true" data-fav="${i.id}"` : ""}>${linkHTML(i)}</li>`)
        .join("")}</ul></div>`;
    })
    .join("");
  navEl.innerHTML = `<span class="indicator" aria-hidden="true"></span>${html || '<p class="nav-empty">No menu items match.</p>'}`;
  markActive();
};

// ---------- Active item + sliding indicator ----------
const placeIndicator = () => {
  const ind = navEl.querySelector(".indicator");
  const link = navEl.querySelector(".nav-link.is-active");
  // A child inside a closed group (or the rail) highlights its parent instead
  let target = link;
  if (link && (link.closest(".sub") && (collapsed || link.closest(".sub").previousElementSibling.getAttribute("aria-expanded") !== "true"))) {
    target = link.closest("li").parentElement.closest("li").querySelector(":scope > .nav-link");
  }
  if (!target) return (ind.style.opacity = 0);
  ind.style.opacity = 1;
  // offsetTop is already measured from the nav (its nearest positioned parent)
  ind.style.setProperty("--y", `${target.offsetTop}px`);
  ind.style.setProperty("--h", `${target.offsetHeight}px`);
};

const markActive = () => {
  navEl.querySelectorAll(".nav-link").forEach((l) => {
    const on = l.dataset.id === activeId;
    l.classList.toggle("is-active", on);
    on ? l.setAttribute("aria-current", "page") : l.removeAttribute("aria-current");
  });
  placeIndicator();
};

const updateMain = () => {
  const item = findItem(activeId) ?? findItem("home");
  $("page-title").textContent = item.label;
  $("page-sub").textContent = item.sub ?? (item.parent ? `Part of ${item.parent.label}.` : "A favorite page.");
  $("crumbs").innerHTML = `${$("ws-name").textContent} <span>/</span> ${item.parent ? `${item.parent.label} <span>/</span> ` : ""}<b>${item.label}</b>`;
  const h1 = $("page-title");
  h1.style.animation = "none";
  void h1.offsetWidth;
  h1.style.animation = "";
};

const select = (id) => {
  activeId = id;
  store.set("sb-active", id);
  markActive();
  updateMain();
  if (mobile.matches) setDrawer(false);
};

navEl.addEventListener("click", (e) => {
  const link = e.target.closest(".nav-link");
  if (!link) return;
  const item = findItem(link.dataset.id);
  if (item?.children) {
    if (collapsed) return openFlyout(link, item); // rail: show submenu to the side
    const open = link.getAttribute("aria-expanded") !== "true";
    link.setAttribute("aria-expanded", open);
    store.set(`sb-open-${item.id}`, open);
    return;
  }
  select(link.dataset.id);
});

// Re-place the indicator whenever groups open/close or the sidebar resizes
new ResizeObserver(placeIndicator).observe(navEl);
navEl.addEventListener("transitionend", placeIndicator);

// ---------- Search ----------
const search = $("nav-search");
search.addEventListener("input", () => {
  query = search.value.trim();
  renderNav();
});
search.addEventListener("keydown", (e) => {
  if (e.key === "Enter") navEl.querySelector(".nav-link:not([aria-expanded])")?.click();
  if (e.key === "Escape") {
    search.value = "";
    query = "";
    renderNav();
    search.blur();
  }
});
document.querySelector(".sb-search").addEventListener("click", () => {
  if (collapsed) setCollapsed(false);
  search.focus();
});

// ---------- Favorites drag & drop ----------
let dragId = null;
navEl.addEventListener("dragstart", (e) => {
  const li = e.target.closest("[data-fav]");
  if (!li) return;
  dragId = li.dataset.fav;
  li.classList.add("is-dragging");
  e.dataTransfer.effectAllowed = "move";
});
navEl.addEventListener("dragover", (e) => {
  const li = e.target.closest("[data-fav]");
  if (!li || !dragId) return;
  e.preventDefault();
  navEl.querySelectorAll(".drop-before").forEach((x) => x.classList.remove("drop-before"));
  li.classList.add("drop-before");
});
navEl.addEventListener("drop", (e) => {
  const li = e.target.closest("[data-fav]");
  if (!li || !dragId) return;
  e.preventDefault();
  const items = favSection.items;
  const from = items.findIndex((i) => i.id === dragId);
  const [moved] = items.splice(from, 1);
  items.splice(items.findIndex((i) => i.id === li.dataset.fav), 0, moved);
  store.set("sb-fav-order", items.map((i) => i.id));
  renderNav();
});
navEl.addEventListener("dragend", () => {
  dragId = null;
  navEl.querySelectorAll(".is-dragging, .drop-before").forEach((x) => x.classList.remove("is-dragging", "drop-before"));
});

// ---------- Collapse to an icon rail ----------
const collapseBtn = $("collapse-btn");
const setCollapsed = (value) => {
  collapsed = value;
  store.set("sb-collapsed", value);
  sidebar.classList.toggle("is-collapsed", value && !mobile.matches);
  collapseBtn.setAttribute("aria-pressed", value);
  collapseBtn.setAttribute("aria-label", value ? "Expand sidebar ( [ )" : "Collapse sidebar ( [ )");
  hideFloating();
  setTimeout(placeIndicator, 360);
};
collapseBtn.addEventListener("click", () => setCollapsed(!collapsed));

// Tooltip + flyout for the rail
const tooltip = $("tooltip");
const flyout = $("flyout");
let flyoutTimer;

const placeBeside = (el, anchor) => {
  const r = anchor.getBoundingClientRect();
  el.style.left = `${sidebar.getBoundingClientRect().right + 8}px`;
  el.style.top = `${Math.min(r.top + r.height / 2 - el.offsetHeight / 2, innerHeight - el.offsetHeight - 8)}px`;
};

const openFlyout = (anchor, item) => {
  clearTimeout(flyoutTimer);
  tooltip.classList.remove("is-on");
  flyout.innerHTML = `<b>${item.label}</b>${item.children
    .map((c) => `<button type="button" data-id="${c.id}" class="${c.id === activeId ? "is-active" : ""}">${c.label}</button>`)
    .join("")}`;
  placeBeside(flyout, anchor);
  flyout.classList.add("is-on");
};
const hideFloating = () => {
  tooltip.classList.remove("is-on");
  flyout.classList.remove("is-on");
};

navEl.addEventListener("pointerover", (e) => {
  if (!collapsed || mobile.matches) return;
  const link = e.target.closest(".nav-link");
  if (!link) return;
  const item = findItem(link.dataset.id);
  if (item?.children) return openFlyout(link, item);
  flyout.classList.remove("is-on");
  tooltip.textContent = link.dataset.label + (item?.badge ? ` · ${item.badge}` : "");
  placeBeside(tooltip, link);
  tooltip.classList.add("is-on");
});
navEl.addEventListener("pointerleave", () => {
  tooltip.classList.remove("is-on");
  flyoutTimer = setTimeout(() => flyout.classList.remove("is-on"), 250);
});
flyout.addEventListener("pointerenter", () => clearTimeout(flyoutTimer));
flyout.addEventListener("pointerleave", () => flyout.classList.remove("is-on"));
flyout.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  select(b.dataset.id);
  flyout.classList.remove("is-on");
});

// ---------- Workspace switcher ----------
const wsWrap = document.querySelector(".ws");
const wsMenu = $("ws-menu");
let wsIndex = store.get("sb-ws", 0);
const applyWorkspace = () => {
  const w = workspaces[wsIndex];
  $("ws-name").textContent = w.name;
  $("ws-plan").textContent = w.plan;
  $("ws-logo").textContent = w.letter;
  $("ws-logo").style.setProperty("--ws", w.bg);
  wsMenu.innerHTML = `<p>Workspaces</p>${workspaces
    .map((x, i) => `<button type="button" role="menuitemradio" aria-checked="${i === wsIndex}" data-ws="${i}"><span class="mini" style="background:${x.bg}">${x.letter}</span>${x.name}</button>`)
    .join("")}<hr /><a href="#" role="menuitem">＋ Create workspace</a><a href="#" role="menuitem">⚙ Workspace settings</a>`;
  updateMain();
};
wsMenu.addEventListener("click", (e) => {
  const b = e.target.closest("[data-ws]");
  if (!b) return;
  wsIndex = Number(b.dataset.ws);
  store.set("sb-ws", wsIndex);
  applyWorkspace();
  toggleMenu(wsWrap, false);
});

// ---------- User menu (status) ----------
const userWrap = document.querySelector(".user");
document.querySelectorAll(".user-menu [data-status]").forEach((b) =>
  b.addEventListener("click", () => {
    document.querySelectorAll(".user-menu [data-status]").forEach((x) => x.setAttribute("aria-checked", x === b));
    $("u-status").dataset.status = b.dataset.status;
    toggleMenu(userWrap, false);
  }),
);

const toggleMenu = (wrap, open) => {
  wrap.classList.toggle("is-open", open);
  wrap.querySelector("button").setAttribute("aria-expanded", open);
};
[[wsWrap, $("ws-btn")], [userWrap, $("user-btn")]].forEach(([wrap, btn]) =>
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = !wrap.classList.contains("is-open");
    toggleMenu(wsWrap, false);
    toggleMenu(userWrap, false);
    toggleMenu(wrap, open);
  }),
);
document.addEventListener("click", (e) => {
  if (!e.target.closest(".ws, .user")) {
    toggleMenu(wsWrap, false);
    toggleMenu(userWrap, false);
  }
});

// ---------- Mobile drawer (with swipe to close) ----------
const menuBtn = $("menu-btn");
const setDrawer = (open) => {
  sidebar.classList.toggle("is-open", open);
  menuBtn.setAttribute("aria-expanded", open);
  document.body.style.overflow = open ? "hidden" : "";
};
menuBtn.addEventListener("click", () => setDrawer(true));
$("backdrop").addEventListener("click", () => setDrawer(false));

let startX = null;
sidebar.addEventListener("pointerdown", (e) => {
  if (!mobile.matches || e.pointerType === "mouse") return;
  startX = e.clientX;
});
sidebar.addEventListener("pointermove", (e) => {
  if (startX === null) return;
  const dx = Math.min(0, e.clientX - startX);
  sidebar.classList.add("is-dragging");
  sidebar.style.setProperty("--drag", `${dx}px`);
});
const endSwipe = (e) => {
  if (startX === null) return;
  const dx = e.clientX - startX;
  startX = null;
  sidebar.classList.remove("is-dragging");
  sidebar.style.removeProperty("--drag");
  if (dx < -70) setDrawer(false);
};
sidebar.addEventListener("pointerup", endSwipe);
sidebar.addEventListener("pointercancel", endSwipe);

mobile.addEventListener("change", () => {
  setDrawer(false);
  setCollapsed(collapsed);
});

// ---------- Keyboard shortcuts: [ to collapse, / to search, Esc to close ----------
document.addEventListener("keydown", (e) => {
  const typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
  if (e.key === "[" && !typing && !mobile.matches) setCollapsed(!collapsed);
  if (e.key === "/" && !typing) {
    e.preventDefault();
    if (mobile.matches) setDrawer(true);
    if (collapsed) setCollapsed(false);
    search.focus();
  }
  if (e.key === "Escape") {
    toggleMenu(wsWrap, false);
    toggleMenu(userWrap, false);
    hideFloating();
    if (sidebar.classList.contains("is-open")) setDrawer(false);
  }
});

// ---------- Init ----------
$("storage-text").textContent = `${STORAGE.used} of ${STORAGE.total} GB`;
requestAnimationFrame(() => ($("storage-bar").style.width = `${(STORAGE.used / STORAGE.total) * 100}%`));
renderNav();
applyWorkspace();
setCollapsed(collapsed);
document.fonts?.ready.then(placeIndicator);
