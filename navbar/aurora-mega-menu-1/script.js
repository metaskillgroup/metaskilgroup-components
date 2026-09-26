const header = document.querySelector(".header");
const nav = document.querySelector(".nav");
const indicator = document.querySelector(".nav-indicator");
const navItems = document.querySelectorAll(".nav-item");
const megaItems = document.querySelectorAll(".nav-item.has-mega");
const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector(".mobile-menu");
const searchOverlay = document.querySelector(".search-overlay");
const searchInput = searchOverlay.querySelector("input");
const searchItems = [...searchOverlay.querySelectorAll(".search-results li")];
const searchEmpty = searchOverlay.querySelector(".search-empty");

// Glass background once the page is scrolled
const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 10);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Move the gradient underline under the hovered link
const moveIndicator = (link) => {
  const navRect = nav.getBoundingClientRect();
  const rect = link.getBoundingClientRect();
  indicator.style.left = `${rect.left - navRect.left + 12}px`;
  indicator.style.width = `${rect.width - 24}px`;
  indicator.style.opacity = "1";
};

navItems.forEach((item) => {
  item.addEventListener("mouseenter", () => moveIndicator(item.querySelector(".nav-link")));
});
nav.addEventListener("mouseleave", () => (indicator.style.opacity = "0"));

// Mega menus: open on hover (with a small close delay) and on click/keyboard
const closeAllMega = (except) => {
  megaItems.forEach((item) => {
    if (item === except) return;
    item.classList.remove("open");
    item.querySelector(".nav-link").setAttribute("aria-expanded", "false");
  });
};

const openMega = (item) => {
  closeAllMega(item);
  item.classList.add("open");
  item.querySelector(".nav-link").setAttribute("aria-expanded", "true");
};

megaItems.forEach((item) => {
  let closeTimer;
  item.addEventListener("mouseenter", () => {
    clearTimeout(closeTimer);
    openMega(item);
  });
  item.addEventListener("mouseleave", () => {
    closeTimer = setTimeout(() => closeAllMega(), 150);
  });
  item.querySelector(".nav-link").addEventListener("click", () => {
    item.classList.contains("open") ? closeAllMega() : openMega(item);
  });
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".has-mega")) closeAllMega();
});

// Mobile full-screen menu
const setMenu = (open) => {
  document.body.classList.toggle("menu-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  mobileMenu.setAttribute("aria-hidden", String(!open));
  document.body.style.overflow = open ? "hidden" : "";
};

menuToggle.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
window.addEventListener("resize", () => {
  if (window.innerWidth > 960) setMenu(false);
});

// Search overlay
let activeIndex = 0;

const visibleResults = () => searchItems.filter((li) => !li.hidden);

const highlight = (index) => {
  const items = visibleResults();
  searchItems.forEach((li) => li.classList.remove("active"));
  if (!items.length) return;
  activeIndex = (index + items.length) % items.length;
  items[activeIndex].classList.add("active");
};

const openSearch = () => {
  searchOverlay.classList.add("open");
  searchOverlay.setAttribute("aria-hidden", "false");
  searchInput.value = "";
  filterResults();
  setTimeout(() => searchInput.focus(), 50);
};

const closeSearch = () => {
  searchOverlay.classList.remove("open");
  searchOverlay.setAttribute("aria-hidden", "true");
};

function filterResults() {
  const q = searchInput.value.trim().toLowerCase();
  // Match on the label only (the icon span's ligature text would also match otherwise)
  searchItems.forEach((li) => {
    const label = li.querySelector("a").lastChild.textContent.toLowerCase();
    li.hidden = !label.includes(q);
  });
  searchEmpty.style.display = visibleResults().length ? "none" : "block";
  highlight(0);
}

document.querySelector(".search-open").addEventListener("click", openSearch);
searchInput.addEventListener("input", filterResults);
searchOverlay.addEventListener("click", (e) => {
  if (e.target === searchOverlay) closeSearch();
});

document.addEventListener("keydown", (e) => {
  const typing = ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName);

  if (e.key === "/" && !typing) {
    e.preventDefault();
    openSearch();
    return;
  }

  if (e.key === "Escape") {
    closeSearch();
    closeAllMega();
    setMenu(false);
    return;
  }

  if (!searchOverlay.classList.contains("open")) return;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    highlight(activeIndex + 1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    highlight(activeIndex - 1);
  } else if (e.key === "Enter") {
    const item = visibleResults()[activeIndex];
    if (item) item.querySelector("a").click();
    closeSearch();
  }
});
