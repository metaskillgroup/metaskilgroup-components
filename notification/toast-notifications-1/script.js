// A tiny toast library:
//   toast.success(title, message)   toast.error(…)   toast.warning(…)   toast.info(…)
//   toast.promise(promise, { loading, success, error })
//   toast.show({ type, title, message, duration, action: { label, onClick } })

const toaster = document.getElementById("toaster");
const MAX_TOASTS = 4;
const DEFAULT_DURATION = 4000;
const SWIPE_DISMISS = 90; // px

const ICONS = {
  success: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  error: '<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17"/></svg>',
  warning: '<svg viewBox="0 0 24 24"><path d="M12 7v6M12 17v.01"/></svg>',
  info: '<svg viewBox="0 0 24 24"><path d="M12 11v6M12 7v.01"/></svg>',
  loading: '<span class="t-spinner"></span>',
};

const escapeHTML = (s = "") => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Collapse the toast's height smoothly, then remove it
const dismiss = (el) => {
  if (!el || el.dataset.leaving) return;
  el.dataset.leaving = "true";
  const h = el.offsetHeight;
  el.animate(
    [
      { height: `${h}px`, opacity: 1, transform: getComputedStyle(el).transform },
      { height: "0px", opacity: 0, paddingTop: "0px", paddingBottom: "0px", marginBottom: "-10px", transform: "scale(0.94)" },
    ],
    { duration: 300, easing: "ease-in", fill: "forwards" },
  ).finished.then(() => el.remove());
};

const render = (el, { type, title, message, duration, action }) => {
  el.className = `toast ${type}`;
  el.setAttribute("role", type === "error" ? "alert" : "status");
  el.innerHTML = `
    <span class="t-icon" aria-hidden="true">${ICONS[type]}</span>
    <div class="t-body">
      <p class="t-title">${escapeHTML(title)}</p>
      ${message ? `<p class="t-msg">${escapeHTML(message)}</p>` : ""}
      ${action ? `<button type="button" class="t-action">${escapeHTML(action.label)}</button>` : ""}
    </div>
    <button type="button" class="t-close" aria-label="Dismiss">✕</button>
    ${type === "loading" ? "" : `<span class="t-progress" style="--duration:${duration}ms"></span>`}`;

  el.querySelector(".t-close").addEventListener("click", () => dismiss(el));
  el.querySelector(".t-progress")?.addEventListener("animationend", () => dismiss(el));
  if (action) {
    el.querySelector(".t-action").addEventListener("click", () => {
      action.onClick?.();
      dismiss(el);
    });
  }
};

// Swipe sideways (mouse or touch) to throw a toast away
const enableSwipe = (el) => {
  let startX = null;
  let dx = 0;
  el.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    startX = e.clientX;
    el.setPointerCapture(e.pointerId);
    el.style.transition = "none";
  });
  el.addEventListener("pointermove", (e) => {
    if (startX === null) return;
    dx = e.clientX - startX;
    el.style.transform = `translateX(${dx}px)`;
    el.style.opacity = String(1 - Math.min(Math.abs(dx) / 220, 0.8));
  });
  const end = () => {
    if (startX === null) return;
    startX = null;
    el.style.transition = "transform 0.25s, opacity 0.25s";
    if (Math.abs(dx) > SWIPE_DISMISS) {
      el.style.transform = `translateX(${Math.sign(dx) * 420}px)`;
      el.style.opacity = "0";
      setTimeout(() => dismiss(el), 200);
    } else {
      el.style.transform = "";
      el.style.opacity = "";
    }
    dx = 0;
  };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
};

const show = (options) => {
  const opts = { type: "info", duration: DEFAULT_DURATION, ...options };
  const el = document.createElement("div");
  render(el, opts);
  enableSwipe(el);
  toaster.prepend(el);

  // Keep the stack short — oldest go first
  const live = [...toaster.querySelectorAll(".toast:not([data-leaving])")];
  live.slice(MAX_TOASTS).forEach(dismiss);
  return el;
};

const toast = {
  show,
  success: (title, message, extra) => show({ type: "success", title, message, ...extra }),
  error: (title, message, extra) => show({ type: "error", title, message, ...extra }),
  warning: (title, message, extra) => show({ type: "warning", title, message, ...extra }),
  info: (title, message, extra) => show({ type: "info", title, message, ...extra }),
  dismiss,
  // One toast that goes loading → success / error with the promise
  promise(promise, { loading, success, error }) {
    const el = show({ type: "loading", title: loading });
    promise.then(
      (value) => render(el, { type: "success", title: typeof success === "function" ? success(value) : success, duration: DEFAULT_DURATION }),
      (err) => render(el, { type: "error", title: typeof error === "function" ? error(err) : error, duration: DEFAULT_DURATION }),
    );
    return promise;
  },
};

// ---------- Demo buttons ----------
const fakeUpload = () => new Promise((resolve, reject) => setTimeout(() => (Math.random() > 0.2 ? resolve(3) : reject()), 1800));

const demos = {
  success: () => toast.success("Changes saved", "Your profile is up to date."),
  error: () => toast.error("Payment failed", "Your card was declined. Try another card."),
  warning: () => toast.warning("Storage almost full", "You've used 92% of your 5 GB."),
  info: () => toast.info("New version available", "Refresh to get the latest features."),
  promise: () =>
    toast.promise(fakeUpload(), {
      loading: "Uploading 3 files…",
      success: (n) => `${n} files uploaded`,
      error: "Upload failed — please retry",
    }),
  undo: () =>
    toast.show({
      type: "info",
      title: "Message archived",
      message: "It's been moved to your archive.",
      duration: 6000,
      action: { label: "Undo", onClick: () => toast.success("Restored", "The message is back in your inbox.") },
    }),
};

document.querySelectorAll("[data-demo]").forEach((btn) => {
  btn.addEventListener("click", () => demos[btn.dataset.demo]());
});

// ---------- Position picker ----------
document.querySelectorAll("[data-pos]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-pos]").forEach((b) => b.setAttribute("aria-checked", b === btn));
    toaster.className = `toaster ${btn.dataset.pos}`;
    toast.info("Moved here", `Toasts now appear ${btn.getAttribute("aria-label").toLowerCase()}.`);
  });
});

// A friendly hello on load
setTimeout(() => toast.success("Welcome!", "Click the buttons to try every toast."), 500);
