// ---------- Content (edit freely) ----------
const STEPS = ["Account", "Profile", "Plan", "Review"];
const AVATARS = [
  { emoji: "🦊", c: "#ffe1cc" },
  { emoji: "🐼", c: "#ececec" },
  { emoji: "🐸", c: "#dcfce7" },
  { emoji: "🦄", c: "#f3e8ff" },
  { emoji: "🐙", c: "#ffe4e6" },
  { emoji: "🐧", c: "#dbeafe" },
];
const PLANS = [
  { id: "free", name: "Free", monthly: 0, desc: "1 project and community support" },
  { id: "pro", name: "Pro", monthly: 499, desc: "Unlimited projects and a custom domain" },
  { id: "team", name: "Team", monthly: 1299, desc: "Everything in Pro plus 10 seats" },
];
const ADDONS = [
  { id: "support", name: "Priority support", monthly: 199, desc: "Replies in under an hour" },
  { id: "storage", name: "Extra 100 GB storage", monthly: 149, desc: "For big media libraries" },
];
const YEARLY_DISCOUNT = 0.2;
const DRAFT_KEY = "craftly-onboarding";

// ---------- State ----------
const $ = (id) => document.getElementById(id);
const form = $("wizard");
const steps = [...document.querySelectorAll(".step")];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const blank = () => ({ name: "", email: "", avatar: 0, role: "", team: "", goals: [], billing: "monthly", plan: "pro", addons: [], terms: false });
let data = blank();
let password = ""; // never saved to the draft
let current = 0;

const inr = (n) => `₹${n.toLocaleString("en-IN")}`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// ---------- Draft (localStorage) ----------
const saveDraft = () => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ data, step: current }));
  } catch {
    /* storage blocked */
  }
};
const loadDraft = () => {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY));
  } catch {
    return null;
  }
};
const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* storage blocked */
  }
};

// ---------- Stepper ----------
$("stepper").insertAdjacentHTML(
  "beforeend",
  STEPS.map((s, i) => `<li class="s" data-i="${i}"><button type="button" aria-label="Step ${i + 1}: ${s}" tabindex="-1">${i + 1}</button><span>${s}</span></li>`).join(""),
);

const paintStepper = () => {
  document.querySelectorAll(".s").forEach((li, i) => {
    li.classList.toggle("is-current", i === current);
    li.classList.toggle("is-done", i < current);
    const btn = li.querySelector("button");
    btn.textContent = i < current ? "✓" : i + 1;
    btn.tabIndex = i < current ? 0 : -1;
    i === current ? btn.setAttribute("aria-current", "step") : btn.removeAttribute("aria-current");
  });
  $("track-fill").style.setProperty("--progress", `${(current / (STEPS.length - 1)) * 100}%`);
  $("step-count").textContent = `Step ${current + 1} of ${STEPS.length}`;
};

$("stepper").addEventListener("click", (e) => {
  const li = e.target.closest(".s");
  if (li && Number(li.dataset.i) < current) go(Number(li.dataset.i));
});

// ---------- Going between steps ----------
const go = (n) => {
  const dir = n > current ? "enter-right" : "enter-left";
  current = n;
  steps.forEach((s, i) => {
    s.hidden = i !== n;
    s.classList.remove("enter-right", "enter-left");
  });
  void steps[n].offsetWidth;
  steps[n].classList.add(dir);
  if (n === 3) renderReview();
  paintStepper();
  $("back").disabled = n === 0;
  $("next").querySelector(".label").textContent = n === STEPS.length - 1 ? "Create account" : "Continue";
  steps[n].querySelector("input:not([type=checkbox]), button")?.focus({ preventScroll: true });
  saveDraft();
};

$("back").addEventListener("click", () => current > 0 && go(current - 1));

// ---------- Step 1: account ----------
const pwRules = {
  len: (p) => p.length >= 8,
  num: (p) => /\d/.test(p),
  upper: (p) => /[A-Z]/.test(p),
  sym: (p) => /[^A-Za-z0-9]/.test(p),
};
const pwScore = (p) => Object.values(pwRules).filter((r) => r(p)).length;

form.elements.password.addEventListener("input", (e) => {
  password = e.target.value;
  document.querySelector(".meter").dataset.score = password ? pwScore(password) : 0;
  document.querySelectorAll("#pw-checks li").forEach((li) => li.classList.toggle("ok", pwRules[li.dataset.rule](password)));
});
document.querySelector(".eye").addEventListener("click", (e) => {
  const input = form.elements.password;
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  e.currentTarget.setAttribute("aria-pressed", show);
  e.currentTarget.setAttribute("aria-label", show ? "Hide password" : "Show password");
});
["name", "email"].forEach((n) =>
  form.elements[n].addEventListener("input", (e) => {
    data[n] = e.target.value;
    saveDraft();
  }),
);

