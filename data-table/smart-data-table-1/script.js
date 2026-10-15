// ---------- Sample data (replace `rows` with your API data) ----------
const FIRST = ["Aarav", "Diya", "Kabir", "Meera", "Rohan", "Ananya", "Vihaan", "Isha", "Arjun", "Saanvi", "Liam", "Emma", "Noah", "Olivia", "Yuki", "Mateo", "Zara", "Ethan", "Priya", "Lucas", "Nora"];
const LAST = ["Sharma", "Iyer", "Khan", "Patel", "Reddy", "Gupta", "Nair", "Singh", "Das", "Brown", "Garcia", "Kim", "Silva", "Müller", "Rossi", "Tanaka"];
const COMPANIES = ["Northwind", "Pixelcraft", "Bluefin Labs", "Kiteworks", "Saffron AI", "Orbitly", "Monsoon Studio", "Quill & Co", "Vertex Health", "Lumen", "Tiffin Box", "Cobalt Pay"];
const PLANS = ["Starter", "Pro", "Business"];
const PRICE = { Starter: 999, Pro: 2499, Business: 7999 };
const STATUSES = ["Active", "Trial", "Past due", "Churned"];

// Tiny seeded random so the demo data is the same on every load
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

let rows = Array.from({ length: 42 }, (_, i) => {
  const first = pick(FIRST);
  const last = pick(LAST);
  const plan = pick(PLANS);
  const status = rand() < 0.55 ? "Active" : pick(STATUSES);
  const seats = 1 + Math.floor(rand() * 12);
  return {
    id: i + 1,
    name: `${first} ${last}`,
    email: `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, "") + "@" + pick(["gmail.com", "outlook.com", "company.io"]),
    company: pick(COMPANIES),
    plan,
    status,
    mrr: status === "Churned" ? 0 : PRICE[plan] * (plan === "Starter" ? 1 : seats),
    joined: new Date(2026, 9, 14 - Math.floor(rand() * 600)),
  };
});

const COLUMNS = [
  { key: "name", label: "Customer", locked: true },
  { key: "company", label: "Company" },
  { key: "plan", label: "Plan" },
  { key: "status", label: "Status" },
  { key: "mrr", label: "MRR", num: true },
  { key: "joined", label: "Joined" },
];

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

const state = {
  query: "",
  status: "All",
  plan: "",
  sort: { key: "joined", dir: "desc" },
  page: 1,
  pageSize: 10,
  selected: new Set(),
  hidden: new Set(),
  compact: false,
};

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const hue = (s) => [...s].reduce((h, c) => h + c.charCodeAt(0), 0) % 360;

// ---------- Filtering + sorting ----------
const filtered = () => {
  const q = state.query.toLowerCase();
  const list = rows.filter(
    (r) =>
      (state.status === "All" || r.status === state.status) &&
      (!state.plan || r.plan === state.plan) &&
      (!q || r.name.toLowerCase().includes(q) || r.email.includes(q) || r.company.toLowerCase().includes(q)),
  );
  const { key, dir } = state.sort;
  if (key) {
    list.sort((a, b) => {
      const x = a[key];
      const y = b[key];
      const cmp = x instanceof Date ? x - y : typeof x === "number" ? x - y : String(x).localeCompare(String(y));
      return dir === "asc" ? cmp : -cmp;
    });
  }
  return list;
};

// ---------- Render ----------
const visibleCols = () => COLUMNS.filter((c) => !state.hidden.has(c.key));

const renderHead = (pageRows) => {
  const allOnPage = pageRows.length > 0 && pageRows.every((r) => state.selected.has(r.id));
  const someOnPage = pageRows.some((r) => state.selected.has(r.id));
  $("thead").innerHTML = `<tr>
    <th class="check"><input type="checkbox" id="select-all" aria-label="Select all on this page" ${allOnPage ? "checked" : ""} /></th>
    ${visibleCols()
      .map((c) => {
        const sort = state.sort.key === c.key ? (state.sort.dir === "asc" ? "ascending" : "descending") : "none";
        return `<th class="${c.num ? "num" : ""}" aria-sort="${sort}"><button type="button" data-sort="${c.key}">${c.label}
          <svg class="sort-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M6 11l6-6 6 6"/></svg></button></th>`;
      })
      .join("")}
    <th class="row-menu"><span class="sr-only">Actions</span></th>
  </tr>`;
  $("select-all").indeterminate = someOnPage && !allOnPage;
};

const cell = (c, r) => {
  switch (c.key) {
    case "name":
      return `<td class="person-cell" data-label="Customer"><div class="person"><span class="av" style="--h:${hue(r.name)}">${r.name.split(" ").map((p) => p[0]).join("")}</span><div><b>${esc(r.name)}</b><small>${esc(r.email)}</small></div></div></td>`;
    case "company":
      return `<td class="company" data-label="Company" data-id="${r.id}" tabindex="0" title="Double-click to edit">${esc(r.company)}<span class="edit-hint">✎</span></td>`;
    case "plan":
      return `<td data-label="Plan"><span class="plan">${r.plan}</span></td>`;
    case "status":
      return `<td data-label="Status"><span class="status ${r.status.replace(" ", "-")}">${r.status}</span></td>`;
    case "mrr":
      return `<td class="num mono" data-label="MRR">${inr.format(r.mrr)}</td>`;
    case "joined":
      return `<td data-label="Joined">${dateFmt.format(r.joined)}</td>`;
  }
};

let lastAdded = null;
const render = () => {
  const list = filtered();
  const pages = Math.max(1, Math.ceil(list.length / state.pageSize));
  state.page = Math.min(state.page, pages);
  const start = (state.page - 1) * state.pageSize;
  const pageRows = list.slice(start, start + state.pageSize);

  renderHead(pageRows);
  $("tbody").innerHTML = pageRows
    .map(
      (r) => `<tr data-id="${r.id}" class="${state.selected.has(r.id) ? "is-selected" : ""} ${lastAdded?.has(r.id) ? "is-new" : ""}">
        <td class="check"><input type="checkbox" data-select="${r.id}" aria-label="Select ${esc(r.name)}" ${state.selected.has(r.id) ? "checked" : ""} /></td>
        ${visibleCols().map((c) => cell(c, r)).join("")}
        <td class="row-menu"><button type="button" class="row-menu-btn" data-menu="${r.id}" aria-label="Actions for ${esc(r.name)}" aria-haspopup="true">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg></button></td>
      </tr>`,
    )
    .join("");
  lastAdded = null;

  $("table").hidden = list.length === 0;
  $("empty").hidden = list.length > 0;
  $("table").classList.toggle("compact", state.compact);

  const mrr = list.reduce((s, r) => s + r.mrr, 0);
  $("summary").innerHTML = list.length
    ? `Showing <b>${start + 1}–${start + pageRows.length}</b> of <b>${list.length}</b> · MRR <b>${inr.format(mrr)}</b>`
    : "No results";

  renderPages(pages);
  renderChips();
  renderKpis();
  renderBulk();
};

const renderPages = (pages) => {
  const p = state.page;
  const nums = [...new Set([1, p - 1, p, p + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  let html = `<button type="button" data-page="${p - 1}" ${p === 1 ? "disabled" : ""} aria-label="Previous page">‹</button>`;
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) html += `<span class="gap">…</span>`;
    html += `<button type="button" data-page="${n}" ${n === p ? 'aria-current="page"' : ""}>${n}</button>`;
  });
  html += `<button type="button" data-page="${p + 1}" ${p === pages ? "disabled" : ""} aria-label="Next page">›</button>`;
  $("pages").innerHTML = html;
};

const renderChips = () => {
  const base = rows.filter((r) => !state.plan || r.plan === state.plan);
  $("status-chips").innerHTML = ["All", ...STATUSES]
    .map((s) => {
      const n = s === "All" ? base.length : base.filter((r) => r.status === s).length;
      return `<button type="button" class="chip" data-status="${s}" aria-pressed="${state.status === s}">${s} <b>${n}</b></button>`;
    })
    .join("");
};

const renderKpis = () => {
  const active = rows.filter((r) => r.status === "Active");
  $("kpis").innerHTML = `
    <div class="kpi"><small>Customers</small><b>${rows.length}</b></div>
    <div class="kpi"><small>Active MRR</small><b>${inr.format(active.reduce((s, r) => s + r.mrr, 0))}</b></div>
    <div class="kpi"><small>On trial</small><b>${rows.filter((r) => r.status === "Trial").length}</b></div>`;
};

const renderBulk = () => {
  const n = state.selected.size;
  $("bulk").classList.toggle("is-on", n > 0);
  $("bulk-count").textContent = `${n} selected`;
};

const renderColumnsPanel = () => {
  $("columns-panel").innerHTML = COLUMNS.filter((c) => !c.locked)
    .map((c) => `<label><input type="checkbox" data-col="${c.key}" ${state.hidden.has(c.key) ? "" : "checked"} /> ${c.label}</label>`)
    .join("");
};

// ---------- Toast with undo ----------
let undoFn = null;
let toastTimer;
const toast = (text, undo) => {
  $("toast-text").textContent = text;
  $("toast-undo").hidden = !undo;
  undoFn = undo;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 5000);
};
$("toast-undo").addEventListener("click", () => {
  undoFn?.();
  $("toast").classList.remove("show");
});

const removeRows = (ids) => {
  const removed = rows.map((r, i) => ({ r, i })).filter(({ r }) => ids.includes(r.id));
  rows = rows.filter((r) => !ids.includes(r.id));
  ids.forEach((id) => state.selected.delete(id));
  render();
  toast(`${removed.length} customer${removed.length > 1 ? "s" : ""} deleted`, () => {
    removed.forEach(({ r, i }) => rows.splice(i, 0, r));
    lastAdded = new Set(ids);
    render();
  });
};

// ---------- CSV export ----------
const exportCSV = (list, name) => {
  const cols = visibleCols();
  const quote = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [
    ["Name", "Email", ...cols.filter((c) => c.key !== "name").map((c) => c.label)].map(quote).join(","),
    ...list.map((r) =>
      [r.name, r.email, ...cols.filter((c) => c.key !== "name").map((c) => (c.key === "joined" ? r.joined.toISOString().slice(0, 10) : r[c.key]))]
        .map(quote)
        .join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(`Exported ${list.length} rows to ${name}`);
};

// ---------- Events ----------
let searchTimer;
$("search").addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.query = e.target.value.trim();
    state.page = 1;
    render();
  }, 150);
});

$("status-chips").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  state.status = chip.dataset.status;
  state.page = 1;
  render();
});

$("plan-filter").addEventListener("change", (e) => {
  state.plan = e.target.value;
  state.page = 1;
  render();
});

$("thead").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-sort]");
  if (!btn) return;
  const key = btn.dataset.sort;
  // Click cycles: ascending → descending → off
  if (state.sort.key !== key) state.sort = { key, dir: "asc" };
  else if (state.sort.dir === "asc") state.sort.dir = "desc";
  else state.sort = { key: null, dir: "asc" };
  render();
});

$("thead").addEventListener("change", (e) => {
  if (e.target.id !== "select-all") return;
  const list = filtered();
  const start = (state.page - 1) * state.pageSize;
  list.slice(start, start + state.pageSize).forEach((r) => (e.target.checked ? state.selected.add(r.id) : state.selected.delete(r.id)));
  render();
});

$("tbody").addEventListener("change", (e) => {
  const id = Number(e.target.dataset.select);
  if (!id) return;
  e.target.checked ? state.selected.add(id) : state.selected.delete(id);
  render();
});

$("pages").addEventListener("click", (e) => {
  const b = e.target.closest("[data-page]");
  if (!b || b.disabled) return;
  state.page = Number(b.dataset.page);
  render();
});

$("page-size").addEventListener("change", (e) => {
  state.pageSize = Number(e.target.value);
  state.page = 1;
  render();
});

$("density").addEventListener("click", (e) => {
  state.compact = !state.compact;
  e.currentTarget.setAttribute("aria-pressed", state.compact);
  render();
});

$("export").addEventListener("click", () => exportCSV(filtered(), "customers.csv"));

$("clear-filters").addEventListener("click", () => {
  Object.assign(state, { query: "", status: "All", plan: "", page: 1 });
  $("search").value = "";
  $("plan-filter").value = "";
  render();
});

// Column chooser
const colDD = $("columns-dd");
colDD.querySelector("button").addEventListener("click", (e) => {
  e.stopPropagation();
  const open = !colDD.classList.contains("is-open");
  colDD.classList.toggle("is-open", open);
  e.currentTarget.setAttribute("aria-expanded", open);
});
$("columns-panel").addEventListener("click", (e) => e.stopPropagation());
$("columns-panel").addEventListener("change", (e) => {
  const key = e.target.dataset.col;
  e.target.checked ? state.hidden.delete(key) : state.hidden.add(key);
  render();
});

// Bulk actions
$("bulk").addEventListener("click", (e) => {
  const action = e.target.closest("[data-bulk]")?.dataset.bulk;
  const ids = [...state.selected];
  if (action === "active") {
    rows.forEach((r) => ids.includes(r.id) && (r.status = "Active"));
    toast(`${ids.length} marked active`);
    lastAdded = new Set(ids);
  }
  if (action === "export") exportCSV(rows.filter((r) => ids.includes(r.id)), "selected-customers.csv");
  if (action === "delete") return removeRows(ids);
  if (action === "clear" || action === "active") state.selected.clear();
  render();
});

// Row menu (⋯)
const closeMenus = () => document.querySelectorAll(".menu").forEach((m) => m.remove());
$("tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-menu]");
  const item = e.target.closest(".menu button");
  if (item) {
    const id = Number(item.closest(".menu").dataset.for);
    const row = rows.find((r) => r.id === id);
    closeMenus();
    if (item.dataset.act === "view") toast(`Opening ${row.name}…`);
    if (item.dataset.act === "edit") startEdit(document.querySelector(`td.company[data-id="${id}"]`));
    if (item.dataset.act === "delete") removeRows([id]);
    return;
  }
  if (!btn) return;
  e.stopPropagation();
  const already = btn.parentElement.querySelector(".menu");
  closeMenus();
  if (already) return;
  btn.insertAdjacentHTML(
    "afterend",
    `<div class="menu" data-for="${btn.dataset.menu}" role="menu">
      <button type="button" role="menuitem" data-act="view">View profile</button>
      <button type="button" role="menuitem" data-act="edit">Edit company</button>
      <button type="button" role="menuitem" data-act="delete" class="danger">Delete</button>
    </div>`,
  );
  btn.nextElementSibling.querySelector("button").focus();
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".menu")) closeMenus();
  if (!e.target.closest("#columns-dd")) colDD.classList.remove("is-open");
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeMenus();
    colDD.classList.remove("is-open");
  }
});

// Inline edit: double-click (or Enter) on a company cell
const startEdit = (td) => {
  if (!td || td.querySelector("input")) return;
  const row = rows.find((r) => r.id === Number(td.dataset.id));
  td.innerHTML = `<input type="text" value="${esc(row.company)}" aria-label="Company" />`;
  const input = td.querySelector("input");
  input.focus();
  input.select();
  let done = false;
  const finish = (save) => {
    if (done) return;
    done = true;
    if (save && input.value.trim() && input.value.trim() !== row.company) {
      row.company = input.value.trim();
      lastAdded = new Set([row.id]);
      toast(`Company updated to “${row.company}”`);
    }
    render();
  };
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") finish(true);
    if (e.key === "Escape") finish(false);
  });
  input.addEventListener("blur", () => finish(true));
};
$("tbody").addEventListener("dblclick", (e) => startEdit(e.target.closest("td.company")));
$("tbody").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.matches("td.company")) startEdit(e.target);
});

renderColumnsPanel();
render();
