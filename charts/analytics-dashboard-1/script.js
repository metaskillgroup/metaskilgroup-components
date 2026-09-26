// =====================================================
// Analytics Dashboard — pure SVG charts, no libraries
// =====================================================

const SVG_NS = "http://www.w3.org/2000/svg";
const root = document.documentElement;
const rangeButtons = document.querySelectorAll(".range-btn");
const themeBtn = document.querySelector(".theme-btn");

let range = 30;
let data = null;

// ---------- Helpers ----------

// Small seeded random generator so each range always shows the same data
const seeded = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const el = (tag, attrs = {}, parent) => {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  if (parent) parent.appendChild(node);
  return node;
};

const money = (n) => "$" + Math.round(n).toLocaleString();
const compact = (n) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : Math.round(n).toString());
const cssVar = (name) => getComputedStyle(root).getPropertyValue(name).trim();

// Smooth path through points (Catmull-Rom converted to cubic Bézier)
const smoothPath = (pts) => {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const t = 0.18;
    const c1x = p1[0] + (p2[0] - p0[0]) * t;
    const c1y = p1[1] + (p2[1] - p0[1]) * t;
    const c2x = p2[0] - (p3[0] - p1[0]) * t;
    const c2y = p2[1] - (p3[1] - p1[1]) * t;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
};

// Animate the stroke of a path from 0 to its full length
const animateStroke = (path) => {
  const len = path.getTotalLength();
  path.style.strokeDasharray = path.classList.contains("line-prev") ? "5 6" : `${len}`;
  if (!path.classList.contains("line-prev")) {
    path.style.strokeDashoffset = `${len}`;
    path.classList.add("draw");
  }
};

// ---------- Data ----------

const buildData = (days) => {
  const rand = seeded(days * 97);
  const trend = (base, growth, noise) =>
    Array.from({ length: days }, (_, i) => base * (1 + (growth * i) / days) * (1 + (rand() - 0.5) * noise));

  const revenue = trend(1800, 0.45, 0.45);
  const previous = trend(1600, 0.2, 0.4);
  const today = new Date();
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    return d;
  });

  const sum = (arr) => arr.reduce((a, b) => a + b, 0);
  const revTotal = sum(revenue);
  const prevTotal = sum(previous);
  const orders = revenue.map((r) => r / (48 + rand() * 10));
  const visitors = revenue.map((r) => r * (0.8 + rand() * 0.3));

  return {
    dates,
    revenue,
    previous,
    kpis: {
      revenue: { value: money(revTotal), delta: (revTotal / prevTotal - 1) * 100, series: revenue },
      orders: { value: Math.round(sum(orders)).toLocaleString(), delta: 4 + rand() * 10, series: orders },
      visitors: { value: compact(sum(visitors)), delta: -2 + rand() * 12, series: visitors },
      conversion: {
        value: ((sum(orders) / sum(visitors)) * 100).toFixed(2) + "%",
        delta: -3 + rand() * 5,
        series: orders.map((o, i) => o / visitors[i]),
      },
    },
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, i) => ({
      label,
      value: Math.round((days / 7) * (18 + rand() * 20) * (i === 4 || i === 5 ? 1.35 : 1)),
    })),
    sources: [
      { label: "Organic search", value: 38 + rand() * 6, color: "--c1" },
      { label: "Direct", value: 22 + rand() * 5, color: "--c2" },
      { label: "Social", value: 16 + rand() * 6, color: "--c3" },
      { label: "Referral", value: 10 + rand() * 4, color: "--c4" },
      { label: "Email", value: 6 + rand() * 4, color: "--c5" },
    ],
    sessions: Math.round(sum(visitors) * 1.3),
    products: [
      { icon: "🎧", name: "Wireless Headphones", value: revTotal * 0.24 },
      { icon: "⌚", name: "Smart Watch S2", value: revTotal * 0.19 },
      { icon: "💻", name: "Laptop Stand Pro", value: revTotal * 0.13 },
      { icon: "📷", name: "Mini Action Cam", value: revTotal * 0.09 },
      { icon: "🔋", name: "Power Bank 20K", value: revTotal * 0.06 },
    ],
  };
};

