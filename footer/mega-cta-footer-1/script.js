// ---------- Data (edit freely) ----------
const sitemap = [
  { title: "Product", links: ["Features", "Integrations", ["AI Copilot", "New"], "Pricing", "Changelog", "Roadmap"] },
  { title: "Company", links: ["About", ["Careers", "We're hiring"], "Customers", "Press kit", "Contact"] },
  { title: "Resources", links: ["Docs", "Guides", "Templates", "Community", "Status"] },
  { title: "Legal", links: ["Privacy", "Terms", "Cookies", "Security", "DPA"] },
];

const languages = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
  { value: "es", label: "Español" },
  { value: "de", label: "Deutsch" },
  { value: "ja", label: "日本語" },
];

const currencies = [
  { value: "INR", label: "₹ INR", note: "Rupee" },
  { value: "USD", label: "$ USD", note: "Dollar" },
  { value: "EUR", label: "€ EUR", note: "Euro" },
  { value: "GBP", label: "£ GBP", note: "Pound" },
];

const socials = [
  { label: "GitHub", path: '<path d="M9 19c-4 1.5-4-2-6-2.5M15 21v-3.5a3 3 0 0 0-.9-2.3c3-.3 6-1.5 6-6.7a5.2 5.2 0 0 0-1.4-3.6 4.9 4.9 0 0 0-.1-3.6s-1.1-.3-3.6 1.4a12.4 12.4 0 0 0-6.5 0C6 1.1 4.9 1.4 4.9 1.4a4.9 4.9 0 0 0-.1 3.6A5.2 5.2 0 0 0 3.4 8.6c0 5.2 3 6.4 6 6.7a3 3 0 0 0-.9 2.3V21"/>' },
  { label: "LinkedIn", path: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/>' },
  { label: "YouTube", path: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="M10 9l5 3-5 3z"/>' },
  { label: "Instagram", path: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5"/>' },
];

const TIME_ZONE = "Asia/Kolkata";

const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } },
};
const phone = window.matchMedia("(max-width: 640px)");

// ---------- Sitemap (columns on desktop, accordions on phones) ----------
const sitemapEl = document.getElementById("sitemap");
sitemapEl.innerHTML = sitemap
  .map(
    (col, i) => `<div class="col">
      <button type="button" class="col-btn" aria-expanded="true" aria-controls="col-${i}">${col.title}
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
      <div class="col-panel" id="col-${i}"><div><ul class="col-links">
        ${col.links
          .map((l) => (Array.isArray(l) ? `<li><a href="#">${l[0]} <span class="new">${l[1]}</span></a></li>` : `<li><a href="#">${l}</a></li>`))
          .join("")}
      </ul></div></div>
    </div>`,
  )
  .join("");

const colButtons = [...sitemapEl.querySelectorAll(".col-btn")];
const syncAccordions = () => colButtons.forEach((b) => b.setAttribute("aria-expanded", String(!phone.matches)));
colButtons.forEach((btn) =>
  btn.addEventListener("click", () => {
    if (!phone.matches) return; // plain headings on desktop
    btn.setAttribute("aria-expanded", String(btn.getAttribute("aria-expanded") !== "true"));
  }),
);
phone.addEventListener("change", syncAccordions);
syncAccordions();

// ---------- Socials ----------
document.getElementById("socials").innerHTML = socials
  .map((s) => `<li><a href="#" aria-label="${s.label}" data-label="${s.label}"><svg viewBox="0 0 24 24" aria-hidden="true">${s.path}</svg></a></li>`)
  .join("");

// ---------- Newsletter ----------
const form = document.getElementById("newsletter");
const email = document.getElementById("nl-email");
const msg = document.getElementById("nl-msg");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
  msg.className = `nl-msg ${ok ? "ok" : "error"}`;
  msg.textContent = ok ? "You're subscribed — see you next month 🎉" : "Please enter a valid email address.";
  if (ok) email.value = ""; // replace with your API call
});

// ---------- Custom selects (language + currency, remembered) ----------
const setupSelect = (root, options, key) => {
  const btn = root.querySelector(".select-btn");
  const list = root.querySelector(".select-list");
  const valueEl = root.querySelector(".select-value");
  let value = store.get(key) || options[0].value;
  let focus = 0;

  const render = () => {
    const current = options.find((o) => o.value === value) ?? options[0];
    valueEl.textContent = current.label;
    list.innerHTML = options
      .map((o, i) => `<li role="option" data-value="${o.value}" aria-selected="${o.value === value}" class="${i === focus ? "is-focused" : ""}">${o.label}${o.note ? ` <small>${o.note}</small>` : ""}</li>`)
      .join("");
  };
  const open = (yes) => {
    document.querySelectorAll(".select.is-open").forEach((s) => s !== root && s.classList.remove("is-open"));
    root.classList.toggle("is-open", yes);
    btn.setAttribute("aria-expanded", yes);
    if (yes) {
      focus = Math.max(0, options.findIndex((o) => o.value === value));
      render();
      list.focus();
    }
  };
  const choose = (v) => {
    value = v;
    store.set(key, v);
    render();
    open(false);
    btn.focus();
  };

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    open(!root.classList.contains("is-open"));
  });
  list.addEventListener("click", (e) => {
    e.stopPropagation();
    const li = e.target.closest("li");
    if (li) choose(li.dataset.value);
  });
  list.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") focus = (focus + 1) % options.length;
    else if (e.key === "ArrowUp") focus = (focus - 1 + options.length) % options.length;
    else if (e.key === "Enter" || e.key === " ") return e.preventDefault(), choose(options[focus].value);
    else if (e.key === "Escape") return open(false), btn.focus();
    else return;
    e.preventDefault();
    render();
  });
  render();
};

setupSelect(document.querySelector('[data-select="lang"]'), languages, "footer-lang");
setupSelect(document.querySelector('[data-select="currency"]'), currencies, "footer-currency");
document.addEventListener("click", () => document.querySelectorAll(".select.is-open").forEach((s) => s.classList.remove("is-open")));

// ---------- Live clock + year ----------
const clock = document.getElementById("clock");
const fmt = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: TIME_ZONE });
const tick = () => (clock.textContent = fmt.format(new Date()).toUpperCase());
tick();
setInterval(tick, 1000);
document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Wordmark spotlight ----------
const wordmark = document.getElementById("wordmark");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let lastPointer = 0;

const footer = document.querySelector(".footer");
footer.addEventListener("pointermove", (e) => {
  const r = wordmark.getBoundingClientRect();
  lastPointer = performance.now();
  wordmark.style.setProperty("--mx", `${e.clientX - r.left}px`);
  wordmark.style.setProperty("--my", `${e.clientY - r.top}px`);
});

// When nobody is pointing, the spotlight drifts across the letters by itself
const drift = (now) => {
  if (now - lastPointer > 1500) {
    const r = wordmark.getBoundingClientRect();
    const t = now / 1000;
    wordmark.style.setProperty("--mx", `${r.width * (0.5 + 0.42 * Math.sin(t * 0.7))}px`);
    wordmark.style.setProperty("--my", `${r.height * (0.55 + 0.15 * Math.cos(t * 1.3))}px`);
  }
  requestAnimationFrame(drift);
};
if (!reduceMotion) requestAnimationFrame(drift);

// ---------- Back to top with progress ring ----------
const toTop = document.getElementById("to-top");
const onScroll = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  toTop.style.setProperty("--p", max > 0 ? (scrollY / max).toFixed(3) : 0);
  toTop.classList.toggle("is-visible", scrollY > 300);
};
window.addEventListener("scroll", onScroll, { passive: true });
toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));
onScroll();
