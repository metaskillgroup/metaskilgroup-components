// ---------- Data (edit freely) ----------
const ICON = {
  bolt: '<path d="M13 3L4 14h7l-1 7 9-11h-7z"/>',
  plug: '<path d="M9 7V3M15 7V3M6 7h12v4a6 6 0 0 1-12 0zM12 17v4"/>',
  chart: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>',
  form: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
};

const megaItems = [
  { icon: "bolt", title: "Automations", text: "Trigger anything, from anywhere" },
  { icon: "plug", title: "Integrations", text: "200+ apps, connected in a click" },
  { icon: "chart", title: "Analytics", text: "See what's working in real time" },
  { icon: "form", title: "Forms", text: "Collect data that flows straight in" },
  { icon: "spark", title: "AI Assistant", text: "Write, summarise and build faster" },
  { icon: "shield", title: "Security", text: "SOC 2, SSO and audit logs" },
];

// Command palette entries: group, emoji, label, hint
const commands = [
  { group: "Pages", icon: "🏠", label: "Dashboard", hint: "Go to" },
  { group: "Pages", icon: "💳", label: "Pricing", hint: "Go to" },
  { group: "Pages", icon: "📚", label: "Documentation", hint: "Go to" },
  { group: "Pages", icon: "📝", label: "Changelog", hint: "Go to" },
  { group: "Pages", icon: "✍️", label: "Blog", hint: "Go to" },
  { group: "Actions", icon: "⚡", label: "Create new workflow", hint: "Ctrl N" },
  { group: "Actions", icon: "👥", label: "Invite a teammate", hint: "Action" },
  { group: "Actions", icon: "🔗", label: "Copy link to this page", hint: "Action" },
  { group: "Help", icon: "💬", label: "Contact support", hint: "Help" },
  { group: "Help", icon: "⌨️", label: "Keyboard shortcuts", hint: "Help" },
];

const header = document.getElementById("header");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } },
};

const toast = (() => {
  const el = document.getElementById("toast");
  let t;
  return (msg) => {
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(t);
    t = setTimeout(() => el.classList.remove("show"), 2200);
  };
})();

// ---------- Mega menu content ----------
document.getElementById("mega-grid").innerHTML = megaItems
  .map(
    (m) => `<a href="#" class="mega-item">
      <span class="mi-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${ICON[m.icon]}</svg></span>
      <b>${m.title}</b><span>${m.text}</span>
    </a>`,
  )
  .join("");

// ---------- Announcement bar ----------
const announce = document.getElementById("announce");
if (store.get("announce-dismissed") === "3.0") announce.classList.add("is-hidden");
announce.querySelector(".announce-close").addEventListener("click", () => {
  announce.classList.add("is-hidden");
  store.set("announce-dismissed", "3.0");
});

// ---------- Dropdown menus (hover intent + click + keyboard) ----------
const menus = [...document.querySelectorAll(".has-menu")];
let openTimer;
let closeTimer;

const setOpen = (li, open) => {
  li.classList.toggle("is-open", open);
  li.querySelector(".nav-link").setAttribute("aria-expanded", open);
};
const closeAll = (except) => menus.forEach((li) => li !== except && setOpen(li, false));

menus.forEach((li) => {
  const btn = li.querySelector(".nav-link");
  const links = () => [...li.querySelectorAll(".menu a")];

  li.addEventListener("pointerenter", (e) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(closeTimer);
    // Small delay so menus don't flicker when the mouse just passes by
    openTimer = setTimeout(() => {
      closeAll(li);
      setOpen(li, true);
    }, menus.some((m) => m.classList.contains("is-open")) ? 0 : 90);
  });
  li.addEventListener("pointerleave", (e) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(openTimer);
    closeTimer = setTimeout(() => setOpen(li, false), 180);
  });

  btn.addEventListener("click", () => {
    const open = !li.classList.contains("is-open");
    closeAll(li);
    setOpen(li, open);
  });

  btn.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      closeAll(li);
      setOpen(li, true);
      links()[0]?.focus();
    }
  });

  li.querySelector(".menu").addEventListener("keydown", (e) => {
    const items = links();
    const i = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    if (e.key === "Escape") { setOpen(li, false); btn.focus(); }
  });

  // Close when focus leaves the whole item (tabbing away)
  li.addEventListener("focusout", (e) => {
    if (!li.contains(e.relatedTarget)) setOpen(li, false);
  });
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".has-menu")) closeAll();
});

// Glide highlight behind the hovered nav link
const nav = document.querySelector(".nav");
const hover = document.querySelector(".nav-hover");
nav.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("pointerenter", () => {
    const navBox = nav.getBoundingClientRect();
    const box = link.getBoundingClientRect();
    hover.style.setProperty("--x", `${box.left - navBox.left}px`);
    hover.style.setProperty("--w", `${box.width}px`);
    hover.style.height = `${box.height}px`;
    hover.style.top = `${box.top - navBox.top}px`;
    hover.classList.add("is-on");
  });
});
nav.addEventListener("pointerleave", () => hover.classList.remove("is-on"));

// ---------- Scroll behaviour: solid after scrolling, hide on down, show on up ----------
let lastY = window.scrollY;
let ticking = false;
const onScroll = () => {
  ticking = false;
  const y = window.scrollY;
  const anyOpen = menus.some((m) => m.classList.contains("is-open")) || drawer.classList.contains("is-open");
  header.classList.toggle("is-scrolled", y > 10);
  if (!anyOpen && Math.abs(y - lastY) > 6) {
    header.classList.toggle("is-hidden", y > lastY && y > 160);
    lastY = y;
  }
};
window.addEventListener("scroll", () => {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(onScroll);
  }
}, { passive: true });

// ---------- Mobile drawer ----------
const burger = document.getElementById("burger");
const drawer = document.getElementById("drawer");

