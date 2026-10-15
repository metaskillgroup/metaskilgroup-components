// ---------- Your cookie categories (edit freely) ----------
const CATEGORIES = [
  {
    id: "necessary",
    name: "Strictly necessary",
    short: "Login, security and your cookie choice",
    locked: true,
    text: "These keep the site working: signing in, keeping your cart, protecting forms and remembering this choice.",
    cookies: [
      ["session_id", "This site", "Keeps you signed in", "Session"],
      ["csrf_token", "This site", "Protects forms from abuse", "Session"],
      ["cookie-consent", "This site", "Remembers your choice", "180 days"],
    ],
  },
  {
    id: "functional",
    name: "Functional",
    short: "Live chat and saved preferences",
    text: "Remember things like your language and power features such as live chat.",
    cookies: [
      ["lang", "This site", "Your language", "1 year"],
      ["chat_uid", "Crisp", "Live chat history", "6 months"],
    ],
  },
  {
    id: "analytics",
    name: "Analytics",
    short: "Anonymous stats that help us improve",
    text: "Tell us which pages are popular and where people get stuck. Data is aggregated and never sold.",
    cookies: [
      ["_ga", "Google Analytics", "Distinguishes visitors", "2 years"],
      ["_ga_*", "Google Analytics", "Keeps session state", "2 years"],
    ],
  },
  {
    id: "marketing",
    name: "Marketing",
    short: "Relevant ads on other sites",
    text: "Used by ad partners to show you offers you might like and to measure campaigns.",
    cookies: [
      ["_fbp", "Meta", "Ad delivery and measurement", "3 months"],
      ["IDE", "Google Ads", "Ad personalisation", "13 months"],
    ],
  },
];

const STORAGE_KEY = "cookie-consent";
const CONSENT_VERSION = 1; // bump when your categories change → everyone is asked again
const MAX_AGE_DAYS = 180;

// ---------- Storage ----------
const $ = (id) => document.getElementById(id);
const gpc = navigator.globalPrivacyControl === true;

const read = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const fresh = saved && Date.now() - saved.time < MAX_AGE_DAYS * 864e5;
    return fresh && saved.version === CONSENT_VERSION ? saved : null;
  } catch {
    return null;
  }
};
const write = (choices) => {
  const record = { version: CONSENT_VERSION, time: Date.now(), choices };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* storage blocked — the choice still applies for this visit */
  }
  return record;
};

const defaults = () => Object.fromEntries(CATEGORIES.map((c) => [c.id, Boolean(c.locked)]));
let consent = read();

// ---------- Demo log + live state panel ----------
const logEl = $("log");
window.consentLog = (msg) => {
  if (logEl.dataset.empty !== "no") {
    logEl.innerHTML = "";
    logEl.dataset.empty = "no";
  }
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  logEl.insertAdjacentHTML("beforeend", `<li>[${time}] ${msg}</li>`);
};

const paintStates = () => {
  const choices = consent?.choices ?? defaults();
  $("states").innerHTML = CATEGORIES.map(
    (c) => `<li class="${choices[c.id] ? "on" : ""}">${c.name}<small>${choices[c.id] ? "● Allowed" : consent ? "○ Blocked" : "○ Not decided"}</small></li>`,
  ).join("");
};

// ---------- Run scripts the visitor allowed ----------
const runAllowedScripts = (choices) => {
  document.querySelectorAll('script[type="text/plain"][data-consent]').forEach((tag) => {
    if (!choices[tag.dataset.consent] || tag.dataset.ran) return;
    tag.dataset.ran = "true";
    const s = document.createElement("script");
    s.textContent = tag.textContent;
    document.head.appendChild(s);
  });
};

// ---------- Apply a decision ----------
const toast = (() => {
  let t;
  return (msg) => {
    $("toast").textContent = msg;
    $("toast").classList.add("show");
    clearTimeout(t);
    t = setTimeout(() => $("toast").classList.remove("show"), 2400);
  };
})();

