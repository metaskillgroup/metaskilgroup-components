// Edit this list to change the questions. `topic` drives the filter chips.
const faqs = [
  { id: "free-trial", topic: "Billing", q: "Is there a free trial?", a: "Yes — every paid plan starts with a 14-day free trial. No credit card is needed to start, and you can cancel anytime from your dashboard." },
  { id: "change-plan", topic: "Billing", q: "Can I change my plan later?", a: "Absolutely. Upgrades take effect immediately and are prorated. Downgrades apply at the end of your current billing cycle." },
  { id: "refunds", topic: "Billing", q: "What is your refund policy?", a: "If you're not happy within the first 30 days of a paid plan, email us and we'll refund you in full — no questions asked." },
  { id: "invoices", topic: "Billing", q: "Do you provide GST invoices?", a: "Yes. Add your GSTIN under Settings → Billing and every invoice from then on will include it. Past invoices can be regenerated." },
  { id: "data-safe", topic: "Security", q: "Is my data safe?", a: "All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We run daily backups and never sell or share your data." },
  { id: "two-factor", topic: "Security", q: "Do you support two-factor authentication?", a: "Yes. You can turn on 2FA with any authenticator app or passkeys from Settings → Security. Team admins can make it mandatory." },
  { id: "sso", topic: "Security", q: "Can we use SSO for our team?", a: "SSO with Google Workspace, Okta and Azure AD is available on the Team plan, along with audit logs and role-based access." },
  { id: "integrations", topic: "Product", q: "Which integrations are available?", a: "We integrate with Slack, GitHub, Figma, Notion, Google Drive and 40+ other tools. There's also a REST API and webhooks for anything custom." },
  { id: "offline", topic: "Product", q: "Does it work offline?", a: "The desktop and mobile apps keep working offline and sync your changes automatically as soon as you're back online." },
  { id: "export", topic: "Product", q: "Can I export my data?", a: "Yes, anytime. Export everything as JSON, CSV or Markdown from Settings → Export. Your data is always yours." },
  { id: "support-hours", topic: "Support", q: "What are your support hours?", a: "Email and chat support run 24/5 (Monday to Friday). Team plan customers also get weekend coverage and a dedicated manager." },
  { id: "onboarding", topic: "Support", q: "Do you help with onboarding?", a: "Every new team gets a free 30-minute onboarding call, plus step-by-step guides and video tutorials inside the app." },
];

const listEl = document.getElementById("faq-list");
const chipsEl = document.getElementById("chips");
const searchEl = document.getElementById("faq-search");
const countEl = document.getElementById("result-count");
const emptyEl = document.getElementById("empty");
const expandAllBtn = document.getElementById("expand-all");

const state = { topic: "All", query: "", open: new Set() };

const escapeHTML = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Wrap every match of the search query in <mark>
const highlight = (text) => {
  const safe = escapeHTML(text);
  if (!state.query) return safe;
  const pattern = state.query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return safe.replace(new RegExp(`(${pattern})`, "gi"), "<mark>$1</mark>");
};

const matches = (item) => {
  const inTopic = state.topic === "All" || item.topic === state.topic;
  const q = state.query.toLowerCase();
  return inTopic && (!q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q));
};

const renderChips = () => {
  const topics = ["All", ...new Set(faqs.map((f) => f.topic))];
  chipsEl.innerHTML = topics
    .map((t) => {
      const count = t === "All" ? faqs.length : faqs.filter((f) => f.topic === t).length;
      return `<button type="button" class="chip" role="tab" aria-selected="${t === state.topic}" data-topic="${t}">${t}<span>${count}</span></button>`;
    })
    .join("");
};

const renderList = () => {
  const visible = faqs.filter(matches);
  listEl.innerHTML = visible
    .map((item, i) => {
      const open = state.open.has(item.id) || (state.query && item.a.toLowerCase().includes(state.query.toLowerCase()));
      return `
      <div class="item ${open ? "open" : ""}" id="${item.id}" style="animation-delay:${i * 40}ms">
        <button type="button" class="q" aria-expanded="${open}" aria-controls="${item.id}-a">
          <span><span class="q-tag">${item.topic}</span>${highlight(item.q)}</span>
          <span class="icon" aria-hidden="true"></span>
        </button>
        <div class="a" id="${item.id}-a" role="region" aria-label="${escapeHTML(item.q)}">
          <div class="a-inner">
            <p>${highlight(item.a)}</p>
            <button type="button" class="copy-link" data-id="${item.id}">🔗 Copy link to this answer</button>
          </div>
        </div>
      </div>`;
    })
    .join("");

  emptyEl.hidden = visible.length > 0;
  countEl.textContent = state.query || state.topic !== "All" ? `Showing ${visible.length} of ${faqs.length} questions` : `${faqs.length} questions`;
  updateExpandLabel();
};

const updateExpandLabel = () => {
  const items = [...listEl.querySelectorAll(".item")];
  expandAllBtn.textContent = items.length && items.every((i) => i.classList.contains("open")) ? "Collapse all" : "Expand all";
};

const toggleItem = (item, force) => {
  const open = force ?? !item.classList.contains("open");
  item.classList.toggle("open", open);
  item.querySelector(".q").setAttribute("aria-expanded", open);
  open ? state.open.add(item.id) : state.open.delete(item.id);
};

// Open / close a question (and keep the URL hash in sync for sharing)
listEl.addEventListener("click", async (e) => {
  const copy = e.target.closest(".copy-link");
  if (copy) {
    const url = `${location.href.split("#")[0]}#${copy.dataset.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard may be blocked on file:// pages
    }
    copy.textContent = "✓ Link copied";
    setTimeout(() => (copy.textContent = "🔗 Copy link to this answer"), 1600);
    return;
  }

  const q = e.target.closest(".q");
  if (!q) return;
  const item = q.closest(".item");
  toggleItem(item);
  if (item.classList.contains("open")) history.replaceState(null, "", `#${item.id}`);
  updateExpandLabel();
});

chipsEl.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  state.topic = chip.dataset.topic;
  renderChips();
  renderList();
});

let searchTimer;
searchEl.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.query = searchEl.value.trim();
    renderList();
  }, 120);
});

expandAllBtn.addEventListener("click", () => {
  const items = [...listEl.querySelectorAll(".item")];
  const openAll = !items.every((i) => i.classList.contains("open"));
  items.forEach((item) => toggleItem(item, openAll));
  updateExpandLabel();
});

// Press "/" anywhere to jump to the search box
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement !== searchEl) {
    e.preventDefault();
    searchEl.focus();
  }
});

// Deep link: /faq#refunds opens and scrolls to that answer
const openFromHash = () => {
  const id = location.hash.slice(1);
  if (!faqs.some((f) => f.id === id)) return;
  state.open.add(id);
  renderList();
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
};

renderChips();
state.open.add(faqs[0].id); // first answer open by default
renderList();
openFromHash();
window.addEventListener("hashchange", openFromHash);
