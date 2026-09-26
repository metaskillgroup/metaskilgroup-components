// =====================================================
// Kanban Board — drag & drop with pointer events
// (works with mouse and touch), saved in localStorage
// =====================================================

const STORAGE_KEY = "metaskill-kanban-v1";

const COLUMNS = [
  { id: "backlog", title: "Backlog", color: "#8f8d87" },
  { id: "todo", title: "To do", color: "#3b82f6" },
  { id: "progress", title: "In progress", color: "#f5a524", limit: 3 },
  { id: "done", title: "Done", color: "#22c55e" },
];

const LABELS = {
  design: { name: "Design", color: "#d946ef" },
  frontend: { name: "Frontend", color: "#6d5dfc" },
  backend: { name: "Backend", color: "#0ea5e9" },
  marketing: { name: "Marketing", color: "#f97316" },
  bug: { name: "Bug", color: "#e5484d" },
};

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const demoTasks = () => [
  { id: 1, col: "backlog", title: "Competitor pricing research", desc: "Compare the top 5 competitors and summarise the findings.", label: "marketing", priority: "low", due: daysFromNow(12), who: "PL" },
  { id: 2, col: "backlog", title: "Dark mode for settings page", desc: "", label: "frontend", priority: "low", due: "", who: "RS" },
  { id: 3, col: "todo", title: "Design onboarding screens", desc: "Three steps: welcome, connect data, invite team.", label: "design", priority: "high", due: daysFromNow(3), who: "AK" },
  { id: 4, col: "todo", title: "Set up Stripe webhooks", desc: "Handle subscription created, updated and cancelled.", label: "backend", priority: "medium", due: daysFromNow(5), who: "MJ" },
  { id: 5, col: "todo", title: "Write launch blog post", desc: "", label: "marketing", priority: "medium", due: daysFromNow(8), who: "PL" },
  { id: 6, col: "progress", title: "Landing page hero section", desc: "Animated mockup + new headline copy.", label: "frontend", priority: "high", due: daysFromNow(1), who: "RS" },
  { id: 7, col: "progress", title: "Fix login redirect loop", desc: "Happens on Safari when cookies are blocked.", label: "bug", priority: "high", due: daysFromNow(-1), who: "MJ" },
  { id: 8, col: "done", title: "Brand colour palette", desc: "", label: "design", priority: "medium", due: daysFromNow(-4), who: "AK" },
  { id: 9, col: "done", title: "Database schema v2", desc: "Migrations tested on staging.", label: "backend", priority: "medium", due: daysFromNow(-6), who: "MJ" },
];

// ---------- State ----------
const load = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) return saved;
  } catch {
    /* storage blocked or corrupt — fall back to demo data */
  }
  return demoTasks();
};

let tasks = load();
let filterText = "";
let filterLabel = null;

const save = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    /* ignore — the board still works without persistence */
  }
};

// ---------- Elements ----------
const board = document.querySelector(".board");
const searchInput = document.querySelector(".search input");
const labelFilter = document.querySelector(".label-filter");
const totalCount = document.querySelector(".total-count");
const backdrop = document.querySelector(".modal-backdrop");
const modal = document.querySelector(".modal");
const toast = document.querySelector(".toast");

const escapeHTML = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// ---------- Rendering ----------
const cardHTML = (t) => {
  const label = LABELS[t.label];
  const hue = [...t.who].reduce((s, c) => s + c.charCodeAt(0) * 37, 0) % 360;
  const today = new Date().toISOString().slice(0, 10);
  const overdue = t.due && t.due < today && t.col !== "done";
  const dueText = t.due ? new Date(t.due + "T00:00").toLocaleDateString("en", { month: "short", day: "numeric" }) : "";

  return `
    <article class="card" data-id="${t.id}" tabindex="0" aria-label="${escapeHTML(t.title)}">
      <div class="card-top">
        <span class="tag" style="--c: ${label.color}">${label.name}</span>
        <span class="priority ${t.priority}" title="${t.priority} priority"><i></i><i></i><i></i></span>
      </div>
      <h3>${escapeHTML(t.title)}</h3>
      ${t.desc ? `<p>${escapeHTML(t.desc)}</p>` : ""}
      <div class="card-foot">
        <span class="due ${overdue ? "overdue" : ""}">${dueText ? `📅 ${dueText}${overdue ? " · overdue" : ""}` : ""}</span>
        <span class="avatar" style="--h: ${hue}">${t.who}</span>
      </div>
    </article>`;
};

