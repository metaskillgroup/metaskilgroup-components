// ---------- Reviews (replace with data from your API) ----------
const DAY = 864e5;
const now = Date.now();
const seed = [
  { id: 1, name: "Riya", rating: 5, title: "Best headphones I've owned", body: "The noise cancelling is unreal — the metro becomes a library. Battery easily lasts my whole week of commutes, and the sound is warm without being muddy. The case is compact enough for my laptop bag.", days: 3, verified: true, helpful: 42, unhelpful: 2, photos: ["🎧|#fde68a,#fca5a5", "🧳|#bfdbfe,#c4b5fd"], recommend: true },
  { id: 2, name: "Kabir", rating: 4, title: "Great sound, slightly tight fit", body: "Sound quality is excellent and the app EQ is genuinely useful. Comfort is good for about two hours; after that they feel a little tight on my head. Mic is clear on calls.", days: 9, verified: true, helpful: 18, unhelpful: 1, recommend: true, reply: "Thanks Kabir! The headband loosens a little over the first week — and you can adjust the clamp in the app under Fit." },
  { id: 3, name: "Meera", rating: 5, title: "Battery life is ridiculous", body: "I charged them once on a Sunday and was still at 30% on Friday. Noise cancelling works brilliantly on flights too.", days: 14, verified: true, helpful: 25, unhelpful: 0, photos: ["✈️|#a7f3d0,#93c5fd"], recommend: true },
  { id: 4, name: "Arjun", rating: 3, title: "Good, but the touch controls…", body: "Sound and noise cancelling are top notch. The touch controls, however, trigger accidentally when I adjust the earcups, which pauses my music at random. You can turn them off, but then you lose volume control. Hoping a firmware update improves the sensitivity because everything else about these is great, including the comfort and the build quality.", days: 21, verified: true, helpful: 31, unhelpful: 4, recommend: true },
  { id: 5, name: "Sara", rating: 5, title: "Worth every rupee", body: "Compared these against two pricier brands in the store and went home with these. Bass is punchy, vocals are clear, and the case feels premium.", days: 27, verified: true, helpful: 12, unhelpful: 0, recommend: true },
  { id: 6, name: "Dev", rating: 2, title: "Mic is weak in wind", body: "Music sounds lovely but people can barely hear me on calls when I'm walking outside. Indoors the mic is fine.", days: 33, verified: false, helpful: 9, unhelpful: 3, recommend: false, reply: "Sorry about that, Dev. The latest update (v2.4) adds wind reduction for calls — could you give it a try and let us know?" },
  { id: 7, name: "Ananya", rating: 5, title: "Comfortable for long study sessions", body: "I wear these for 5–6 hours a day while studying. No ear pain at all, and the noise cancelling blocks out my noisy hostel completely.", days: 41, verified: true, helpful: 20, unhelpful: 0, photos: ["📚|#fbcfe8,#fde68a"], recommend: true },
  { id: 8, name: "Rohan", rating: 4, title: "Solid all-rounder", body: "Great battery, good sound, decent mic. Only wish the case had a magnetic latch.", days: 52, verified: true, helpful: 7, unhelpful: 0, recommend: true },
  { id: 9, name: "Isha", rating: 1, title: "Left earcup stopped working", body: "After three weeks the left side went silent. Support replaced them quickly, so I'll update my review after using the new pair.", days: 60, verified: true, helpful: 15, unhelpful: 6, recommend: false, reply: "We're sorry, Isha — glad the replacement reached you fast. Our support team will check in next week." },
  { id: 10, name: "Vihaan", rating: 5, title: "Gym and travel buddy", body: "Sweat hasn't been a problem, they fold flat and the sound is fantastic. Noise cancelling is strong enough for the gym speakers.", days: 75, verified: true, helpful: 6, unhelpful: 0, recommend: true },
  { id: 11, name: "Nora", rating: 4, title: "Lovely sound, app could be better", body: "Hardware is excellent and battery is great. The companion app occasionally loses connection, which is annoying when changing the EQ.", days: 88, verified: false, helpful: 4, unhelpful: 1, recommend: true },
  { id: 12, name: "Aarav", rating: 5, title: "My daily driver", body: "Use them for calls, music and movies. Switching between laptop and phone is seamless. Comfort and sound both 10/10.", days: 102, verified: true, helpful: 11, unhelpful: 0, photos: ["💻|#c7d2fe,#a5f3fc"], recommend: true },
];

const MENTIONS = ["battery", "sound", "noise cancelling", "comfort", "mic", "case"];
const WORDS = ["Terrible", "Poor", "Okay", "Good", "Excellent"];
const PAGE = 5;

// ---------- State ----------
const $ = (id) => document.getElementById(id);
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } },
};

