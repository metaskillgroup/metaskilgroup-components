// ---------- State ----------
const initialCart = [
  { id: 1, icon: "🎧", name: "Aura Wireless Headphones", meta: "Midnight Black", price: 129 },
  { id: 2, icon: "⌚", name: "Pulse Smart Watch", meta: "44mm · Silver", price: 199 },
  { id: 3, icon: "🎒", name: "Nomad Tech Backpack", meta: "Olive · 22L", price: 89 },
];

let cart = initialCart.map((item) => ({ ...item, qty: 1 }));
let step = 0;
let discount = 0;
const TAX = 0.08;
const LAST_FORM_STEP = 3;

// ---------- Elements ----------
const form = document.querySelector(".panels");
const stepper = document.querySelector(".stepper");
const steps = document.querySelectorAll(".step");
const panels = document.querySelectorAll(".panel");
const backBtn = document.querySelector(".back");
const nextBtn = document.querySelector(".next");
const navRow = document.querySelector(".nav-row");
const cartList = document.querySelector(".cart");
const cartEmpty = document.querySelector(".cart-empty");
const sumItems = document.querySelector(".sum-items");
const promoInput = document.querySelector(".promo input");
const promoMsg = document.querySelector(".promo-msg");

const money = (n) => "$" + n.toFixed(2);

// ---------- Totals ----------
const shippingCost = () => Number(form.querySelector('input[name="delivery"]:checked').value);

const totals = () => {
  const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const disc = sub * discount;
  const ship = cart.length ? shippingCost() : 0;
  const tax = (sub - disc) * TAX;
  return { sub, disc, ship, tax, total: sub - disc + ship + tax };
};

const renderSummary = () => {
  const t = totals();
  sumItems.innerHTML = cart
    .map(
      (i) => `<li><span class="thumb">${i.icon}<span class="badge">${i.qty}</span></span>${i.name}<b>${money(i.price * i.qty)}</b></li>`,
    )
    .join("");
  document.querySelector(".t-sub").textContent = money(t.sub);
  document.querySelector(".t-ship").textContent = t.ship ? money(t.ship) : "Free";
  document.querySelector(".t-disc").textContent = "-" + money(t.disc);
  document.querySelector(".t-disc-row").classList.toggle("show", discount > 0);
  document.querySelector(".t-tax").textContent = money(t.tax);
  document.querySelector(".t-total").textContent = money(t.total);
};

// ---------- Cart ----------
const renderCart = () => {
  cartList.innerHTML = cart
    .map(
      (i) => `
      <li class="cart-item" data-id="${i.id}">
        <span class="thumb">${i.icon}</span>
        <div><div class="item-name">${i.name}</div><div class="item-meta">${i.meta}</div></div>
        <div class="qty">
          <button type="button" data-action="dec" aria-label="Decrease quantity">−</button>
          <span>${i.qty}</span>
          <button type="button" data-action="inc" aria-label="Increase quantity">+</button>
        </div>
        <div class="item-right">
          <span class="item-price">${money(i.price * i.qty)}</span>
          <button type="button" class="remove" data-action="remove">Remove</button>
        </div>
      </li>`,
    )
    .join("");
  cartEmpty.style.display = cart.length ? "none" : "block";
  nextBtn.disabled = step === 0 && !cart.length;
  renderSummary();
};

cartList.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const row = btn.closest(".cart-item");
  const item = cart.find((i) => i.id === Number(row.dataset.id));

  if (btn.dataset.action === "inc") item.qty = Math.min(item.qty + 1, 9);
  if (btn.dataset.action === "dec") item.qty = Math.max(item.qty - 1, 1);
  if (btn.dataset.action === "remove") {
    row.classList.add("removing");
    row.addEventListener("animationend", () => {
      cart = cart.filter((i) => i !== item);
      renderCart();
    });
    return;
  }
  renderCart();
});

document.querySelector(".restore").addEventListener("click", () => {
  cart = initialCart.map((item) => ({ ...item, qty: 1 }));
  renderCart();
});