const matchesFilter = (t) => {
  const text = `${t.title} ${t.desc}`.toLowerCase();
  return (!filterText || text.includes(filterText)) && (!filterLabel || t.label === filterLabel);
};

const render = () => {
  board.innerHTML = COLUMNS.map((col) => {
    const colTasks = tasks.filter((t) => t.col === col.id);
    const overLimit = col.limit && colTasks.length > col.limit;
    return `
      <section class="column ${overLimit ? "over-limit" : ""}" data-col="${col.id}">
        <header class="col-head">
          <span class="col-dot" style="--c: ${col.color}"></span>
          <h2>${col.title}</h2>
          <span class="col-count">${colTasks.length}</span>
          ${col.limit ? `<span class="col-limit">WIP limit ${col.limit}</span>` : ""}
        </header>
        <div class="cards">${colTasks.map(cardHTML).join("")}</div>
        <button class="add-btn" type="button">＋ Add a card</button>
        <form class="add-form">
          <textarea rows="2" placeholder="What needs to be done?" maxlength="80"></textarea>
          <div class="add-actions">
            <button class="btn-primary" type="submit">Add card</button>
            <button class="btn-ghost cancel-add" type="button">Cancel</button>
          </div>
        </form>
      </section>`;
  }).join("");

  applyFilter();
  totalCount.textContent = tasks.length;
};

const applyFilter = () => {
  board.querySelectorAll(".card").forEach((card) => {
    const task = tasks.find((t) => t.id === Number(card.dataset.id));
    card.classList.toggle("hidden", !matchesFilter(task));
  });
};

// ---------- Filters ----------
labelFilter.innerHTML = Object.entries(LABELS)
  .map(([key, l]) => `<button class="label-chip" data-label="${key}" style="--c: ${l.color}">${l.name}</button>`)
  .join("");

labelFilter.addEventListener("click", (e) => {
  const chip = e.target.closest(".label-chip");
  if (!chip) return;
  filterLabel = filterLabel === chip.dataset.label ? null : chip.dataset.label;
  labelFilter.querySelectorAll(".label-chip").forEach((c) => c.classList.toggle("on", c.dataset.label === filterLabel));
  labelFilter.classList.toggle("filtering", !!filterLabel);
  applyFilter();
});

searchInput.addEventListener("input", () => {
  filterText = searchInput.value.trim().toLowerCase();
  applyFilter();
});

// ---------- Add card ----------
board.addEventListener("click", (e) => {
  const column = e.target.closest(".column");
  if (!column) return;

  if (e.target.closest(".add-btn")) {
    board.querySelectorAll(".column.adding").forEach((c) => c.classList.remove("adding"));
    column.classList.add("adding");
    column.querySelector(".add-form textarea").focus();
  }
  if (e.target.closest(".cancel-add")) column.classList.remove("adding");
});

board.addEventListener("submit", (e) => {
  e.preventDefault();
  const column = e.target.closest(".column");
  const textarea = e.target.querySelector("textarea");
  const title = textarea.value.trim();
  if (!title) return textarea.focus();

  tasks.push({
    id: Date.now(),
    col: column.dataset.col,
    title,
    desc: "",
    label: filterLabel || "frontend",
    priority: "medium",
    due: "",
    who: "ME",
  });
  save();
  render();
  // Keep the form open for adding several cards in a row
  const col = board.querySelector(`[data-col="${column.dataset.col}"]`);
  col.classList.add("adding");
  col.querySelector(".add-form textarea").focus();
});