// ---------- Step 2: avatar + chips ----------
$("avatars").innerHTML = AVATARS.map((a, i) => `<button type="button" role="radio" data-avatar="${i}" style="--c:${a.c}" aria-label="Avatar ${a.emoji}">${a.emoji}</button>`).join("");
$("avatars").addEventListener("click", (e) => {
  const b = e.target.closest("[data-avatar]");
  if (!b) return;
  data.avatar = Number(b.dataset.avatar);
  paintChoices();
  saveDraft();
});

document.querySelectorAll("[data-name]").forEach((group) => {
  const name = group.dataset.name;
  const single = group.hasAttribute("data-single");
  group.querySelectorAll("button").forEach((b) => single && b.setAttribute("role", "radio"));
  group.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (single) data[name] = b.dataset.value;
    else data[name] = data[name].includes(b.dataset.value) ? data[name].filter((v) => v !== b.dataset.value) : [...data[name], b.dataset.value];
    paintChoices();
    group.closest(".field").classList.remove("invalid");
    group.closest(".field").querySelector(".err").textContent = "";
    saveDraft();
  });
});

const paintChoices = () => {
  document.querySelectorAll("[data-avatar]").forEach((b) => b.setAttribute("aria-checked", Number(b.dataset.avatar) === data.avatar));
  document.querySelectorAll("[data-name]").forEach((group) => {
    const v = data[group.dataset.name];
    group.querySelectorAll("button").forEach((b) => {
      const on = Array.isArray(v) ? v.includes(b.dataset.value) : v === b.dataset.value;
      b.setAttribute(group.hasAttribute("data-single") ? "aria-checked" : "aria-pressed", on);
    });
  });
};

// ---------- Step 3: plan, billing, add-ons ----------
const price = (monthly) => (data.billing === "yearly" ? Math.round(monthly * (1 - YEARLY_DISCOUNT)) : monthly);
const total = () => {
  const plan = PLANS.find((p) => p.id === data.plan);
  return price(plan.monthly) + ADDONS.filter((a) => data.addons.includes(a.id)).reduce((s, a) => s + price(a.monthly), 0);
};

const renderPlans = () => {
  $("plans").innerHTML = PLANS.map(
    (p) => `<button type="button" class="plan" role="radio" data-plan="${p.id}" aria-checked="${p.id === data.plan}">
      <b>${p.name}</b><span class="price">${inr(price(p.monthly))}<small> /mo</small></span><p>${p.desc}</p></button>`,
  ).join("");
  $("addons").innerHTML = ADDONS.map(
    (a) => `<label class="addon"><input type="checkbox" data-addon="${a.id}" ${data.addons.includes(a.id) ? "checked" : ""} />
      <div><b>${a.name}</b><small>${a.desc}</small></div><b>+${inr(price(a.monthly))}</b></label>`,
  ).join("");
  document.querySelectorAll("[data-billing]").forEach((b) => b.setAttribute("aria-checked", b.dataset.billing === data.billing));
  $("total").textContent = inr(total());
  $("total-note").textContent = data.billing === "yearly" ? `/ month, ${inr(total() * 12)} billed yearly` : "/ month";
};

$("plans").addEventListener("click", (e) => {
  const b = e.target.closest("[data-plan]");
  if (!b) return;
  data.plan = b.dataset.plan;
  renderPlans();
  saveDraft();
});
$("addons").addEventListener("change", (e) => {
  const id = e.target.dataset.addon;
  data.addons = e.target.checked ? [...data.addons, id] : data.addons.filter((a) => a !== id);
  renderPlans();
  saveDraft();
});
document.querySelectorAll("[data-billing]").forEach((b) =>
  b.addEventListener("click", () => {
    data.billing = b.dataset.billing;
    renderPlans();
    saveDraft();
  }),
);

