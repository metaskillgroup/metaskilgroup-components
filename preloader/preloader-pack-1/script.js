// Each preloader = build (markup) + run (the "loading" part) + exit (the reveal).
// Use one on your own site like this:
//   const root = loaders.counter.build(overlay);
//   await loaders.counter.run(root);   // or wait for your real assets
//   await loaders.counter.exit(root);

const BRAND = "METASKILL"; // letters for the wave loader
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const loaders = {
  counter: {
    build(container) {
      container.insertAdjacentHTML(
        "beforeend",
        `<div class="loader ld-counter">
          <div class="box">
            <div class="label"><span>Loading experience</span><span>2026</span></div>
            <span class="num">0<small>%</small></span>
            <div class="bar"><i></i></div>
          </div>
        </div>`,
      );
      return container.lastElementChild;
    },
    // Counts to 100 in uneven steps so it feels like real loading
    run(root, duration = 2400) {
      const num = root.querySelector(".num");
      const bar = root.querySelector(".bar");
      return new Promise((resolve) => {
        let value = 0;
        const tick = () => {
          value = Math.min(100, value + Math.ceil(Math.random() * 9));
          num.innerHTML = `${value}<small>%</small>`;
          bar.style.setProperty("--p", value / 100);
          if (value < 100) setTimeout(tick, duration / 22 + Math.random() * 60);
          else setTimeout(resolve, 250);
        };
        tick();
      });
    },
    exit(root) {
      return root.animate([{ transform: "translateY(0)" }, { transform: "translateY(-100%)" }], {
        duration: 800,
        easing: "cubic-bezier(0.76, 0, 0.24, 1)",
        fill: "forwards",
      }).finished;
    },
  },

  morph: {
    build(container) {
      container.insertAdjacentHTML(
        "beforeend",
        `<div class="loader ld-morph">
          <div class="inner">
            <div class="shape"></div>
            <div class="dots"><i></i><i></i><i></i></div>
            <p>Preparing your space</p>
          </div>
        </div>`,
      );
      return container.lastElementChild;
    },
    run: () => wait(2600),
    // The whole screen shrinks into a circle and disappears
    exit(root) {
      return root.animate(
        [{ clipPath: "circle(75% at 50% 50%)" }, { clipPath: "circle(0% at 50% 50%)" }],
        { duration: 800, easing: "cubic-bezier(0.7, 0, 0.3, 1)", fill: "forwards" },
      ).finished;
    },
  },

  stripes: {
    build(container) {
      const letters = [...BRAND].map((ch, i) => `<span style="--i:${i}">${ch}</span>`).join("");
      container.insertAdjacentHTML(
        "beforeend",
        `<div class="loader ld-stripes">
          <div class="stripes">${"<i></i>".repeat(7)}</div>
          <div class="word">${letters}</div>
          <p class="hint">Loading</p>
        </div>`,
      );
      return container.lastElementChild;
    },
    run: () => wait(2400),
    // Text fades, then each stripe drops one after another
    async exit(root) {
      const text = [root.querySelector(".word"), root.querySelector(".hint")];
      await Promise.all(text.map((el) => el.animate([{ opacity: 1 }, { opacity: 0, transform: "translateY(-12px)" }], { duration: 300, fill: "forwards" }).finished));
      const stripes = [...root.querySelectorAll(".stripes i")];
      await Promise.all(
        stripes.map(
          (s, i) =>
            s.animate([{ transform: "translateY(0)" }, { transform: "translateY(100%)" }], {
              duration: 650,
              delay: i * 70,
              easing: "cubic-bezier(0.7, 0, 0.3, 1)",
              fill: "forwards",
            }).finished,
        ),
      );
    },
  },
};

// ---------- Fullscreen playback ----------
const overlay = document.getElementById("overlay");
let busy = false;

const playFullscreen = async (name) => {
  if (busy) return;
  busy = true;
  document.body.classList.add("is-loading");
  const loader = loaders[name];
  const root = loader.build(overlay);
  await loader.run(root);
  if (!reduceMotion) await loader.exit(root);
  root.remove();
  document.body.classList.remove("is-loading");
  busy = false;
};

document.querySelectorAll("[data-play]").forEach((btn) => {
  btn.addEventListener("click", () => playFullscreen(btn.dataset.play));
});

// ---------- Looping previews inside the cards ----------
// A tiny fake page sits behind each loader so the reveal has something to show
const MINI_SITE = `
  <div class="mini-site" aria-hidden="true">
    <div class="ms-nav"><i></i><i></i><i></i><i></i></div>
    <div class="ms-hero"><b></b><b></b><i></i></div>
    <div class="ms-cards"><i></i><i></i><i></i></div>
  </div>`;

const loopPreview = async (stage) => {
  const loader = loaders[stage.dataset.loader];
  stage.innerHTML = MINI_SITE;
  for (;;) {
    const root = loader.build(stage);
    await loader.run(root);
    if (reduceMotion) return;
    await loader.exit(root);
    await wait(1400);
    root.remove();
  }
};

document.querySelectorAll(".stage").forEach((stage, i) => setTimeout(() => loopPreview(stage), i * 500));

// Play the counter preloader once when the page opens
if (!reduceMotion) playFullscreen("counter");