// Enter submits, Shift+Enter adds a new line, Esc closes
board.addEventListener("keydown", (e) => {
  if (e.target.matches(".add-form textarea")) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.target.form.requestSubmit();
    }
    if (e.key === "Escape") e.target.closest(".column").classList.remove("adding");
  }
  if (e.target.matches(".card") && e.key === "Enter") openModal(Number(e.target.dataset.id));
});

// ---------- Edit modal ----------
let editingId = null;

modal.elements.label.innerHTML = Object.entries(LABELS)
  .map(([key, l]) => `<option value="${key}">${l.name}</option>`)
  .join("");

function openModal(id) {
  const t = tasks.find((x) => x.id === id);
  if (!t) return;
  editingId = id;
  modal.elements.title.value = t.title;
  modal.elements.desc.value = t.desc;
  modal.elements.label.value = t.label;
  modal.elements.priority.value = t.priority;
  modal.elements.due.value = t.due;
  backdrop.classList.add("open");
  backdrop.setAttribute("aria-hidden", "false");
  setTimeout(() => modal.elements.title.focus(), 50);
}

const closeModal = () => {
  backdrop.classList.remove("open");
  backdrop.setAttribute("aria-hidden", "true");
  editingId = null;
};

modal.addEventListener("submit", (e) => {
  e.preventDefault();
  const t = tasks.find((x) => x.id === editingId);
  const title = modal.elements.title.value.trim();
  if (!t || !title) return;
  Object.assign(t, {
    title,
    desc: modal.elements.desc.value.trim(),
    label: modal.elements.label.value,
    priority: modal.elements.priority.value,
    due: modal.elements.due.value,
  });
  save();
  render();
  closeModal();
});

modal.querySelectorAll(".close").forEach((b) => b.addEventListener("click", closeModal));
backdrop.addEventListener("click", (e) => {
  if (e.target === backdrop) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && backdrop.classList.contains("open")) closeModal();
});

// Delete with undo
let toastTimer;
modal.querySelector(".delete").addEventListener("click", () => {
  const index = tasks.findIndex((x) => x.id === editingId);
  if (index === -1) return;
  const [removed] = tasks.splice(index, 1);
  save();
  render();
  closeModal();

  toast.innerHTML = `Task deleted <button type="button">Undo</button>`;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 4000);
  toast.querySelector("button").onclick = () => {
    tasks.splice(index, 0, removed);
    save();
    render();
    toast.classList.remove("show");
  };
});

document.querySelector(".reset").addEventListener("click", () => {
  if (!confirm("Reset the board to the demo tasks?")) return;
  tasks = demoTasks();
  save();
  render();
});

// ---------- Drag & drop ----------
// Mouse: drag starts after moving 5px. Touch: long-press 250ms, so normal
// scrolling on phones still works.
let drag = null;
let pending = null;

board.addEventListener("pointerdown", (e) => {
  const card = e.target.closest(".card");
  if (!card || e.button > 0) return;

  pending = { card, startX: e.clientX, startY: e.clientY, pointerId: e.pointerId, type: e.pointerType, ready: e.pointerType === "mouse" };

  if (e.pointerType !== "mouse") {
    pending.timer = setTimeout(() => {
      if (!pending) return;
      pending.ready = true;
      navigator.vibrate?.(15);
      startDrag(e.clientX, e.clientY);
    }, 250);
  }
});

window.addEventListener("pointermove", (e) => {
  if (drag) {
    moveDrag(e.clientX, e.clientY);
    return;
  }
  if (!pending) return;
  const moved = Math.hypot(e.clientX - pending.startX, e.clientY - pending.startY);
  if (pending.type === "mouse") {
    if (moved > 5) startDrag(e.clientX, e.clientY);
    return;
  }
  // Finger moved before the long-press finished: treat it as a scroll
  if (!pending.ready && moved > 8) cancelPending();
});