form.querySelectorAll('input[name="delivery"]').forEach((r) => r.addEventListener("change", renderSummary));

// ---------- Promo ----------
document.querySelector(".apply").addEventListener("click", () => {
  const code = promoInput.value.trim().toUpperCase();
  if (code === "META10") {
    discount = 0.1;
    promoMsg.textContent = "10% discount applied 🎉";
    promoMsg.className = "promo-msg ok";
  } else {
    discount = 0;
    promoMsg.textContent = code ? "That code isn't valid" : "Enter a promo code";
    promoMsg.className = "promo-msg bad";
  }
  renderSummary();
});

// ---------- Validation ----------
const validators = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
  zip: (v) => /^\d{5,6}$/.test(v),
  ccnum: (v) => v.replace(/\s/g, "").length === 16,
  cccvv: (v) => /^\d{3}$/.test(v),
  ccexp: (v) => {
    const m = v.match(/^(\d{2})\/(\d{2})$/);
    if (!m) return false;
    const month = Number(m[1]);
    const year = 2000 + Number(m[2]);
    if (month < 1 || month > 12) return false;
    const now = new Date();
    return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
  },
};

const validateField = (input) => {
  const value = input.value.trim();
  const check = validators[input.name];
  const valid = value !== "" && (!check || check(value));
  input.closest(".field").classList.toggle("invalid", !valid);
  return valid;
};

const validatePanel = (index) => {
  const inputs = panels[index].querySelectorAll(".field input");
  let ok = true;
  inputs.forEach((input) => {
    if (!validateField(input)) ok = false;
  });
  const firstBad = panels[index].querySelector(".field.invalid input");
  if (firstBad) firstBad.focus();
  return ok;
};

// Re-check a field once the user starts fixing it
form.addEventListener("input", (e) => {
  const field = e.target.closest(".field");
  if (field && field.classList.contains("invalid")) validateField(e.target);
});

// ---------- Card preview + input formatting ----------
const cc = document.querySelector(".cc");
const ccNum = document.getElementById("ccnum");
const ccExp = document.getElementById("ccexp");
const ccCvv = document.getElementById("cccvv");
const ccName = document.getElementById("ccname");

ccNum.addEventListener("input", () => {
  const digits = ccNum.value.replace(/\D/g, "").slice(0, 16);
  ccNum.value = digits.replace(/(.{4})/g, "$1 ").trim();
  const shown = digits.padEnd(16, "•").replace(/(.{4})/g, "$1 ").trim();
  document.querySelector(".cc-number").textContent = shown;
  document.querySelector(".cc-brand").textContent = digits.startsWith("5") ? "MASTERCARD" : digits.startsWith("3") ? "AMEX" : "VISA";
});

ccExp.addEventListener("input", (e) => {
  let digits = ccExp.value.replace(/\D/g, "").slice(0, 4);
  // Don't re-add the slash while the user is deleting
  if (digits.length >= 3 || (digits.length === 2 && e.inputType !== "deleteContentBackward")) {
    digits = digits.slice(0, 2) + "/" + digits.slice(2);
  }
  ccExp.value = digits;
  document.querySelector(".cc-exp").textContent = ccExp.value || "MM/YY";
});

ccCvv.addEventListener("input", () => {
  ccCvv.value = ccCvv.value.replace(/\D/g, "").slice(0, 3);
  document.querySelector(".cc-cvv").textContent = ccCvv.value.replace(/./g, "•") || "•••";
});

ccName.addEventListener("input", () => {
  document.querySelector(".cc-name").textContent = ccName.value.trim() || "YOUR NAME";
});

// Flip the card while the CVV field is focused
ccCvv.addEventListener("focus", () => cc.classList.add("flipped"));
ccCvv.addEventListener("blur", () => cc.classList.remove("flipped"));

