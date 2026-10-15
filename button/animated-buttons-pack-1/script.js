const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// 01 · Ripple — a circle grows from the exact point you clicked
document.querySelectorAll(".btn-ripple").forEach((btn) => {
  btn.addEventListener("pointerdown", (e) => {
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2.2;
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  });
});

// 02 · Magnetic — the button (and its label, a bit more) follows the cursor
const MAGNET_STRENGTH = 0.35;
document.querySelectorAll(".btn-magnetic").forEach((btn) => {
  const label = btn.querySelector("span");
  const area = btn.parentElement; // the whole tile pulls the button

  area.addEventListener("pointermove", (e) => {
    if (reduceMotion) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    btn.style.transform = `translate(${x * MAGNET_STRENGTH}px, ${y * MAGNET_STRENGTH}px)`;
    label.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
  });

  area.addEventListener("pointerleave", () => {
    btn.style.transform = "";
    label.style.transform = "";
  });
});

// 05 · Loading → success (replace the timeout with your real request)
document.querySelectorAll(".btn-submit").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.classList.contains("is-loading") || btn.classList.contains("is-done")) return;
    btn.classList.add("is-loading");
    btn.setAttribute("aria-busy", "true");

    setTimeout(() => {
      btn.classList.replace("is-loading", "is-done");
      btn.removeAttribute("aria-busy");
      setTimeout(() => btn.classList.remove("is-done"), 2000);
    }, 1400);
  });
});

// 07 · 3D push — keyboard users get the same press feel
document.querySelectorAll(".btn-push").forEach((btn) => {
  btn.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") btn.classList.add("is-pressed");
  });
  btn.addEventListener("keyup", () => btn.classList.remove("is-pressed"));
});

// 10 · Confetti burst from the button
const CONFETTI_COLORS = ["#ff4ecd", "#7c5cff", "#22d3ee", "#ffb020", "#22c55e", "#ff3d63"];
document.querySelectorAll(".btn-confetti").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (reduceMotion) return;
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    for (let i = 0; i < 36; i++) {
      const piece = document.createElement("span");
      piece.className = "confetti";
      piece.style.left = `${cx}px`;
      piece.style.top = `${cy}px`;
      piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      document.body.appendChild(piece);

      const angle = Math.random() * Math.PI * 2;
      const distance = 70 + Math.random() * 110;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance - 60;
      const spin = (Math.random() - 0.5) * 720;

      piece
        .animate(
          [
            { transform: "translate(-50%, -50%) rotate(0)", opacity: 1 },
            { transform: `translate(${dx}px, ${dy}px) rotate(${spin}deg)`, opacity: 1, offset: 0.7 },
            { transform: `translate(${dx}px, ${dy + 80}px) rotate(${spin * 1.4}deg)`, opacity: 0 },
          ],
          { duration: 1100 + Math.random() * 500, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" },
        )
        .finished.then(() => piece.remove());
    }
  });
});

// 11 · Hold to confirm — fill completes only if you keep holding
const HOLD_MS = 1200;
document.querySelectorAll(".btn-hold").forEach((btn) => {
  const text = btn.querySelector(".text");
  const original = text.textContent;
  let timer;
  btn.style.setProperty("--hold", `${HOLD_MS}ms`);

  const start = () => {
    if (btn.classList.contains("is-done")) return;
    btn.classList.add("is-holding");
    timer = setTimeout(() => {
      btn.classList.replace("is-holding", "is-done");
      text.textContent = "Deleted ✓";
      setTimeout(() => {
        btn.classList.remove("is-done");
        text.textContent = original;
      }, 1800);
    }, HOLD_MS);
  };

  const cancel = () => {
    clearTimeout(timer);
    btn.classList.remove("is-holding");
  };

  btn.addEventListener("pointerdown", start);
  ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => btn.addEventListener(ev, cancel));
  btn.addEventListener("keydown", (e) => {
    if ((e.key === " " || e.key === "Enter") && !e.repeat) {
      e.preventDefault();
      start();
    }
  });
  btn.addEventListener("keyup", cancel);
});

// 12 · Copy to clipboard
document.querySelectorAll(".btn-copy").forEach((btn) => {
  const label = btn.querySelector(".copy-label");
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
    } catch {
      // Clipboard can be blocked (e.g. file:// pages) — the feedback still shows
    }
    btn.classList.add("is-copied");
    label.textContent = "Copied ✓";
    setTimeout(() => {
      btn.classList.remove("is-copied");
      label.textContent = "Copy";
    }, 1600);
  });
});
