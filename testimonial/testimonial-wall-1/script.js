// Edit this list to change the testimonials
const testimonials = [
  { name: "Aarav Mehta", role: "CTO, Finlytics", rating: 5, source: "G2", text: "We moved our entire team over in a weekend. <mark>Onboarding took less than an hour</mark> and nobody has looked back." },
  { name: "Sophie Laurent", role: "Product Designer", rating: 5, source: "Twitter", text: "Finally a tool that feels as good as the things we design with it. <mark>The attention to detail is unreal.</mark>" },
  { name: "Marcus Chen", role: "Founder, Shipfast", rating: 5, source: "Product Hunt", text: "It replaced four different subscriptions for us. <mark>We save around $900 every month.</mark>" },
  { name: "Priya Nair", role: "Engineering Manager", rating: 4, source: "Capterra", text: "Sprint planning used to take half a day. Now it's a 20-minute call and <mark>everyone knows what to do</mark>." },
  { name: "Lucas Oliveira", role: "Freelance Developer", rating: 5, source: "Twitter", text: "The API is clean, the docs are great and support replied in <mark>under five minutes</mark>. Rare these days." },
  { name: "Hannah Kim", role: "Head of Marketing", rating: 5, source: "G2", text: "Our campaign launches are <mark>twice as fast</mark> since we started using the shared boards." },
  { name: "Omar Haddad", role: "Startup Advisor", rating: 5, source: "LinkedIn", text: "I recommend it to every founder I work with. It just <mark>gets out of your way</mark> and lets you ship." },
  { name: "Emily Watson", role: "Ops Lead, Brightside", rating: 4, source: "Capterra", text: "Automations alone saved us <mark>12 hours a week</mark>. The reporting is the cherry on top." },
  { name: "Rohan Gupta", role: "Full-stack Engineer", rating: 5, source: "Product Hunt", text: "Dark mode, keyboard shortcuts, instant search. <mark>Built by people who actually use it.</mark>" },
  { name: "Isabella Rossi", role: "Creative Director", rating: 5, source: "LinkedIn", text: "Clients love the shareable previews. <mark>Approvals that took days now take minutes.</mark>" },
  { name: "Daniel Okafor", role: "CEO, Paystack Labs", rating: 5, source: "G2", text: "Scaled from 5 to 120 people without changing tools once. <mark>It grows with you.</mark>" },
  { name: "Mia Johansson", role: "UX Researcher", rating: 5, source: "Twitter", text: "I've tried everything out there. <mark>This is the first one that stuck</mark> for more than a month." },
];

const rows = document.querySelectorAll(".row");

// Build the HTML for one testimonial card
const cardHTML = (t) => {
  const initials = t.name.split(" ").map((n) => n[0]).join("");
  // Stable hue per person so avatar colours don't change on reload
  const hue = [...t.name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 360;
  const stars = "★".repeat(t.rating) + `<span class="dim">${"★".repeat(5 - t.rating)}</span>`;

  return `
    <figure class="t-card">
      <div class="t-stars" aria-label="${t.rating} out of 5 stars">${stars}</div>
      <blockquote class="t-text">${t.text}</blockquote>
      <figcaption class="t-user">
        <span class="t-avatar" style="--h: ${hue}">${initials}</span>
        <span><strong>${t.name}</strong><small>${t.role}</small></span>
        <span class="t-source">${t.source}</span>
      </figcaption>
    </figure>`;
};

// Split testimonials across rows, each row starting at a different offset
rows.forEach((row, i) => {
  const track = row.querySelector(".track");
  const offset = i * 4;
  const list = [...testimonials.slice(offset), ...testimonials.slice(0, offset)];
  const html = list.map(cardHTML).join("");

  // Content twice so translateX(-50%) loops seamlessly
  track.innerHTML = html + html;
  track.style.setProperty("--duration", `${60 + i * 12}s`);
  [...track.children].slice(list.length).forEach((el) => el.setAttribute("aria-hidden", "true"));
});

// Count-up stats when they scroll into view
const counters = document.querySelectorAll("[data-count]");

const runCounter = (el) => {
  const target = Number(el.dataset.count);
  const decimals = Number(el.dataset.decimals || 0);
  const suffix = el.dataset.suffix || "";
  const duration = 1600;
  const start = performance.now();

  const step = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const value = target * (1 - Math.pow(1 - p, 4));
    el.textContent =
      (decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString()) + (p === 1 && target >= 1000 ? "+" : "") + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        runCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.6 },
);

counters.forEach((el) => observer.observe(el));
