// Edit this list to change the slides
const slides = [
  { title: "Neon Horizon", sub: "A MetaSkill Original", genre: "Sci-Fi", year: 2026, rating: 8.7, color: "#ff4d6d", art: "linear-gradient(160deg, #ff4d6d, #7b2ff7 70%, #120824)", icon: "planet", desc: "In a city that never sleeps, a rogue engineer discovers the skyline itself is a signal — and someone is answering." },
  { title: "Deep Blue", sub: "Documentary series", genre: "Nature", year: 2025, rating: 9.1, color: "#22d3ee", art: "linear-gradient(170deg, #22d3ee, #0e4d92 60%, #03111f)", icon: "wave", desc: "Journey 11,000 metres below the surface to meet the creatures that have never seen sunlight." },
  { title: "Golden Hour", sub: "Limited series", genre: "Drama", year: 2026, rating: 8.2, color: "#f59e0b", art: "linear-gradient(165deg, #fcd34d, #f97316 55%, #3b1204)", icon: "sun", desc: "Three siblings return to their family vineyard for one last harvest before it's sold forever." },
  { title: "Wildwood", sub: "Feature film", genre: "Adventure", year: 2024, rating: 7.9, color: "#22c55e", art: "linear-gradient(170deg, #86efac, #15803d 55%, #04160b)", icon: "tree", desc: "A group of teenagers follow an old map into a forest that rearranges itself every night." },
  { title: "Midnight Run", sub: "A MetaSkill Original", genre: "Thriller", year: 2026, rating: 8.5, color: "#a855f7", art: "linear-gradient(160deg, #c084fc, #6d28d9 55%, #12051f)", icon: "moon", desc: "One night, one car, one chance. A getaway driver has six hours to clear her name." },
  { title: "Glacier", sub: "Documentary", genre: "Nature", year: 2025, rating: 8.9, color: "#60a5fa", art: "linear-gradient(170deg, #e0f2fe, #3b82f6 55%, #071a3a)", icon: "peak", desc: "Stunning time-lapse footage captures ten years in the life of the world's fastest-moving glacier." },
  { title: "Ember", sub: "Animated feature", genre: "Fantasy", year: 2026, rating: 8.4, color: "#ef4444", art: "linear-gradient(165deg, #fca5a5, #dc2626 55%, #2a0606)", icon: "flame", desc: "The last dragon's flame is fading, and only a clumsy apprentice knows how to relight it." },
];

// Simple SVG artwork for each poster
const icons = {
  planet: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="26" fill="rgba(255,255,255,.9)"/><ellipse cx="50" cy="50" rx="46" ry="12" fill="none" stroke="rgba(255,255,255,.8)" stroke-width="3" transform="rotate(-20 50 50)"/></svg>',
  wave: '<svg viewBox="0 0 100 100"><path d="M5 55 Q20 40 35 55 T65 55 T95 55" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M5 70 Q20 55 35 70 T65 70 T95 70" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="5" stroke-linecap="round"/><circle cx="72" cy="28" r="10" fill="#fff"/></svg>',
  sun: '<svg viewBox="0 0 100 100"><circle cx="50" cy="55" r="24" fill="#fff"/><path d="M5 80 H95" stroke="#fff" stroke-width="4"/><path d="M50 15v10M20 30l7 7M80 30l-7 7" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>',
  tree: '<svg viewBox="0 0 100 100"><path d="M50 12 L78 60 H22 Z" fill="rgba(255,255,255,.9)"/><path d="M50 32 L84 80 H16 Z" fill="#fff"/><rect x="45" y="80" width="10" height="12" fill="#fff"/></svg>',
  moon: '<svg viewBox="0 0 100 100"><path d="M64 18 A34 34 0 1 0 82 70 A28 28 0 1 1 64 18Z" fill="#fff"/><circle cx="24" cy="24" r="2" fill="#fff"/><circle cx="84" cy="30" r="1.5" fill="#fff"/></svg>',
  peak: '<svg viewBox="0 0 100 100"><path d="M5 85 L38 30 L55 55 L68 40 L95 85 Z" fill="#fff"/><path d="M38 30 L47 45 L42 42 L35 48 Z" fill="rgba(0,0,0,.2)"/></svg>',
  flame: '<svg viewBox="0 0 100 100"><path d="M50 10 C62 32 78 42 74 64 A24 24 0 0 1 26 64 C24 50 36 42 38 30 C44 40 48 42 50 10Z" fill="#fff"/><path d="M50 48 C56 58 62 62 60 72 A10 10 0 0 1 40 72 C40 64 46 60 50 48Z" fill="rgba(255,255,255,.5)"/></svg>',
};

const AUTOPLAY_MS = 5000;

const root = document.documentElement;
const coverflow = document.querySelector(".coverflow");
const stage = document.querySelector(".stage");
const dotsBox = document.querySelector(".dots");
const details = document.querySelector(".details");
const autoplayBtn = document.querySelector(".autoplay");
const listBtn = document.querySelector(".btn-list");

let current = 0;
let dragOffset = 0; // fractional slide offset while dragging
let paused = false;
let elapsed = 0;
let lastTick = performance.now();