window.addEventListener("pointerup", (e) => {
  if (drag) return endDrag();
  // A click without dragging opens the editor
  if (pending && e.target.closest(".card") === pending.card) openModal(Number(pending.card.dataset.id));
  cancelPending();
});

window.addEventListener("pointercancel", () => {
  if (drag) endDrag();
  cancelPending();
});

// While dragging on touch, stop the page from scrolling
window.addEventListener(
  "touchmove",
  (e) => {
    if (drag || pending?.ready) e.preventDefault();
  },
  { passive: false },
);

function cancelPending() {
  if (pending?.timer) clearTimeout(pending.timer);
  pending = null;
}

function startDrag(x, y) {
  const card = pending.card;
  const rect = card.getBoundingClientRect();

  const clone = card.cloneNode(true);
  clone.classList.add("drag-clone");
  clone.style.width = `${rect.width}px`;
  document.body.appendChild(clone);

  const placeholder = document.createElement("div");
  placeholder.className = "placeholder";
  placeholder.style.height = `${rect.height}px`;
  card.after(placeholder);
  card.classList.add("dragging-source");
  card.style.display = "none";

  drag = { card, clone, placeholder, offsetX: x - rect.left, offsetY: y - rect.top, id: Number(card.dataset.id) };
  cancelPending();
  document.body.style.cursor = "grabbing";
  moveDrag(x, y);
}

function moveDrag(x, y) {
  const { clone, placeholder, offsetX, offsetY } = drag;
  clone.style.left = `${x - offsetX}px`;
  clone.style.top = `${y - offsetY}px`;

  // Which column is under the pointer?
  const column = document.elementFromPoint(x, y)?.closest(".column");
  board.querySelectorAll(".column").forEach((c) => c.classList.toggle("drop-target", c === column));
  if (!column) return;

  // Insert the placeholder before the first card whose middle is below the pointer
  const list = column.querySelector(".cards");
  const cards = [...list.querySelectorAll(".card:not(.dragging-source):not(.hidden)")];
  const before = cards.find((c) => {
    const r = c.getBoundingClientRect();
    return y < r.top + r.height / 2;
  });
  if (before) list.insertBefore(placeholder, before);
  else list.appendChild(placeholder);

  autoScroll(x, y, list);
}

// Scroll the board / column when dragging near an edge
function autoScroll(x, y, list) {
  const edge = 60;
  const b = board.getBoundingClientRect();
  if (x < b.left + edge) board.scrollLeft -= 12;
  else if (x > b.right - edge) board.scrollLeft += 12;

  const l = list.getBoundingClientRect();
  if (y < l.top + edge) list.scrollTop -= 10;
  else if (y > l.bottom - edge) list.scrollTop += 10;
}

function endDrag() {
  const { clone, placeholder, id } = drag;
  const list = placeholder.parentElement;
  const newCol = list.closest(".column").dataset.col;

  // Work out the new position from the placeholder's neighbours
  const task = tasks.find((t) => t.id === id);
  const nextCard = [...list.children].slice([...list.children].indexOf(placeholder) + 1).find((el) => el.matches(".card:not(.dragging-source)"));

  tasks = tasks.filter((t) => t.id !== id);
  task.col = newCol;
  if (nextCard) {
    const idx = tasks.findIndex((t) => t.id === Number(nextCard.dataset.id));
    tasks.splice(idx, 0, task);
  } else {
    // Append after the last task of that column
    const lastIdx = tasks.map((t) => t.col).lastIndexOf(newCol);
    tasks.splice(lastIdx + 1, 0, task);
  }

  // Animate the clone into the placeholder's spot, then re-render
  const target = placeholder.getBoundingClientRect();
  clone.style.transition = "left 0.2s ease, top 0.2s ease, transform 0.2s ease";
  clone.style.left = `${target.left}px`;
  clone.style.top = `${target.top}px`;
  clone.style.transform = "none";

  const finish = () => {
    clone.remove();
    save();
    render();
  };
  setTimeout(finish, 200);

  document.body.style.cursor = "";
  drag = null;
}

render();
