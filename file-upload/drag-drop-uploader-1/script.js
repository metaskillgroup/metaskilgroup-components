// ---------- Settings ----------
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPT = ["png", "jpg", "jpeg", "gif", "webp", "pdf", "zip", "docx", "doc"];
const CONCURRENCY = 2; // files uploading at the same time
const FAIL_RATE = 0.1; // simulated network failures (demo only)

// Colours for non-image file badges
const TYPE_COLOR = { pdf: "#ef4444", zip: "#f59e0b", docx: "#2563eb", doc: "#2563eb" };

const $ = (id) => document.getElementById(id);
const listEl = $("files");
const items = [];
let nextId = 1;

const ICON = {
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="M7 5l12 7-12 7z"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  retry: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[name]}</svg>`;

const fmtSize = (b) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`);
const extOf = (name) => (name.split(".").pop() || "").toLowerCase();
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// ---------- Adding files ----------
const addFiles = (files, opts = {}) => {
  for (const file of files) {
    const ext = extOf(file.name);
    const item = {
      id: nextId++,
      file,
      name: file.name,
      ext,
      size: file.size,
      loaded: 0,
      speed: 0,
      status: "queued",
      error: "",
      // Demo samples fail only where asked; real files get a small random chance
      failAt: opts.failNames
        ? opts.failNames.includes(file.name) ? 0.55 : null
        : Math.random() < FAIL_RATE ? 0.3 + Math.random() * 0.5 : null,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    };
    if (!ACCEPT.includes(ext)) {
      item.status = "error";
      item.error = `.${ext} files aren't allowed`;
    } else if (file.size > MAX_SIZE) {
      item.status = "error";
      item.error = `Too large — ${fmtSize(file.size)} (max ${fmtSize(MAX_SIZE)})`;
    }
    items.push(item);
    listEl.insertAdjacentHTML("beforeend", `<li class="file" data-id="${item.id}"></li>`);
    paint(item);
  }
  updateOverall();
  if ($("auto").checked) pump();
};

// ---------- Upload simulation (swap for XMLHttpRequest / fetch with progress) ----------
const timers = new Map();

const pump = () => {
  const active = items.filter((i) => i.status === "uploading").length;
  items
    .filter((i) => i.status === "queued")
    .slice(0, Math.max(0, CONCURRENCY - active))
    .forEach(start);
};

const start = (item) => {
  item.status = "uploading";
  paint(item);
  const TICK = 200;
  timers.set(
    item.id,
    setInterval(() => {
      // Speed wobbles a little like a real connection
      item.speed = (0.8 + Math.random() * 1.8) * 1048576;
      item.loaded = Math.min(item.size, item.loaded + item.speed * (TICK / 1000));
      if (item.failAt !== null && item.loaded / item.size >= item.failAt) {
        stop(item);
        item.status = "error";
        item.error = "Network error — upload interrupted";
        item.failAt = null; // a retry will succeed
      } else if (item.loaded >= item.size) {
        stop(item);
        item.status = "done";
      }
      paint(item);
      updateOverall();
      if (item.status !== "uploading") pump();
    }, TICK),
  );
};

const stop = (item) => {
  clearInterval(timers.get(item.id));
  timers.delete(item.id);
};

// ---------- Rendering one row ----------
const statusText = (i) => {
  const pct = Math.floor((i.loaded / i.size) * 100);
  switch (i.status) {
    case "queued":
      return $("auto").checked ? "Waiting in queue…" : `${fmtSize(i.size)} · Ready to upload`;
    case "uploading": {
      if (!i.speed) return "Starting…";
      const left = Math.max(1, Math.ceil((i.size - i.loaded) / i.speed));
      return `${pct}% · ${fmtSize(i.speed)}/s · ${left}s left`;
    }
    case "paused":
      return `Paused at ${pct}%`;
    case "done":
      return `${fmtSize(i.size)} · Uploaded`;
    default:
      return i.error;
  }
};

const actionsFor = (i) => {
  const btn = (act, label, ic, cls = "") => `<button type="button" class="act ${cls}" data-act="${act}" aria-label="${label} ${esc(i.name)}" title="${label}">${icon(ic)}</button>`;
  switch (i.status) {
    case "uploading":
      return btn("pause", "Pause", "pause") + btn("cancel", "Cancel", "x");
    case "paused":
      return btn("resume", "Resume", "play") + btn("cancel", "Cancel", "x");
    case "queued":
      return ($("auto").checked ? "" : btn("start", "Upload", "upload", "retry")) + btn("remove", "Remove", "trash", "remove");
    case "error":
      return (i.error.startsWith("Network") ? btn("retry", "Retry", "retry", "retry") : "") + btn("remove", "Remove", "trash", "remove");
    default:
      return btn("remove", "Remove", "trash", "remove");
  }
};

const thumbHTML = (i) => {
  const inner = i.preview ? `<img src="${i.preview}" alt="" />` : i.ext.toUpperCase().slice(0, 4);
  const ok = i.status === "done" ? `<span class="ok">${icon("check")}</span>` : "";
  return `<span class="thumb" style="--c:${i.preview ? "#e9eef7" : TYPE_COLOR[i.ext] ?? "#94a3b8"}">${inner}${ok}</span>`;
};

const paint = (i) => {
  const li = listEl.querySelector(`[data-id="${i.id}"]`);
  if (!li) return;
  const dot = i.name.lastIndexOf(".");
  const [startPart, endPart] = dot > 0 && i.name.length > 28 ? [i.name.slice(0, dot - 4), i.name.slice(dot - 4)] : [i.name, ""];
  li.className = `file ${i.status}`;
  li.innerHTML = `${thumbHTML(i)}
    <div class="info">
      <div class="name" title="${esc(i.name)}"><span class="start">${esc(startPart)}</span><span class="end">${esc(endPart)}</span></div>
      <div class="status">${statusText(i)}</div>
      <div class="bar" role="progressbar" aria-label="${esc(i.name)} upload" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.floor((i.loaded / i.size) * 100)}"><i style="--p:${(i.loaded / i.size) * 100}%"></i></div>
    </div>
    <div class="actions">${actionsFor(i)}</div>`;
};

