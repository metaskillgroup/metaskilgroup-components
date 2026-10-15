// Edit these to change the plans, prices and features
const plans = [
  {
    name: "Starter",
    icon: "🌱",
    description: "For side projects and trying things out.",
    monthly: 0,
    cta: "Start for free",
    features: ["1 project", "5 GB storage", "Community support", "Basic analytics", "Custom domain", "Team members"],
    included: 4,
  },
  {
    name: "Pro",
    icon: "🚀",
    description: "For freelancers and growing products.",
    monthly: 19,
    cta: "Get Pro",
    popular: true,
    features: ["Unlimited projects", "100 GB storage", "Priority email support", "Advanced analytics", "Custom domain", "Up to 5 team members"],
    included: 6,
  },
  {
    name: "Team",
    icon: "🏢",
    description: "For companies that need control and scale.",
    monthly: 49,
    cta: "Contact sales",
    features: ["Everything in Pro", "1 TB storage", "24/7 phone support", "SSO & audit logs", "Custom contracts", "Unlimited team members"],
    included: 6,
  },
];

// Feature comparison rows: [label, starter, pro, team]
const compareRows = [
  ["Projects", "1", "Unlimited", "Unlimited"],
  ["Storage", "5 GB", "100 GB", "1 TB"],
  ["Custom domain", false, true, true],
  ["Advanced analytics", false, true, true],
  ["SSO & audit logs", false, false, true],
  ["Support", "Community", "Email", "24/7 phone"],
];

const YEARLY_DISCOUNT = 0.2;

// Rough rates — replace with your own pricing per currency
const currencies = {
  USD: { symbol: "$", rate: 1 },
  INR: { symbol: "₹", rate: 83 },
  EUR: { symbol: "€", rate: 0.92 },
};

const state = { period: "monthly", currency: "USD" };

const plansEl = document.getElementById("plans");
const billingButtons = document.querySelectorAll(".billing-opt");
const pill = document.querySelector(".billing-pill");
const currencySelect = document.getElementById("currency");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const icon = {
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>',
  cross: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" /></svg>',
};

// Price per month for the current period + currency (rounded)
const priceFor = (plan) => {
  const base = state.period === "yearly" ? plan.monthly * (1 - YEARLY_DISCOUNT) : plan.monthly;
  return Math.round(base * currencies[state.currency].rate);
};

const billedText = (plan) => {
  if (plan.monthly === 0) return "Free forever";
  if (state.period === "monthly") return "";
  const { symbol } = currencies[state.currency];
  return `${symbol}${(priceFor(plan) * 12).toLocaleString()} billed yearly`;
};

const renderPlans = () => {
  plansEl.innerHTML = plans
    .map(
      (plan, i) => `
      <article class="plan ${plan.popular ? "is-popular" : ""}" data-index="${i}">
        ${plan.popular ? '<span class="badge">★ Most popular</span>' : ""}
        <span class="plan-icon" aria-hidden="true">${plan.icon}</span>
        <h2>${plan.name}</h2>
        <p class="plan-desc">${plan.description}</p>
        <div class="price">
          <span class="cur">${currencies[state.currency].symbol}</span>
          <span class="amount" data-value="${priceFor(plan)}">${priceFor(plan).toLocaleString()}</span>
          <span class="per">/ month</span>
        </div>
        <p class="billed">${billedText(plan)}</p>
        <a href="#" class="plan-btn">${plan.cta}</a>
        <ul class="features">
          ${plan.features
            .map((f, k) => `<li class="${k < plan.included ? "" : "off"}">${k < plan.included ? icon.check : icon.cross}${f}</li>`)
            .join("")}
        </ul>
      </article>`,
    )
    .join("");
};

// Smoothly count each price from its old value to the new one
const animatePrices = () => {
  document.querySelectorAll(".plan").forEach((card) => {
    const plan = plans[card.dataset.index];
    const amountEl = card.querySelector(".amount");
    const from = Number(amountEl.dataset.value);
    const to = priceFor(plan);

    card.querySelector(".cur").textContent = currencies[state.currency].symbol;
    card.querySelector(".billed").textContent = billedText(plan);
    amountEl.dataset.value = to;

    if (reduceMotion || from === to) {
      amountEl.textContent = to.toLocaleString();
      return;
    }

    const start = performance.now();
    const duration = 600;
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      amountEl.textContent = Math.round(from + (to - from) * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
};

// Move the gradient pill under the active billing option
const movePill = () => {
  const active = document.querySelector(".billing-opt.is-active");
  pill.style.width = `${active.offsetWidth}px`;
  pill.style.transform = `translateX(${active.offsetLeft}px)`;
};

billingButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.classList.contains("is-active")) return;
    billingButtons.forEach((b) => {
      b.classList.toggle("is-active", b === btn);
      b.setAttribute("aria-checked", b === btn);
    });
    state.period = btn.dataset.period;
    movePill();
    animatePrices();
  });

  // Arrow keys move between the two options (radio group behaviour)
  btn.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const other = [...billingButtons].find((b) => b !== btn);
    other.focus();
    other.click();
  });
});

currencySelect.addEventListener("change", () => {
  state.currency = currencySelect.value;
  animatePrices();
});

// Cursor spotlight on each card
plansEl.addEventListener("pointermove", (e) => {
  const card = e.target.closest(".plan");
  if (!card) return;
  const rect = card.getBoundingClientRect();
  card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
  card.style.setProperty("--my", `${e.clientY - rect.top}px`);
});

// Compare table
const compareToggle = document.querySelector(".compare-toggle");
const compareBox = document.getElementById("compare");

document.getElementById("compare-head").innerHTML = `<tr><th>Feature</th>${plans.map((p) => `<th>${p.name}</th>`).join("")}</tr>`;
document.getElementById("compare-body").innerHTML = compareRows
  .map(
    ([label, ...cells]) =>
      `<tr><td>${label}</td>${cells
        .map((c) => (c === true ? '<td class="yes" aria-label="Included">✓</td>' : c === false ? '<td class="no" aria-label="Not included">—</td>' : `<td>${c}</td>`))
        .join("")}</tr>`,
  )
  .join("");

compareToggle.addEventListener("click", () => {
  const open = compareToggle.getAttribute("aria-expanded") === "true";
  compareToggle.setAttribute("aria-expanded", String(!open));
  compareBox.hidden = open;
});

renderPlans();
movePill();
window.addEventListener("resize", movePill);
document.fonts?.ready.then(movePill);
