// Morph timing — tweak to taste
const DURATION = 520;
const EASE = "cubic-bezier(0.65, 0, 0.2, 1)";
const TRIGGER_RADIUS = 14;
const MODAL_RADIUS = 24;

// Lightbox photos (drawn as SVG so no image files are needed — swap for <img> if you like)
const photos = [
  { title: "Dunes at sunset", caption: "Golden hour over the Thar desert.", sky: ["#ff9a5a", "#ffd27a"], sun: "#fff4d6", land: ["#e07a3f", "#b9552b"] },
  { title: "Northern lights", caption: "A green aurora dancing over the fjord.", sky: ["#0b1d3a", "#1f6f6a"], sun: "#c9fff1", land: ["#0e2a3a", "#07131f"] },
  { title: "Lake at dawn", caption: "Soft pink mist rising off still water.", sky: ["#f7b4c8", "#c3d4ff"], sun: "#ffffff", land: ["#7f8fd6", "#5a6bb8"] },
];

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const openedBy = new Map(); // dialog → the trigger that opened it

// Keyframes that make the dialog start exactly on top of the trigger.
// Border radius is divided by the scale so corners stay round while scaled.
const morphFrames = (from, to, fromColor) => {
  const sx = from.width / to.width;
  const sy = from.height / to.height;
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  return [
    {
      transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
      borderRadius: `${TRIGGER_RADIUS / sx}px / ${TRIGGER_RADIUS / sy}px`,
      backgroundColor: fromColor,
    },
    {
      transform: "none",
      borderRadius: `${MODAL_RADIUS}px`,
      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--card").trim(),
    },
  ];
};

const openModal = (trigger) => {
  const dialog = document.getElementById(trigger.dataset.modal);
  const body = dialog.querySelector(".modal-body");
  const from = trigger.getBoundingClientRect();
  const fromColor = getComputedStyle(trigger).backgroundColor;

  openedBy.set(dialog, trigger);
  dialog.dispatchEvent(new Event("beforeopen"));
  dialog.showModal();
  if (reduceMotion) return;

  const to = dialog.getBoundingClientRect();
  trigger.classList.add("is-hidden");

  dialog.animate(morphFrames(from, to, fromColor), { duration: DURATION, easing: EASE });
  // Content fades in during the last part of the morph
  body.animate(
    [
      { opacity: 0, transform: "translateY(10px)" },
      { opacity: 1, transform: "none" },
    ],
    { duration: 280, delay: DURATION * 0.6, easing: "ease-out", fill: "backwards" },
  );
};

const closeModal = async (dialog) => {
  if (!dialog.open || dialog.dataset.closing) return;
  dialog.dataset.closing = "true";
  const trigger = openedBy.get(dialog);
  const body = dialog.querySelector(".modal-body");

  if (!reduceMotion && trigger) {
    dialog.classList.add("is-closing");
    await body.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: "forwards" }).finished;
    const from = trigger.getBoundingClientRect();
    const to = dialog.getBoundingClientRect();
    const frames = morphFrames(from, to, getComputedStyle(trigger).backgroundColor).reverse();
    await dialog.animate(frames, { duration: DURATION * 0.85, easing: EASE, fill: "forwards" }).finished;
  }

  dialog.close();
  [...dialog.getAnimations(), ...body.getAnimations()].forEach((a) => a.cancel());
  dialog.classList.remove("is-closing");
  delete dialog.dataset.closing;
  trigger?.classList.remove("is-hidden");
  trigger?.focus();
};

document.querySelectorAll(".trigger").forEach((trigger) => {
  trigger.addEventListener("click", () => openModal(trigger));
});

document.querySelectorAll(".modal").forEach((dialog) => {
  // Esc key → animated close instead of the instant native one
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeModal(dialog);
  });
  // A click that lands on the dialog itself (not its content) is the backdrop
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) closeModal(dialog);
  });
  dialog.querySelectorAll(".modal-close, [data-close]").forEach((btn) => btn.addEventListener("click", () => closeModal(dialog)));
});

// ---------- Toast ----------
const toast = document.getElementById("toast");
let toastTimer;
const showToast = (message) => {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
};

// ---------- Confirm dialog ----------
const confirmDialog = document.getElementById("modal-confirm");
const confirmInput = document.getElementById("confirm-input");
const confirmBtn = document.getElementById("confirm-delete");

confirmDialog.addEventListener("beforeopen", () => {
  confirmInput.value = "";
  confirmBtn.disabled = true;
});
confirmInput.addEventListener("input", () => {
  confirmBtn.disabled = confirmInput.value.trim() !== "portfolio-site";
});
confirmBtn.addEventListener("click", async () => {
  await closeModal(confirmDialog);
  showToast("🗑️ “portfolio-site” was deleted");
});

// ---------- Form dialog ----------
const formDialog = document.getElementById("modal-form");
const form = document.getElementById("subscribe-form");
const email = document.getElementById("email");
const emailError = document.getElementById("email-error");
const submitBtn = document.getElementById("subscribe-btn");
const success = formDialog.querySelector(".success");

formDialog.addEventListener("beforeopen", () => {
  form.hidden = false;
  success.hidden = true;
  form.reset();
  email.classList.remove("invalid");
  emailError.textContent = "";
  submitBtn.classList.remove("is-loading");
  submitBtn.disabled = false;
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
  email.classList.toggle("invalid", !valid);
  emailError.textContent = valid ? "" : "Please enter a valid email address.";
  if (!valid) {
    email.focus();
    return;
  }

  // Fake request — replace with your API call
  submitBtn.classList.add("is-loading");
  submitBtn.disabled = true;
  setTimeout(() => {
    form.hidden = true;
    success.hidden = false;
    setTimeout(() => closeModal(formDialog), 1800);
  }, 1200);
});

// ---------- Lightbox ----------
const photoDialog = document.getElementById("modal-photo");
const art = document.getElementById("photo-art");
let current = 0;

const photoSVG = ({ sky, sun, land }, i) => `
  <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${photos[i].title}">
    <defs>
      <linearGradient id="sky${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient>
      <linearGradient id="land${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${land[0]}"/><stop offset="1" stop-color="${land[1]}"/></linearGradient>
    </defs>
    <rect width="800" height="500" fill="url(#sky${i})"/>
    <circle cx="${560 - i * 120}" cy="${200 + i * 20}" r="70" fill="${sun}" opacity=".9"/>
    <path d="M0 330 Q160 250 320 320 T640 300 T800 320 V500 H0Z" fill="url(#land${i})" opacity=".75"/>
    <path d="M0 390 Q200 330 400 385 T800 370 V500 H0Z" fill="url(#land${i})"/>
  </svg>`;

const showPhoto = (index) => {
  current = (index + photos.length) % photos.length;
  art.style.opacity = 0;
  setTimeout(() => {
    art.innerHTML = photoSVG(photos[current], current);
    document.getElementById("photo-title").textContent = photos[current].title;
    document.getElementById("photo-caption").textContent = photos[current].caption;
    document.getElementById("photo-count").textContent = `${current + 1} / ${photos.length}`;
    art.style.opacity = 1;
  }, art.innerHTML ? 180 : 0);
};

photoDialog.querySelector(".prev").addEventListener("click", () => showPhoto(current - 1));
photoDialog.querySelector(".next").addEventListener("click", () => showPhoto(current + 1));
photoDialog.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") showPhoto(current - 1);
  if (e.key === "ArrowRight") showPhoto(current + 1);
});

showPhoto(0);