const apply = (choices, message) => {
  const before = consent?.choices ?? {};
  consent = write({ ...choices, necessary: true });
  runAllowedScripts(consent.choices);
  CATEGORIES.forEach((c) => {
    if (before[c.id] && !consent.choices[c.id]) consentLog(`⛔ ${c.name} turned off — takes full effect after a reload`);
  });
  hideBanner();
  $("reopen").hidden = false;
  if ($("prefs").open) $("prefs").close();
  paintStates();
  toast(message);
  // Let the rest of your site react
  window.dispatchEvent(new CustomEvent("cookieconsent:change", { detail: { ...consent.choices } }));
};

const acceptAll = () => apply(Object.fromEntries(CATEGORIES.map((c) => [c.id, true])), "All cookies allowed 🍪");
const rejectAll = () => apply(defaults(), "Only necessary cookies — got it");

// ---------- Banner ----------
const banner = $("banner");
const showBanner = () => {
  banner.hidden = false;
  banner.classList.remove("is-leaving");
  $("gpc-note").hidden = !gpc;
};
const hideBanner = () => {
  if (banner.hidden) return;
  banner.classList.add("is-leaving");
  setTimeout(() => (banner.hidden = true), 350);
};

// ---------- Preference center ----------
const prefs = $("prefs");
const renderCats = () => {
  const choices = consent?.choices ?? { ...defaults(), marketing: false };
  $("cats").innerHTML = CATEGORIES.map(
    (c) => `<div class="cat">
      <div class="cat-row">
        <button type="button" class="cat-toggle" aria-expanded="false" aria-controls="details-${c.id}">
          <svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
          <span><b>${c.name}</b><small>${c.short}</small></span>
        </button>
        ${
          c.locked
            ? '<span class="always">Always on</span>'
            : `<label class="switch"><input type="checkbox" data-cat="${c.id}" ${choices[c.id] ? "checked" : ""} aria-label="${c.name} cookies" /><span class="slider"></span></label>`
        }
      </div>
      <div class="cat-details" id="details-${c.id}"><div>
        <p>${c.text}</p>
        <table class="cookies"><thead><tr><th>Cookie</th><th>Provider</th><th>Purpose</th><th>Expires</th></tr></thead>
        <tbody>${c.cookies.map(([n, p, u, e]) => `<tr><td><code>${n}</code></td><td>${p}</td><td>${u}</td><td>${e}</td></tr>`).join("")}</tbody></table>
      </div></div>
    </div>`,
  ).join("");
};

const openPrefs = () => {
  renderCats();
  prefs.showModal();
};

$("cats").addEventListener("click", (e) => {
  const t = e.target.closest(".cat-toggle");
  if (!t) return;
  const open = t.getAttribute("aria-expanded") !== "true";
  t.setAttribute("aria-expanded", open);
  t.closest(".cat").classList.toggle("is-open", open);
});

$("save").addEventListener("click", () => {
  const choices = defaults();
  $("cats").querySelectorAll("[data-cat]").forEach((i) => (choices[i.dataset.cat] = i.checked));
  apply(choices, "Your preferences are saved");
});

$("prefs-close").addEventListener("click", () => prefs.close());
prefs.addEventListener("click", (e) => e.target === prefs && prefs.close());

document.querySelectorAll("[data-accept]").forEach((b) => b.addEventListener("click", acceptAll));
document.querySelectorAll("[data-reject]").forEach((b) => b.addEventListener("click", rejectAll));
document.querySelectorAll("[data-open-prefs]").forEach((b) => b.addEventListener("click", openPrefs));
$("reopen").addEventListener("click", openPrefs);

// Demo: forget the choice and start over
$("reset").addEventListener("click", () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage blocked */
  }
  consent = null;
  $("reopen").hidden = true;
  logEl.dataset.empty = "";
  logEl.innerHTML = "<li>Consent cleared — waiting for a choice…</li>";
  paintStates();
  showBanner();
});

// ---------- Small public API for the rest of your site ----------
window.cookieConsent = {
  get: () => ({ ...(consent?.choices ?? defaults()) }),
  has: (category) => Boolean(consent?.choices?.[category]),
  open: openPrefs,
  reset: () => $("reset").click(),
};

// ---------- Start ----------
paintStates();
if (consent) {
  $("reopen").hidden = false;
  runAllowedScripts(consent.choices);
} else {
  setTimeout(showBanner, 700);
}