// ---------- Review ----------
const renderReview = () => {
  const v = (name) => form.elements[name].value.trim();
  const delivery = shippingCost() ? "Express (1–2 days)" : "Standard (4–6 days)";
  const last4 = v("ccnum").replace(/\s/g, "").slice(-4);

  document.querySelector(".review").innerHTML = `
    <div class="review-block">
      <header>Items <button type="button" class="edit" data-go="0">Edit</button></header>
      <p>${cart.map((i) => `${i.qty} × ${i.name}`).join("<br>")}</p>
    </div>
    <div class="review-block">
      <header>Ship to <button type="button" class="edit" data-go="1">Edit</button></header>
      <p>${v("fname")} ${v("lname")}<br>${v("address")}, ${v("city")} ${v("zip")}<br>${v("email")}<br>${delivery}</p>
    </div>
    <div class="review-block">
      <header>Payment <button type="button" class="edit" data-go="2">Edit</button></header>
      <p>Card ending in ${last4} · Expires ${v("ccexp")}</p>
    </div>`;
};

document.querySelector(".review").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-go]");
  if (btn) goTo(Number(btn.dataset.go));
});

// ---------- Navigation ----------
function goTo(index) {
  const forward = index > step;
  panels[step].classList.remove("is-active");
  step = index;
  panels[step].classList.toggle("from-left", !forward);
  panels[step].classList.add("is-active");

  steps.forEach((s, i) => {
    s.classList.toggle("is-current", i === step);
    s.classList.toggle("is-done", i < step);
  });
  stepper.style.setProperty("--progress", Math.min(step, LAST_FORM_STEP) / LAST_FORM_STEP);

  backBtn.style.visibility = step > 0 && step <= LAST_FORM_STEP ? "visible" : "hidden";
  navRow.style.display = step > LAST_FORM_STEP ? "none" : "flex";
  nextBtn.textContent = step === LAST_FORM_STEP ? `Place order · ${money(totals().total)}` : "Continue";
  nextBtn.disabled = step === 0 && !cart.length;

  if (step === LAST_FORM_STEP) renderReview();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

nextBtn.addEventListener("click", () => {
  if (step === 1 || step === 2) {
    if (!validatePanel(step)) return;
  }

  if (step === LAST_FORM_STEP) {
    // Fake a short network request
    nextBtn.classList.add("loading");
    nextBtn.disabled = true;
    setTimeout(() => {
      nextBtn.classList.remove("loading");
      document.querySelector(".order-id").textContent = "#MSG-" + Math.floor(100000 + Math.random() * 900000);
      goTo(4);
      steps.forEach((s) => {
        s.classList.remove("is-current");
        s.classList.add("is-done");
      });
      launchConfetti();
    }, 1400);
    return;
  }

  goTo(step + 1);
});

backBtn.addEventListener("click", () => goTo(step - 1));

document.querySelector(".restart").addEventListener("click", () => {
  form.reset();
  cart = initialCart.map((item) => ({ ...item, qty: 1 }));
  discount = 0;
  promoInput.value = "";
  promoMsg.textContent = "";
  document.querySelector(".cc-number").textContent = "•••• •••• •••• ••••";
  document.querySelector(".cc-name").textContent = "YOUR NAME";
  document.querySelector(".cc-exp").textContent = "MM/YY";
  document.querySelector(".cc-cvv").textContent = "•••";
  form.querySelectorAll(".field.invalid").forEach((f) => f.classList.remove("invalid"));
  renderCart();
  goTo(0);
});

// ---------- Confetti ----------
function launchConfetti() {
  const box = document.querySelector(".confetti");
  const colors = ["#10b981", "#34d399", "#fbbf24", "#f472b6", "#60a5fa", "#a78bfa"];
  box.innerHTML = "";
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement("i");
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDuration = `${1.8 + Math.random() * 1.6}s`;
    piece.style.animationDelay = `${Math.random() * 0.5}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    box.appendChild(piece);
  }
}

// ---------- Init ----------
renderCart();
goTo(0);
