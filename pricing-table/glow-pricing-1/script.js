const billing = document.querySelector(".billing");
const options = document.querySelectorAll(".billing-opt");
const amounts = document.querySelectorAll(".amount");
const billedLabels = document.querySelectorAll(".billed");
const plans = document.querySelectorAll(".plan");
const compare = document.querySelector(".compare");
const compareToggle = document.querySelector(".compare-toggle");

// Animate a number from its current value to the target
const countTo = (el, target) => {
  const start = Number(el.textContent);
  const duration = 600;
  const startTime = performance.now();

  const step = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + (target - start) * eased);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

// Monthly / yearly switch
options.forEach((btn) => {
  btn.addEventListener("click", () => {
    const period = btn.dataset.period;

    options.forEach((o) => {
      const active = o === btn;
      o.classList.toggle("is-active", active);
      o.setAttribute("aria-checked", String(active));
    });
    billing.classList.toggle("yearly", period === "yearly");

    amounts.forEach((el) => countTo(el, Number(el.dataset[period])));
    billedLabels.forEach((el) => (el.textContent = el.dataset[period]));
  });
});

// Cursor spotlight on each plan card
plans.forEach((plan) => {
  plan.addEventListener("mousemove", (e) => {
    const rect = plan.getBoundingClientRect();
    plan.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    plan.style.setProperty("--my", `${e.clientY - rect.top}px`);
  });
});

// Expand / collapse the comparison table
compareToggle.addEventListener("click", () => {
  const open = compare.classList.toggle("open");
  compareToggle.setAttribute("aria-expanded", String(open));
});