// ---------- KPI cards + sparklines ----------

const renderKpis = () => {
  document.querySelectorAll(".kpi").forEach((card) => {
    const kpi = data.kpis[card.dataset.kpi];
    card.querySelector(".kpi-value").textContent = kpi.value;

    const delta = card.querySelector(".delta");
    const up = kpi.delta >= 0;
    delta.className = `delta ${up ? "up" : "down"}`;
    delta.textContent = `${up ? "▲" : "▼"} ${Math.abs(kpi.delta).toFixed(1)}%`;

    const svg = card.querySelector(".spark");
    svg.innerHTML = "";
    const s = kpi.series;
    const min = Math.min(...s);
    const max = Math.max(...s);
    const pts = s.map((v, i) => [(i / (s.length - 1)) * 120, 32 - ((v - min) / (max - min || 1)) * 26]);
    const color = cssVar(up ? "--up" : "--down");
    const id = `spark-${card.dataset.kpi}`;

    const defs = el("defs", {}, svg);
    const grad = el("linearGradient", { id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el("stop", { offset: 0, "stop-color": color, "stop-opacity": 0.35 }, grad);
    el("stop", { offset: 1, "stop-color": color, "stop-opacity": 0 }, grad);

    const line = smoothPath(pts);
    el("path", { d: `${line} L120,36 L0,36 Z`, fill: `url(#${id})`, class: "fade-in" }, svg);
    el("path", { d: line, fill: "none", stroke: color, "stroke-width": 2, "vector-effect": "non-scaling-stroke", class: "fade-in" }, svg);
  });
};

// ---------- Line chart ----------

const lineBox = document.getElementById("lineChart");
const lineSvg = lineBox.querySelector("svg");
const lineTip = lineBox.querySelector(".tooltip");
let linePoints = [];

const renderLine = () => {
  const W = lineBox.clientWidth;
  const H = lineBox.clientHeight;
  const pad = { t: 10, r: 10, b: 28, l: 48 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  lineSvg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  lineSvg.innerHTML = "";

  const max = Math.max(...data.revenue, ...data.previous) * 1.1;
  const x = (i) => pad.l + (i / (data.revenue.length - 1)) * innerW;
  const y = (v) => pad.t + innerH - (v / max) * innerH;

  // Gradient for the area fill
  const defs = el("defs", {}, lineSvg);
  const grad = el("linearGradient", { id: "areaGrad", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el("stop", { offset: 0, "stop-color": cssVar("--c1"), "stop-opacity": 0.35 }, grad);
  el("stop", { offset: 1, "stop-color": cssVar("--c1"), "stop-opacity": 0 }, grad);

  // Horizontal grid + Y labels
  const ticks = 4;
  for (let i = 0; i <= ticks; i++) {
    const v = (max / ticks) * i;
    el("line", { x1: pad.l, x2: W - pad.r, y1: y(v), y2: y(v), class: "grid-line" }, lineSvg);
    const label = el("text", { x: pad.l - 10, y: y(v) + 4, "text-anchor": "end", class: "axis-label" }, lineSvg);
    label.textContent = "$" + compact(v);
  }

  // X labels (about 6 evenly spaced dates)
  const step = Math.max(1, Math.round(data.dates.length / 6));
  data.dates.forEach((d, i) => {
    if (i % step !== 0 && i !== data.dates.length - 1) return;
    const label = el("text", { x: x(i), y: H - 6, "text-anchor": "middle", class: "axis-label" }, lineSvg);
    label.textContent = d.toLocaleDateString("en", { month: "short", day: "numeric" });
  });

  linePoints = data.revenue.map((v, i) => [x(i), y(v)]);
  const prevPoints = data.previous.map((v, i) => [x(i), y(v)]);
  const mainPath = smoothPath(linePoints);

  el("path", { d: `${mainPath} L${x(data.revenue.length - 1)},${pad.t + innerH} L${pad.l},${pad.t + innerH} Z`, class: "area-main fade-in" }, lineSvg);
  animateStroke(el("path", { d: smoothPath(prevPoints), class: "line-prev" }, lineSvg));
  animateStroke(el("path", { d: mainPath, class: "line-main" }, lineSvg));

  // Hover elements
  el("line", { y1: pad.t, y2: pad.t + innerH, class: "crosshair" }, lineSvg);
  el("circle", { r: 6, class: "hover-dot" }, lineSvg);
};

lineBox.addEventListener("mousemove", (e) => {
  if (!linePoints.length) return;
  const rect = lineBox.getBoundingClientRect();
  const mx = e.clientX - rect.left;

  // Find the nearest data point on the X axis
  let idx = 0;
  let best = Infinity;
  linePoints.forEach(([px], i) => {
    const dist = Math.abs(px - mx);
    if (dist < best) {
      best = dist;
      idx = i;
    }
  });

  const [px, py] = linePoints[idx];
  const cross = lineSvg.querySelector(".crosshair");
  cross.setAttribute("x1", px);
  cross.setAttribute("x2", px);
  const dot = lineSvg.querySelector(".hover-dot");
  dot.setAttribute("cx", px);
  dot.setAttribute("cy", py);

  const change = (data.revenue[idx] / data.previous[idx] - 1) * 100;
  lineTip.innerHTML = `
    <b>${data.dates[idx].toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}</b>
    <div><span>This period</span><span>${money(data.revenue[idx])}</span></div>
    <div><span>Last period</span><span>${money(data.previous[idx])}</span></div>
    <div><span>Change</span><span style="color: var(${change >= 0 ? "--up" : "--down"})">${change >= 0 ? "+" : ""}${change.toFixed(1)}%</span></div>`;

  // Keep the tooltip inside the chart box
  const half = lineTip.offsetWidth / 2;
  lineTip.style.left = `${Math.min(Math.max(px, half), rect.width - half)}px`;
  lineTip.style.top = `${py}px`;
  lineBox.classList.add("hovering");
});

lineBox.addEventListener("mouseleave", () => lineBox.classList.remove("hovering"));

// ---------- Bar chart ----------

const barBox = document.getElementById("barChart");
const barSvg = barBox.querySelector("svg");
const barTip = barBox.querySelector(".tooltip");

const renderBars = () => {
  const W = barBox.clientWidth;
  const H = barBox.clientHeight;
  const pad = { t: 10, r: 6, b: 28, l: 40 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  barSvg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  barSvg.innerHTML = "";

  const values = data.weekdays.map((d) => d.value);
  const max = Math.max(...values) * 1.15;
  const peak = Math.max(...values);
  const slot = innerW / values.length;
  const barW = Math.min(slot * 0.55, 46);

  for (let i = 0; i <= 4; i++) {
    const v = (max / 4) * i;
    const yy = pad.t + innerH - (v / max) * innerH;
    el("line", { x1: pad.l, x2: W - pad.r, y1: yy, y2: yy, class: "grid-line" }, barSvg);
    const label = el("text", { x: pad.l - 8, y: yy + 4, "text-anchor": "end", class: "axis-label" }, barSvg);
    label.textContent = compact(v);
  }

  data.weekdays.forEach((d, i) => {
    const h = (d.value / max) * innerH;
    const bx = pad.l + slot * i + (slot - barW) / 2;
    const by = pad.t + innerH - h;
    const bar = el("rect", { x: bx, y: by, width: barW, height: h, rx: 8, class: `bar${d.value === peak ? " peak" : ""}` }, barSvg);
    bar.style.animationDelay = `${i * 70}ms`;

    const label = el("text", { x: bx + barW / 2, y: H - 6, "text-anchor": "middle", class: "axis-label" }, barSvg);
    label.textContent = d.label;

    bar.addEventListener("mouseenter", () => {
      barTip.innerHTML = `<b>${d.label}</b><div><span>Orders</span><span>${d.value.toLocaleString()}</span></div>`;
      barTip.style.left = `${bx + barW / 2}px`;
      barTip.style.top = `${by}px`;
      barBox.classList.add("hovering");
    });
    bar.addEventListener("mouseleave", () => barBox.classList.remove("hovering"));
  });
};

// ---------- Donut ----------

const donutSvg = document.querySelector(".donut");
const donutLegend = document.querySelector(".donut-legend");
const donutValue = document.getElementById("donutValue");
const donutLabel = document.getElementById("donutLabel");

const renderDonut = () => {
  const R = 80;
  const C = 2 * Math.PI * R;
  const GAP = 3;
  const total = data.sources.reduce((a, s) => a + s.value, 0);

  donutSvg.innerHTML = "";
  donutLegend.innerHTML = "";
  donutValue.textContent = compact(data.sessions);
  donutLabel.textContent = "Sessions";

  let offset = 0;
  const segments = data.sources.map((s, i) => {
    const pct = s.value / total;
    const len = Math.max(pct * C - GAP, 0);
    const seg = el("circle", { cx: 100, cy: 100, r: R, class: "donut-seg", stroke: cssVar(s.color) }, donutSvg);
    seg.style.strokeDasharray = `0 ${C}`;
    seg.style.strokeDashoffset = `${-offset}`;
    // Next frame so the dasharray transition runs
    requestAnimationFrame(() => requestAnimationFrame(() => (seg.style.strokeDasharray = `${len} ${C}`)));
    offset += pct * C;

    const li = document.createElement("li");
    li.innerHTML = `<i style="background: var(${s.color})"></i>${s.label}<b>${(pct * 100).toFixed(1)}%</b>`;
    donutLegend.appendChild(li);

    const activate = () => {
      donutSvg.classList.add("dimmed");
      segments.forEach((x) => x.seg.classList.remove("active"));
      donutLegend.querySelectorAll("li").forEach((x) => x.classList.remove("active"));
      seg.classList.add("active");
      li.classList.add("active");
      donutValue.textContent = `${(pct * 100).toFixed(1)}%`;
      donutLabel.textContent = s.label;
    };
    const reset = () => {
      donutSvg.classList.remove("dimmed");
      seg.classList.remove("active");
      li.classList.remove("active");
      donutValue.textContent = compact(data.sessions);
      donutLabel.textContent = "Sessions";
    };

    [seg, li].forEach((node) => {
      node.addEventListener("mouseenter", activate);
      node.addEventListener("mouseleave", reset);
    });

    return { seg, li };
  });
};

// ---------- Top products ----------

const productList = document.querySelector(".products");

const renderProducts = () => {
  const max = data.products[0].value;
  productList.innerHTML = data.products
    .map(
      (p) => `
      <li>
        <span class="p-icon">${p.icon}</span>
        <div>
          <div class="p-name">${p.name}</div>
          <div class="p-bar"><span data-w="${(p.value / max) * 100}"></span></div>
        </div>
        <span class="p-value">${money(p.value)}</span>
      </li>`,
    )
    .join("");
  requestAnimationFrame(() =>
    requestAnimationFrame(() => productList.querySelectorAll(".p-bar span").forEach((s) => (s.style.width = `${s.dataset.w}%`))),
  );
};

// ---------- Render all ----------

const renderAll = () => {
  data = buildData(range);
  renderKpis();
  renderLine();
  renderBars();
  renderDonut();
  renderProducts();
};

rangeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    rangeButtons.forEach((b) => {
      b.classList.toggle("is-active", b === btn);
      b.setAttribute("aria-selected", String(b === btn));
    });
    range = Number(btn.dataset.range);
    renderAll();
  });
});

themeBtn.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  // Colours are read from CSS variables, so redraw with the new theme
  renderAll();
});

// Redraw charts at the new size (debounced)
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    renderLine();
    renderBars();
  }, 150);
});

renderAll();