const updateOverall = () => {
  const valid = items.filter((i) => !(i.status === "error" && !i.error.startsWith("Network")));
  $("overall").hidden = items.length === 0;
  const done = valid.filter((i) => i.status === "done").length;
  const total = valid.reduce((s, i) => s + i.size, 0) || 1;
  const pct = Math.round((valid.reduce((s, i) => s + i.loaded, 0) / total) * 100);
  $("ov-text").textContent = `${done} of ${valid.length} uploaded · ${pct}%`;
  $("ov-bar").style.width = `${pct}%`;
  $("start-all").hidden = $("auto").checked || !items.some((i) => i.status === "queued");
};

const removeItem = (item) => {
  stop(item);
  if (item.preview) URL.revokeObjectURL(item.preview);
  items.splice(items.indexOf(item), 1);
  const li = listEl.querySelector(`[data-id="${item.id}"]`);
  li?.classList.add("is-removing");
  setTimeout(() => li?.remove(), 300);
  updateOverall();
  pump();
};

// ---------- Row buttons ----------
listEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const item = items.find((i) => i.id === Number(btn.closest(".file").dataset.id));
  const act = btn.dataset.act;
  if (act === "pause") {
    stop(item);
    item.status = "paused";
    paint(item);
    pump();
  }
  if (act === "resume") {
    item.status = "queued";
    paint(item);
    pump();
    // Resume jumps the queue
    if (item.status === "queued") start(item);
  }
  if (act === "start") start(item);
  if (act === "retry") {
    item.loaded = 0;
    item.status = "queued";
    item.error = "";
    paint(item);
    pump();
  }
  if (act === "cancel" || act === "remove") removeItem(item);
  updateOverall();
});

$("start-all").addEventListener("click", () => {
  items.filter((i) => i.status === "queued").forEach((i) => (i.status = "queued"));
  const queued = items.filter((i) => i.status === "queued");
  queued.slice(0, CONCURRENCY).forEach(start);
  // the rest start as these finish
  const wasAuto = $("auto").checked;
  $("auto").checked = true;
  pump();
  $("auto").checked = wasAuto;
  updateOverall();
});

$("clear-done").addEventListener("click", () => items.filter((i) => i.status === "done").forEach(removeItem));

$("auto").addEventListener("change", () => {
  items.filter((i) => i.status === "queued").forEach(paint);
  updateOverall();
  if ($("auto").checked) pump();
});

// ---------- Ways to add files: browse, drop zone, whole window, paste ----------
const input = $("file-input");
const zone = $("dropzone");
const overlay = $("drag-overlay");

zone.addEventListener("click", () => input.click());
zone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    input.click();
  }
});
input.addEventListener("change", () => {
  addFiles(input.files);
  input.value = "";
});

let dragDepth = 0;
const hasFiles = (e) => [...(e.dataTransfer?.types ?? [])].includes("Files");
window.addEventListener("dragenter", (e) => {
  if (!hasFiles(e)) return;
  dragDepth++;
  overlay.classList.add("is-on");
  zone.classList.add("is-over");
});
window.addEventListener("dragleave", () => {
  dragDepth = Math.max(0, dragDepth - 1);
  if (!dragDepth) {
    overlay.classList.remove("is-on");
    zone.classList.remove("is-over");
  }
});
window.addEventListener("dragover", (e) => hasFiles(e) && e.preventDefault());
window.addEventListener("drop", (e) => {
  if (!hasFiles(e)) return;
  e.preventDefault();
  dragDepth = 0;
  overlay.classList.remove("is-on");
  zone.classList.remove("is-over");
  addFiles(e.dataTransfer.files);
});

let pasteCount = 0;
window.addEventListener("paste", (e) => {
  const files = [...(e.clipboardData?.files ?? [])].map(
    (f) => new File([f], f.name === "image.png" ? `pasted-image-${++pasteCount}.png` : f.name, { type: f.type }),
  );
  if (files.length) addFiles(files);
});

// ---------- Sample files for the demo ----------
const makeImage = (name, colors, label) =>
  new Promise((resolve) => {
    const c = Object.assign(document.createElement("canvas"), { width: 480, height: 320 });
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 480, 320);
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(1, colors[1]);
    g.fillStyle = grad;
    g.fillRect(0, 0, 480, 320);
    g.fillStyle = "rgba(255,255,255,.9)";
    g.font = "bold 44px sans-serif";
    g.fillText(label, 30, 290);
    c.toBlob((blob) => resolve(new File([blob], name, { type: "image/png" })));
  });
const fakeFile = (name, mb, type) => new File([new Uint8Array(Math.round(mb * 1048576))], name, { type });

$("samples").addEventListener("click", async () => {
  const files = [
    await makeImage("mountain-sunrise.png", ["#f97316", "#7c3aed"], "⛰"),
    fakeFile("Q3-financial-report-final-approved.pdf", 2.4, "application/pdf"),
    fakeFile("brand-assets.zip", 3.2, "application/zip"),
    fakeFile("meeting-notes.docx", 0.6, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    fakeFile("holiday-video.mov", 24, "video/quicktime"),
    await makeImage("team-photo.png", ["#06b6d4", "#2563eb"], "👥"),
  ];
  // brand-assets.zip always "fails" once so you can see Retry
  addFiles(files, { failNames: ["brand-assets.zip"] });
});