const mine = store.get("reviews-mine", []);
let reviews = [...mine, ...seed.map((r) => ({ ...r, date: now - r.days * DAY }))];
const votes = store.get("reviews-votes", {});
const state = { stars: null, mention: null, query: "", photos: false, sort: "helpful", shown: PAGE };
let newId = null;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const hue = (s) => [...s].reduce((h, c) => h + c.charCodeAt(0) * 7, 0) % 360;
const ago = (t) => {
  const d = Math.floor((now - t) / DAY);
  if (d < 1) return "Just now";
  if (d < 30) return `${d} day${d > 1 ? "s" : ""} ago`;
  return new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
const score = (r) => r.helpful + (votes[r.id] === "up" ? 1 : 0) - (r.unhelpful + (votes[r.id] === "down" ? 1 : 0));

// ---------- Summary ----------
const renderSummary = () => {
  const n = reviews.length;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / n;
  $("avg").textContent = avg.toFixed(1);
  $("avg-stars").style.setProperty("--r", avg);
  $("avg-stars").setAttribute("aria-label", `${avg.toFixed(1)} out of 5 stars`);
  $("count").textContent = `Based on ${n} reviews`;
  $("bars").innerHTML = [5, 4, 3, 2, 1]
    .map((s) => {
      const c = reviews.filter((r) => r.rating === s).length;
      return `<li><button type="button" class="bar-btn" data-stars="${s}" aria-pressed="${state.stars === s}" aria-label="Show ${s}-star reviews (${c})">
        <span class="label">${s}</span><span class="track"><i style="width:${(c / n) * 100}%"></i></span><span class="n">${c}</span></button></li>`;
    })
    .join("");
  const rec = Math.round((reviews.filter((r) => r.recommend).length / n) * 100);
  $("recommend").textContent = `👍 ${rec}% of reviewers recommend this product`;
  $("mentions").innerHTML = MENTIONS.map((m) => {
    const c = reviews.filter((r) => (r.title + " " + r.body).toLowerCase().includes(m)).length;
    return c ? `<button type="button" data-mention="${m}" aria-pressed="${state.mention === m}">${m} <b>${c}</b></button>` : "";
  }).join("");
};

// ---------- List ----------
const visible = () => {
  const q = state.query.toLowerCase();
  const list = reviews.filter((r) => {
    const text = (r.title + " " + r.body).toLowerCase();
    return (
      (!state.stars || r.rating === state.stars) &&
      (!state.mention || text.includes(state.mention)) &&
      (!q || text.includes(q) || r.name.toLowerCase().includes(q)) &&
      (!state.photos || r.photos?.length)
    );
  });
  const sorters = {
    helpful: (a, b) => score(b) - score(a),
    newest: (a, b) => b.date - a.date,
    high: (a, b) => b.rating - a.rating || b.date - a.date,
    low: (a, b) => a.rating - b.rating || b.date - a.date,
  };
  return list.sort(sorters[state.sort]);
};

const highlight = (text) => {
  const terms = [state.query, state.mention].filter(Boolean).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const safe = esc(text);
  return terms.length ? safe.replace(new RegExp(`(${terms.join("|")})`, "gi"), "<mark>$1</mark>") : safe;
};

const photoBtn = (p, i, r) => {
  const [emoji, bg] = p.split("|");
  const style = bg?.startsWith("data:") ? `--bg-img:url(${bg})` : `--bg-img:linear-gradient(135deg, ${bg})`;
  return `<button type="button" class="photo" data-photo="${r.id}-${i}" style="${style}" aria-label="Open photo ${i + 1} from ${esc(r.name)}">${bg?.startsWith("data:") ? "" : emoji}</button>`;
};

const reviewHTML = (r, i) => {
  const long = r.body.length > 220;
  const vote = votes[r.id];
  return `<li class="review ${r.id === newId ? "is-new" : ""}" style="animation-delay:${Math.min(i, 4) * 50}ms">
    <div class="r-head">
      <span class="r-av" style="--h:${hue(r.name)}" aria-hidden="true">${esc(r.name[0])}</span>
      <div class="r-who"><b>${esc(r.name)}</b><small>${r.verified ? '<span class="verified">✓ Verified purchase</span>' : "Reviewer"}</small></div>
      <span class="r-date">${ago(r.date)}</span>
    </div>
    <div class="r-title"><span class="stars" style="--r:${r.rating}" role="img" aria-label="${r.rating} out of 5 stars"></span><h3>${highlight(r.title)}</h3></div>
    <p class="r-body" data-full="${long ? "false" : "true"}">${highlight(long ? r.body.slice(0, 200).trimEnd() + "…" : r.body)}</p>
    ${long ? `<button type="button" class="read-more" data-more="${r.id}">Read more</button>` : ""}
    ${r.photos?.length ? `<div class="photos">${r.photos.map((p, k) => photoBtn(p, k, r)).join("")}</div>` : ""}
    ${r.reply ? `<div class="reply"><b>Response from Aurora</b>${esc(r.reply)}</div>` : ""}
    <div class="r-foot">
      Helpful?
      <button type="button" class="vote" data-vote="up" data-id="${r.id}" aria-pressed="${vote === "up"}">👍 ${r.helpful + (vote === "up" ? 1 : 0)}</button>
      <button type="button" class="vote" data-vote="down" data-id="${r.id}" aria-pressed="${vote === "down"}">👎 ${r.unhelpful + (vote === "down" ? 1 : 0)}</button>
      <button type="button" class="report" data-report="${r.id}">Report</button>
    </div>
  </li>`;
};

const renderList = () => {
  const list = visible();
  $("list").innerHTML = list.slice(0, state.shown).map(reviewHTML).join("");
  $("empty").hidden = list.length > 0;
  $("more").hidden = list.length <= state.shown;
  $("more").textContent = `Show more reviews (${list.length - state.shown} left)`;
  $("result-line").textContent = `${list.length} review${list.length === 1 ? "" : "s"}${state.stars || state.mention || state.query || state.photos ? " match your filters" : ""}`;

  const chips = [];
  if (state.stars) chips.push(`<button type="button" data-clear="stars">${state.stars} ★ ✕</button>`);
  if (state.mention) chips.push(`<button type="button" data-clear="mention">“${state.mention}” ✕</button>`);
  if (state.photos) chips.push(`<button type="button" data-clear="photos">With photos ✕</button>`);
  if (chips.length > 1) chips.push(`<button type="button" data-clear="all">Clear all</button>`);
  $("active-filters").innerHTML = chips.join("");
};

const render = () => {
  renderSummary();
  renderList();
};

// ---------- Events: filters ----------
$("bars").addEventListener("click", (e) => {
  const b = e.target.closest("[data-stars]");
  if (!b) return;
  const s = Number(b.dataset.stars);
  state.stars = state.stars === s ? null : s;
  state.shown = PAGE;
  render();
});
$("mentions").addEventListener("click", (e) => {
  const b = e.target.closest("[data-mention]");
  if (!b) return;
  state.mention = state.mention === b.dataset.mention ? null : b.dataset.mention;
  state.shown = PAGE;
  render();
});
let t;
$("search").addEventListener("input", (e) => {
  clearTimeout(t);
  t = setTimeout(() => {
    state.query = e.target.value.trim();
    state.shown = PAGE;
    renderList();
  }, 150);
});
$("with-photos").addEventListener("change", (e) => {
  state.photos = e.target.checked;
  state.shown = PAGE;
  renderList();
});
$("sort").addEventListener("change", (e) => {
  state.sort = e.target.value;
  renderList();
});
$("active-filters").addEventListener("click", (e) => {
  const what = e.target.closest("[data-clear]")?.dataset.clear;
  if (!what) return;
  if (what === "stars" || what === "all") state.stars = null;
  if (what === "mention" || what === "all") state.mention = null;
  if (what === "photos" || what === "all") {
    state.photos = false;
    $("with-photos").checked = false;
  }
  render();
});
$("more").addEventListener("click", () => {
  state.shown += PAGE;
  renderList();
});

// ---------- Events: inside reviews ----------
const toast = (() => {
  let timer;
  return (msg) => {
    $("toast").textContent = msg;
    $("toast").classList.add("show");
    clearTimeout(timer);
    timer = setTimeout(() => $("toast").classList.remove("show"), 2400);
  };
})();

$("list").addEventListener("click", (e) => {
  const more = e.target.closest("[data-more]");
  if (more) {
    const r = reviews.find((x) => x.id === Number(more.dataset.more));
    const p = more.previousElementSibling;
    const full = p.dataset.full === "true";
    p.innerHTML = highlight(full ? r.body.slice(0, 200).trimEnd() + "…" : r.body);
    p.dataset.full = String(!full);
    more.textContent = full ? "Read more" : "Show less";
    return;
  }

  const vote = e.target.closest("[data-vote]");
  if (vote) {
    const id = vote.dataset.id;
    votes[id] = votes[id] === vote.dataset.vote ? undefined : vote.dataset.vote;
    store.set("reviews-votes", votes);
    renderList();
    document.querySelector(`[data-vote="${vote.dataset.vote}"][data-id="${id}"]`)?.classList.add("bump");
    return;
  }

  const photo = e.target.closest("[data-photo]");
  if (photo) {
    $("lb-img").style.cssText = photo.getAttribute("style");
    $("lb-img").textContent = photo.textContent;
    $("lightbox").showModal();
    return;
  }

  if (e.target.closest("[data-report]")) toast("Thanks — our team will take a look.");
});

$("lb-close").addEventListener("click", () => $("lightbox").close());
$("lightbox").addEventListener("click", (e) => e.target === $("lightbox") && $("lightbox").close());

// ---------- Write a review ----------
const dialog = $("write");
const form = $("review-form");
let rating = 0;
let recommend = true;
let newPhotos = [];

$("star-input").innerHTML = WORDS.map((w, i) => `<button type="button" role="radio" data-v="${i + 1}" aria-label="${i + 1} star${i ? "s" : ""} — ${w}" aria-checked="false">★</button>`).join("");
const stars = [...$("star-input").querySelectorAll("button")];
const paintStars = (v) => {
  stars.forEach((b, i) => b.classList.toggle("on", i < v));
  $("rate-word").textContent = v ? WORDS[v - 1] : "Tap a star";
};
stars.forEach((b) => {
  b.addEventListener("pointerenter", () => paintStars(Number(b.dataset.v)));
  b.addEventListener("click", () => {
    rating = Number(b.dataset.v);
    stars.forEach((x) => {
      x.setAttribute("aria-checked", x === b);
      x.tabIndex = x === b ? 0 : -1;
    });
    paintStars(rating);
    $("err-rating").textContent = "";
  });
});
$("star-input").addEventListener("pointerleave", () => paintStars(rating));
$("star-input").addEventListener("keydown", (e) => {
  const delta = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
  if (!delta) return;
  e.preventDefault();
  const v = Math.min(5, Math.max(1, (rating || 0) + delta));
  stars[v - 1].click();
  stars[v - 1].focus();
});

document.querySelectorAll("[data-rec]").forEach((b) =>
  b.addEventListener("click", () => {
    recommend = b.dataset.rec === "yes";
    document.querySelectorAll("[data-rec]").forEach((x) => x.setAttribute("aria-checked", x === b));
  }),
);

form.elements.body.addEventListener("input", (e) => {
  const n = e.target.value.trim().length;
  $("body-count").textContent = n >= 20 ? `${n} characters ✓` : `${n} / 20 characters minimum`;
  $("body-count").classList.toggle("ok", n >= 20);
});

$("photo-input").addEventListener("change", (e) => {
  newPhotos = [];
  $("photo-preview").innerHTML = "";
  [...e.target.files].slice(0, 3).forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      newPhotos.push(`📷|${reader.result}`);
      $("photo-preview").insertAdjacentHTML("beforeend", `<img src="${reader.result}" alt="" />`);
    };
    reader.readAsDataURL(file);
  });
});

