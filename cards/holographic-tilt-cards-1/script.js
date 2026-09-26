const cards = document.querySelectorAll(".card");
const MAX_TILT = 16; // degrees

cards.forEach((card) => {
  let resetTimer;

  const update = (e) => {
    const rect = card.getBoundingClientRect();
    // Pointer position inside the card, 0..1
    const x = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1);
    const dx = x - 0.5;
    const dy = y - 0.5;

    // Flipped cards mirror horizontally, so invert the Y rotation
    const flip = card.classList.contains("flipped") ? -1 : 1;

    card.style.setProperty("--rx", `${-dy * MAX_TILT * 2}deg`);
    card.style.setProperty("--ry", `${dx * MAX_TILT * 2 * flip}deg`);
    card.style.setProperty("--px", `${x * 100}%`);
    card.style.setProperty("--py", `${y * 100}%`);
    // Distance from the centre drives how strong the foil looks
    card.style.setProperty("--hyp", Math.min(Math.hypot(dx, dy) * 2, 1).toFixed(2));
  };

  card.addEventListener("pointerenter", () => {
    clearTimeout(resetTimer);
    card.classList.add("active");
  });

  card.addEventListener("pointermove", update);

  card.addEventListener("pointerleave", () => {
    card.classList.remove("active");
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
    resetTimer = setTimeout(() => {
      card.style.setProperty("--px", "50%");
      card.style.setProperty("--py", "50%");
    }, 400);
  });

  // Flip on click / tap / keyboard
  const flip = () => card.classList.toggle("flipped");
  card.addEventListener("click", flip);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      flip();
    }
  });
});
