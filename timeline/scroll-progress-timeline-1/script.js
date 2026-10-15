// Edit this list to change the milestones
const milestones = [
  { year: "2019", tag: "The idea", emoji: "💡", title: "It started with a question", text: "Why is learning to code so confusing? Two friends began answering it with free YouTube videos.", stat: ["1,200", "first subscribers"] },
  { year: "2020", tag: "Launch", emoji: "🚀", title: "The first course goes live", text: "A 30-day JavaScript bootcamp, built in a hostel room on a 4 GB laptop.", stat: ["3,500", "students enrolled"] },
  { year: "2021", tag: "Community", emoji: "🤝", title: "Learners start helping learners", text: "A Discord server turned into a 24/7 help desk run by the students themselves.", stat: ["8,000", "community members"] },
  { year: "2022", tag: "Internships", emoji: "🎓", title: "Real projects, real mentors", text: "We launched mentored internships so learners could ship work for real clients.", stat: ["450", "interns placed"] },
  { year: "2024", tag: "Growth", emoji: "📈", title: "A team of 25", text: "From two friends to a remote team across six cities, still obsessed with clarity.", stat: ["25,000", "learners"] },
  { year: "2026", tag: "Today", emoji: "✨", title: "40,000 learners and counting", text: "Free components, templates and courses — all built to help you learn by doing.", stat: ["40,000+", "learners worldwide"] },
];

const list = document.getElementById("timeline");
const wrap = document.getElementById("timeline-wrap");
const fill = document.getElementById("fill");

list.innerHTML = milestones
  .map(
    (m) => `
    <li class="milestone">
      <span class="node" aria-hidden="true"></span>
      <article class="card">
        <div class="card-top"><span class="tag">${m.tag}</span><span class="emoji" aria-hidden="true">${m.emoji}</span></div>
        <h3>${m.title}</h3>
        <p>${m.text}</p>
        <span class="stat"><b>${m.stat[0]}</b> ${m.stat[1]}</span>
      </article>
      <span class="year">${m.year}</span>
    </li>`,
  )
  .join("");

const items = [...list.querySelectorAll(".milestone")];

// Cards slide in the first time they enter the screen
const revealer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.25 },
);
items.forEach((item) => revealer.observe(item));

// Fill the line up to the middle of the screen and light up passed nodes
const track = document.querySelector(".track");
let ticking = false;

const update = () => {
  ticking = false;
  const rect = track.getBoundingClientRect();
  const marker = window.innerHeight * 0.55; // the "reading line"
  const progress = Math.min(Math.max((marker - rect.top) / rect.height, 0), 1);
  fill.style.setProperty("--progress", progress);

  items.forEach((item) => {
    const node = item.querySelector(".node").getBoundingClientRect();
    item.classList.toggle("is-reached", node.top + node.height / 2 <= marker);
  });
};

const onScroll = () => {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(update);
  }
};

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
update();