const openWrite = () => {
  form.reset();
  rating = 0;
  recommend = true;
  newPhotos = [];
  $("photo-preview").innerHTML = "";
  stars.forEach((x, i) => {
    x.setAttribute("aria-checked", "false");
    x.tabIndex = i === 0 ? 0 : -1;
  });
  paintStars(0);
  form.querySelectorAll(".err").forEach((el) => (el.textContent = ""));
  form.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
  $("body-count").textContent = "0 / 20 characters minimum";
  dialog.showModal();
};
$("write-btn").addEventListener("click", openWrite);
$("write-close").addEventListener("click", () => dialog.close());
$("write-cancel").addEventListener("click", () => dialog.close());

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = form.elements;
  const check = (name, ok, msg) => {
    const el = $(`err-${name}`);
    el.textContent = ok ? "" : msg;
    el.closest(".field")?.classList.toggle("invalid", !ok && name !== "rating");
    return ok;
  };
  const ok = [
    check("rating", rating > 0, "Please choose a star rating."),
    check("title", f.title.value.trim().length >= 3, "Add a short title."),
    check("body", f.body.value.trim().length >= 20, "Tell us a little more (20+ characters)."),
    check("name", f.name.value.trim().length >= 2, "What should we call you?"),
  ].every(Boolean);
  if (!ok) return;

  const review = {
    id: Date.now(),
    name: f.name.value.trim(),
    rating,
    title: f.title.value.trim(),
    body: f.body.value.trim(),
    date: Date.now(),
    verified: false,
    helpful: 0,
    unhelpful: 0,
    recommend,
    photos: newPhotos,
  };
  reviews.unshift(review);
  // Photos aren't stored (they'd fill up storage) — the text is
  store.set("reviews-mine", [{ ...review, photos: [] }, ...mine]);
  newId = review.id;
  Object.assign(state, { stars: null, mention: null, query: "", photos: false, sort: "newest", shown: PAGE });
  $("search").value = "";
  $("with-photos").checked = false;
  $("sort").value = "newest";
  dialog.close();
  render();
  $("list").scrollIntoView({ behavior: "smooth", block: "start" });
  toast("Thanks! Your review is live ⭐");
});

render();
