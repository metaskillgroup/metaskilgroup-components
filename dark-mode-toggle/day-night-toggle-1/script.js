const STORAGE_KEY = "theme-preference"; // "light" | "dark" | "system"
const root = document.documentElement;
const toggles = document.querySelectorAll(".dn-toggle");
const prefButtons = document.querySelectorAll("[data-pref]");
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const getPreference = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || "system";
  } catch {
    return "system";
  }
};

const resolve = (pref) => (pref === "system" ? (systemDark.matches ? "dark" : "light") : pref);

// Paint every control so it matches the current theme + preference
const syncControls = () => {
  const dark = root.dataset.theme === "dark";
  toggles.forEach((t) => t.setAttribute("aria-checked", dark));
  const pref = getPreference();
  prefButtons.forEach((b) => b.setAttribute("aria-checked", b.dataset.pref === pref));
};

// Switch theme with a circle that grows from (x, y)
const applyTheme = (theme, origin) => {
  if (root.dataset.theme === theme) return syncControls();

  const swap = () => {
    root.dataset.theme = theme;
    syncControls();
  };

  if (!document.startViewTransition || reduceMotion || !origin) {
    swap();
    return;
  }

  const { x, y } = origin;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const transition = document.startViewTransition(swap);
  transition.ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 750, easing: "cubic-bezier(0.65, 0, 0.35, 1)", pseudoElement: "::view-transition-new(root)" },
    );
  });
};

const setPreference = (pref, origin) => {
  try {
    localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // Storage can be blocked — the theme still changes for this visit
  }
  applyTheme(resolve(pref), origin);
  syncControls();
};

const centerOf = (el) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

toggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    // Let the sun / moon animation start, then reveal the page from the knob
    toggle.setAttribute("aria-checked", next === "dark");
    setTimeout(() => setPreference(next, centerOf(toggle.querySelector(".knob"))), 180);
  });
});

prefButtons.forEach((btn) => {
  btn.addEventListener("click", () => setPreference(btn.dataset.pref, centerOf(btn)));
});

// Follow the OS setting live while the preference is "system"
systemDark.addEventListener("change", () => {
  if (getPreference() === "system") applyTheme(resolve("system"));
});

syncControls();
