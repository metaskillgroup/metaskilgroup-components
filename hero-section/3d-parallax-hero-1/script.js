const hero = document.querySelector(".hero");
const devices = document.querySelector(".devices");
const blobs = document.querySelectorAll(".blob");
const words = document.querySelectorAll(".rotator .word");
const track = document.querySelector(".marquee-track");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Rotating headline word
let current = 0;
if (!reduceMotion) {
  setInterval(() => {
    const prev = words[current];
    current = (current + 1) % words.length;
    const next = words[current];

    prev.classList.remove("is-active");
    prev.classList.add("is-leaving");
    next.classList.remove("is-leaving");
    next.classList.add("is-active");

    // Reset the leaving word below the line so it can slide in again later
    setTimeout(() => prev.classList.remove("is-leaving"), 600);
  }, 2200);
}

// Mouse-driven 3D tilt for the devices + parallax for the background blobs
const BASE_RX = 8;
const BASE_RY = -18;

const tilt = (x, y) => {
  // x, y are in the range -0.5 .. 0.5
  devices.style.setProperty("--rx", `${BASE_RX - y * 16}deg`);
  devices.style.setProperty("--ry", `${BASE_RY + x * 28}deg`);
  blobs.forEach((blob) => {
    const depth = Number(blob.dataset.depth);
    blob.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
  });
};

if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
  hero.addEventListener("mousemove", (e) => {
    const rect = hero.getBoundingClientRect();
    tilt((e.clientX - rect.left) / rect.width - 0.5, (e.clientY - rect.top) / rect.height - 0.5);
  });
  hero.addEventListener("mouseleave", () => tilt(0, 0));
}

// Duplicate logos so the marquee loops seamlessly
track.innerHTML += track.innerHTML;
