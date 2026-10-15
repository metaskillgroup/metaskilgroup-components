// One small script drives every [data-tabs] block on the page.
// It follows the WAI-ARIA tabs pattern: roving tabindex, arrow keys, Home / End.

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const setupTabs = (root) => {
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = [...root.querySelectorAll('[role="tabpanel"]')];
  const indicator = root.querySelector(".indicator");
  const vertical = root.dataset.orientation === "vertical";
  const elastic = root.classList.contains("tabs-line");
  const directional = root.classList.contains("tabs-pill");
  const uid = Math.random().toString(36).slice(2, 7);
  let current = Math.max(0, tabs.findIndex((t) => t.getAttribute("aria-selected") === "true"));

  // Wire ids so screen readers know which tab labels which panel
  tabs.forEach((tab, i) => {
    tab.id = `tab-${uid}-${i}`;
    tab.setAttribute("aria-controls", `panel-${uid}-${i}`);
    panels[i].id = `panel-${uid}-${i}`;
    panels[i].setAttribute("aria-labelledby", tab.id);
    panels[i].tabIndex = 0;
  });

  const place = (el) => {
    indicator.style.setProperty("--x", `${vertical ? 0 : el.offsetLeft}px`);
    indicator.style.setProperty("--y", `${vertical ? el.offsetTop : el.offsetTop}px`);
    indicator.style.setProperty("--w", `${el.offsetWidth}px`);
    indicator.style.setProperty("--h", `${el.offsetHeight}px`);
  };

  const moveIndicator = (from, to) => {
    // Elastic: first stretch across both tabs, then shrink onto the new one
    if (elastic && from !== to && !reduceMotion) {
      const a = tabs[from];
      const b = tabs[to];
      const left = Math.min(a.offsetLeft, b.offsetLeft);
      const right = Math.max(a.offsetLeft + a.offsetWidth, b.offsetLeft + b.offsetWidth);
      indicator.style.setProperty("--x", `${left}px`);
      indicator.style.setProperty("--w", `${right - left}px`);
      setTimeout(() => place(b), 180);
      return;
    }
    place(tabs[to]);
  };

  const select = (index, { focus = true } = {}) => {
    if (index === current) return;
    const previous = current;
    current = index;

    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.setAttribute("aria-selected", active);
      tab.tabIndex = active ? 0 : -1;
    });

    panels.forEach((panel, i) => {
      panel.hidden = i !== index;
      panel.classList.remove("from-left", "from-right", "fade");
    });

    // Panels slide in from the side you moved towards
    const panel = panels[index];
    void panel.offsetWidth; // restart the animation
    panel.classList.add(directional ? (index > previous ? "from-right" : "from-left") : "fade");

    moveIndicator(previous, index);
    if (focus) tabs[index].focus();
    tabs[index].scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  tabs.forEach((tab, i) => {
    tab.tabIndex = i === current ? 0 : -1;
    tab.addEventListener("click", () => select(i, { focus: false }));
  });

  root.querySelector('[role="tablist"]').addEventListener("keydown", (e) => {
    const next = vertical ? "ArrowDown" : "ArrowRight";
    const prev = vertical ? "ArrowUp" : "ArrowLeft";
    let target = null;
    if (e.key === next) target = (current + 1) % tabs.length;
    if (e.key === prev) target = (current - 1 + tabs.length) % tabs.length;
    if (e.key === "Home") target = 0;
    if (e.key === "End") target = tabs.length - 1;
    if (target === null) return;
    e.preventDefault();
    select(target);
  });

  // Place without animating on load and whenever the layout changes
  const snap = () => {
    root.classList.add("no-anim");
    place(tabs[current]);
    requestAnimationFrame(() => root.classList.remove("no-anim"));
  };
  snap();
  window.addEventListener("resize", snap);
  document.fonts?.ready.then(snap);
};

document.querySelectorAll("[data-tabs]").forEach(setupTabs);