// ---------- Step 4: review ----------
const renderReview = () => {
  const plan = PLANS.find((p) => p.id === data.plan);
  const addons = ADDONS.filter((a) => data.addons.includes(a.id)).map((a) => a.name).join(", ") || "None";
  const sec = (title, step, rows) =>
    `<section class="r-sec"><h3>${title}</h3><button type="button" data-edit="${step}">Edit</button><dl>${rows
      .map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`)
      .join("")}</dl></section>`;
  $("review").innerHTML =
    sec("Account", 0, [["Name", data.name], ["Email", data.email], ["Password", "•".repeat(Math.max(password.length, 8))]]) +
    sec("Profile", 1, [["Avatar", AVATARS[data.avatar].emoji], ["Role", data.role], ["Team", data.team], ["Building", data.goals.join(", ")]]) +
    sec("Plan", 2, [["Plan", `${plan.name} · ${data.billing}`], ["Add-ons", addons], ["Total", `${inr(total())} / month`]]);
};
$("review").addEventListener("click", (e) => {
  const b = e.target.closest("[data-edit]");
  if (b) go(Number(b.dataset.edit));
});
form.elements.terms.addEventListener("change", (e) => {
  data.terms = e.target.checked;
  if (data.terms) $("terms-err").textContent = "";
});

// ---------- Validation ----------
const setErr = (field, msg) => {
  field.classList.toggle("invalid", Boolean(msg));
  field.querySelector(".err").textContent = msg;
  return !msg;
};

const validators = [
  () => {
    const f = (n) => form.elements[n].closest(".field");
    const ok = [
      setErr(f("name"), data.name.trim().length < 2 ? "Please enter your name." : ""),
      setErr(f("email"), !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email.trim()) ? "Enter a valid email address." : ""),
      setErr(f("password"), pwScore(password) < 3 ? "Use a stronger password (meet 3 of the 4 rules)." : ""),
    ];
    return ok.every(Boolean);
  },
  () => {
    const field = (n) => document.querySelector(`[data-name="${n}"]`).closest(".field");
    return [
      setErr(field("role"), data.role ? "" : "Pick the role that fits best."),
      setErr(field("team"), data.team ? "" : "How big is your team?"),
      setErr(field("goals"), data.goals.length ? "" : "Choose at least one."),
    ].every(Boolean);
  },
  () => true,
  () => {
    $("terms-err").textContent = data.terms ? "" : "Please accept the terms to continue.";
    return data.terms;
  },
];

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validators[current]()) {
    const next = $("next");
    next.classList.remove("shake");
    void next.offsetWidth;
    next.classList.add("shake");
    steps[current].querySelector(".invalid input, .invalid button")?.focus();
    return;
  }
  if (current < STEPS.length - 1) return go(current + 1);
  finish();
});

// ---------- Finish ----------
const finish = () => {
  const next = $("next");
  next.classList.add("is-loading");
  next.disabled = true;
  // Fake request — replace with your API call
  setTimeout(() => {
    steps.forEach((s) => (s.hidden = true));
    $("wiz-foot").hidden = true;
    $("draft").hidden = true;
    $("success-name").textContent = data.name.trim().split(" ")[0] || "friend";
    $("success").hidden = false;
    current = STEPS.length;
    document.querySelectorAll(".s").forEach((li) => {
      li.classList.add("is-done");
      li.classList.remove("is-current");
      li.querySelector("button").textContent = "✓";
    });
    $("track-fill").style.setProperty("--progress", "100%");
    $("step-count").textContent = "All done";
    clearDraft();
    confetti();
  }, 1200);
};

// ---------- Confetti (canvas, no library) ----------
const confetti = () => {
  if (reduceMotion) return;
  const canvas = $("confetti");
  const ctx = canvas.getContext("2d");
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  const colors = ["#ff6b1a", "#ff2e93", "#7c3aed", "#16a34a", "#facc15", "#38bdf8"];
  const parts = Array.from({ length: 160 }, () => ({
    x: innerWidth / 2,
    y: innerHeight / 2.4,
    vx: (Math.random() - 0.5) * 16,
    vy: -Math.random() * 14 - 4,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    w: 6 + Math.random() * 6,
    h: 8 + Math.random() * 8,
    c: colors[Math.floor(Math.random() * colors.length)],
  }));
  const startT = performance.now();
  const frame = (t) => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    parts.forEach((p) => {
      p.vy += 0.35;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (t - startT < 3500) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, innerWidth, innerHeight);
  };
  requestAnimationFrame(frame);
};

// ---------- Start (restore a draft if there is one) ----------
const fill = () => {
  form.elements.name.value = data.name;
  form.elements.email.value = data.email;
  form.elements.terms.checked = data.terms;
  paintChoices();
  renderPlans();
};

$("start-over").addEventListener("click", () => {
  clearDraft();
  data = blank();
  password = "";
  form.reset();
  document.querySelector(".meter").dataset.score = 0;
  document.querySelectorAll("#pw-checks li").forEach((li) => li.classList.remove("ok"));
  $("draft").hidden = true;
  fill();
  go(0);
});

const draft = loadDraft();
if (draft?.data && (draft.data.name || draft.data.email || draft.step > 0)) {
  data = { ...blank(), ...draft.data };
  $("draft").hidden = false;
}
fill();
// Password is never stored, so a restored draft always reopens on step 1 to re-enter it
go(0);