// ---------- Build slides + dots ----------
const slideEls = slides.map((s, i) => {
  const el = document.createElement("div");
  el.className = "slide";
  el.setAttribute("role", "group");
  el.setAttribute("aria-label", `${i + 1} of ${slides.length}: ${s.title}`);
  el.innerHTML = `
    <div class="poster" style="--art: ${s.art}">
      <span class="poster-badge">${s.genre}</span>
      ${icons[s.icon]}
      <span class="poster-title">${s.title}</span>
      <span class="poster-sub">${s.sub}</span>
    </div>`;
  stage.appendChild(el);

  const dot = document.createElement("button");
  dot.setAttribute("aria-label", `Go to ${s.title}`);
  dot.addEventListener("click", () => goTo(i));
  dotsBox.appendChild(dot);

  return el;
});

const dots = [...dotsBox.children];

// ---------- Layout ----------
// Position every slide relative to the active one (plus any drag offset)
const layout = () => {
  const spacing = window.innerWidth < 640 ? 110 : 170;
  const n = slides.length;

  slideEls.forEach((el, i) => {
    // Shortest distance around the loop, so the carousel wraps infinitely
    let offset = i - current + dragOffset;
    if (offset > n / 2) offset -= n;
    if (offset < -n / 2) offset += n;

    const abs = Math.abs(offset);
    const sign = Math.sign(offset);
    const rotate = Math.max(-1, Math.min(1, offset)) * -50;
    const x = sign * (Math.min(abs, 1) * spacing * 1.1 + Math.max(abs - 1, 0) * spacing * 0.55);
    const z = -Math.min(abs, 3) * 140;

    el.style.transform = `translateX(${x}px) translateZ(${z}px) rotateY(${rotate}deg)`;
    el.style.zIndex = String(100 - Math.round(abs * 10));
    el.style.opacity = abs > 3.2 ? "0" : "1";
    el.style.filter = `brightness(${1 - Math.min(abs, 3) * 0.2})`;
    el.classList.toggle("active", Math.round(offset) === 0 && dragOffset === 0);
  });
};

// ---------- Details panel ----------
const updateDetails = () => {
  const s = slides[current];
  details.classList.add("changing");
  setTimeout(() => {
    details.querySelector(".genre").textContent = s.genre;
    details.querySelector(".year").textContent = s.year;
    details.querySelector(".rating").textContent = s.rating;
    details.querySelector(".title").textContent = s.title;
    details.querySelector(".desc").textContent = s.desc;
    listBtn.classList.remove("added");
    listBtn.textContent = "+ My list";
    details.classList.remove("changing");
  }, 250);
  root.style.setProperty("--tint", s.color);
  dots.forEach((d, i) => {
    d.classList.toggle("active", i === current);
    d.setAttribute("aria-selected", String(i === current));
  });
};

function goTo(index) {
  current = (index + slides.length) % slides.length;
  dragOffset = 0;
  elapsed = 0;
  layout();
  updateDetails();
}

document.querySelector(".prev").addEventListener("click", () => goTo(current - 1));
document.querySelector(".next").addEventListener("click", () => goTo(current + 1));

coverflow.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") goTo(current - 1);
  if (e.key === "ArrowRight") goTo(current + 1);
});

listBtn.addEventListener("click", () => {
  const added = listBtn.classList.toggle("added");
  listBtn.textContent = added ? "✓ Added" : "+ My list";
});

// ---------- Drag / swipe ----------
let startX = 0;
let dragging = false;
let moved = false;

stage.addEventListener("pointerdown", (e) => {
  dragging = true;
  moved = false;
  startX = e.clientX;
  stage.setPointerCapture(e.pointerId);
});

stage.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const dx = e.clientX - startX;
  if (Math.abs(dx) > 5) {
    moved = true;
    stage.classList.add("dragging");
  }
  const spacing = window.innerWidth < 640 ? 110 : 170;
  dragOffset = dx / (spacing * 1.2);
  layout();
});

const endDrag = (e) => {
  if (!dragging) return;
  dragging = false;
  stage.classList.remove("dragging");

  if (moved) {
    // Snap to the nearest slide
    const steps = Math.round(-dragOffset);
    goTo(current + steps);
    return;
  }

  // A tap without movement: jump to the slide under the pointer
  dragOffset = 0;
  const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest(".slide");
  if (hit) goTo(slideEls.indexOf(hit));
  else layout();
};

stage.addEventListener("pointerup", endDrag);
stage.addEventListener("pointercancel", endDrag);

// Mouse wheel / trackpad horizontal scroll
let wheelLock = false;
coverflow.addEventListener(
  "wheel",
  (e) => {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : 0;
    if (!delta || wheelLock) return;
    e.preventDefault();
    wheelLock = true;
    goTo(current + (delta > 0 ? 1 : -1));
    setTimeout(() => (wheelLock = false), 450);
  },
  { passive: false },
);

// ---------- Autoplay ----------
const setPaused = (value) => {
  paused = value;
  autoplayBtn.classList.toggle("paused", paused);
  autoplayBtn.setAttribute("aria-label", paused ? "Start autoplay" : "Pause autoplay");
};

autoplayBtn.addEventListener("click", () => setPaused(!paused));

let hovering = false;
coverflow.addEventListener("mouseenter", () => (hovering = true));
coverflow.addEventListener("mouseleave", () => (hovering = false));

const tick = (now) => {
  const dt = now - lastTick;
  lastTick = now;
  if (!paused && !hovering && !dragging && !document.hidden) {
    elapsed += dt;
    if (elapsed >= AUTOPLAY_MS) goTo(current + 1);
  }
  autoplayBtn.style.setProperty("--p", Math.min(elapsed / AUTOPLAY_MS, 1));
  requestAnimationFrame(tick);
};

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPaused(true);

window.addEventListener("resize", layout);
goTo(0);
requestAnimationFrame(tick);