// Build accordion sections from the desktop menus — one source of truth
document.getElementById("drawer-acc").innerHTML = menus
  .map((li, i) => {
    const label = li.querySelector(".nav-link").textContent.trim();
    const items = [...li.querySelectorAll(".menu a")]
      .map((a) => `<a href="#">${(a.querySelector("b, strong") ?? a).textContent.trim()}</a>`)
      .join("");
    return `<button type="button" class="acc-btn" aria-expanded="false" aria-controls="acc-${i}">${label}
      <svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
      <div class="acc-panel" id="acc-${i}"><div>${items}</div></div>`;
  })
  .join("");

document.querySelectorAll(".acc-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") !== "true";
    btn.setAttribute("aria-expanded", open);
    btn.querySelector(".chev").style.transform = open ? "rotate(180deg)" : "";
  });
});

const setDrawer = (open) => {
  // The drawer starts right under the header, wherever it is right now
  drawer.style.top = `${Math.max(header.getBoundingClientRect().bottom, 0)}px`;
  drawer.classList.toggle("is-open", open);
  drawer.setAttribute("aria-hidden", !open);
  burger.setAttribute("aria-expanded", open);
  burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  document.body.classList.toggle("no-scroll", open);
};
burger.addEventListener("click", () => setDrawer(!drawer.classList.contains("is-open")));
window.addEventListener("resize", () => window.innerWidth > 900 && setDrawer(false));

// ---------- Command palette ----------
const palette = document.getElementById("palette");
const input = document.getElementById("palette-input");
const list = document.getElementById("palette-list");
const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
document.getElementById("kbd-hint").textContent = isMac ? "⌘ K" : "Ctrl K";

let results = [];
let active = 0;

// Fuzzy match: every typed letter must appear in order. Returns matched indexes.
const fuzzy = (text, query) => {
  const hits = [];
  let from = 0;
  for (const ch of query.toLowerCase()) {
    const i = text.toLowerCase().indexOf(ch, from);
    if (i === -1) return null;
    hits.push(i);
    from = i + 1;
  }
  return hits;
};

const highlight = (text, hits) =>
  [...text].map((ch, i) => (hits.includes(i) ? `<mark>${ch}</mark>` : ch)).join("");

const recent = () => JSON.parse(store.get("palette-recent") || "[]");

const renderPalette = () => {
  const q = input.value.trim();
  if (q) {
    results = commands
      .map((c) => ({ ...c, hits: fuzzy(c.label, q) }))
      .filter((c) => c.hits)
      // Tighter matches (letters closer together) first
      .sort((a, b) => a.hits.at(-1) - a.hits[0] - (b.hits.at(-1) - b.hits[0]));
  } else {
    const rec = recent()
      .map((label) => commands.find((c) => c.label === label))
      .filter(Boolean)
      .map((c) => ({ ...c, group: "Recent", hits: [] }));
    results = [...rec, ...commands.map((c) => ({ ...c, hits: [] }))];
  }
  active = Math.min(active, Math.max(results.length - 1, 0));

  if (!results.length) {
    list.innerHTML = `<li class="palette-empty">No results for “${q.replace(/</g, "&lt;")}”</li>`;
    return;
  }
  let group = "";
  list.innerHTML = results
    .map((c, i) => {
      const heading = c.group !== group ? `<li class="palette-group" role="presentation">${(group = c.group)}</li>` : "";
      return `${heading}<li class="palette-item" role="option" id="opt-${i}" data-i="${i}" aria-selected="${i === active}">
        <span class="pi-icon" aria-hidden="true">${c.icon}</span><span>${highlight(c.label, c.hits)}</span><small>${c.hint}</small></li>`;
    })
    .join("");
  input.setAttribute("aria-activedescendant", `opt-${active}`);
};

const setActive = (i) => {
  active = (i + results.length) % results.length;
  list.querySelectorAll(".palette-item").forEach((el) => el.setAttribute("aria-selected", Number(el.dataset.i) === active));
  list.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  input.setAttribute("aria-activedescendant", `opt-${active}`);
};

const runCommand = (c) => {
  if (!c) return;
  store.set("palette-recent", JSON.stringify([c.label, ...recent().filter((l) => l !== c.label)].slice(0, 3)));
  palette.close();
  toast(`${c.icon}  ${c.label}`);
};

const openPalette = () => {
  if (palette.open) return;
  setDrawer(false);
  closeAll();
  input.value = "";
  active = 0;
  renderPalette();
  palette.showModal();
  input.focus();
};

document.getElementById("open-palette").addEventListener("click", openPalette);
document.querySelectorAll("[data-open-palette]").forEach((b) => b.addEventListener("click", openPalette));
input.addEventListener("input", () => {
  active = 0;
  renderPalette();
});
input.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") { e.preventDefault(); setActive(active + 1); }
  if (e.key === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
  if (e.key === "Enter") { e.preventDefault(); runCommand(results[active]); }
});
list.addEventListener("pointermove", (e) => {
  const item = e.target.closest(".palette-item");
  if (item && Number(item.dataset.i) !== active) setActive(Number(item.dataset.i));
});
list.addEventListener("click", (e) => {
  const item = e.target.closest(".palette-item");
  if (item) runCommand(results[Number(item.dataset.i)]);
});
palette.addEventListener("click", (e) => e.target === palette && palette.close());

// Global shortcuts: Ctrl/⌘ K for the palette, Esc closes menus and the drawer
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    palette.open ? palette.close() : openPalette();
  }
  if (e.key === "Escape") {
    closeAll();
    if (drawer.classList.contains("is-open")) {
      setDrawer(false);
      burger.focus();
    }
  }
});

if (reduceMotion) header.style.transition = "none";
