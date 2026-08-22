// ===========================
//  THEME TOGGLE
// ===========================
const html = document.documentElement;
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

// Load saved theme
const savedTheme = localStorage.getItem("glassify-theme") || "dark";
html.setAttribute("data-theme", savedTheme);
themeIcon.textContent = savedTheme === "dark" ? "light_mode" : "dark_mode";

themeToggle.addEventListener("click", () => {
  const current = html.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  html.setAttribute("data-theme", next);
  themeIcon.textContent = next === "dark" ? "light_mode" : "dark_mode";
  localStorage.setItem("glassify-theme", next);
});

// ===========================
//  SCROLL — NAVBAR EFFECT
// ===========================
const navbar = document.getElementById("navbar");

window.addEventListener(
  "scroll",
  () => {
    navbar.classList.toggle("scrolled", window.scrollY > 20);
  },
  { passive: true },
);

// ===========================
//  DROPDOWN MENUS (desktop)
// ===========================
const dropdownParents = document.querySelectorAll(".dropdown-parent");

dropdownParents.forEach((parent) => {
  const trigger = parent.querySelector(".dropdown-trigger");

  // Click to toggle
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = parent.classList.contains("open");

    // Close all first
    dropdownParents.forEach((p) => p.classList.remove("open"));

    if (!isOpen) parent.classList.add("open");
  });
});

// Close dropdowns on outside click
document.addEventListener("click", () => {
  dropdownParents.forEach((p) => p.classList.remove("open"));
});

// Prevent dropdown inner click from closing
document.querySelectorAll(".dropdown-menu").forEach((menu) => {
  menu.addEventListener("click", (e) => e.stopPropagation());
});

// Close dropdowns on Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    dropdownParents.forEach((p) => p.classList.remove("open"));
    closeMobileDrawer();
  }
});

// ===========================
//  MOBILE DRAWER
// ===========================
const hamburger = document.getElementById("hamburger");
const mobileDrawer = document.getElementById("mobileDrawer");
const drawerClose = document.getElementById("drawerClose");
const overlay = document.getElementById("overlay");

function openMobileDrawer() {
  mobileDrawer.classList.add("open");
  hamburger.classList.add("open");
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeMobileDrawer() {
  mobileDrawer.classList.remove("open");
  hamburger.classList.remove("open");
  overlay.classList.remove("active");
  document.body.style.overflow = "";
}

hamburger.addEventListener("click", () => {
  mobileDrawer.classList.contains("open")
    ? closeMobileDrawer()
    : openMobileDrawer();
});

drawerClose.addEventListener("click", closeMobileDrawer);
overlay.addEventListener("click", closeMobileDrawer);

// ===========================
//  MOBILE ACCORDIONS
// ===========================
const accordionTriggers = document.querySelectorAll(".accordion-trigger");

accordionTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const accordion = trigger.closest(".drawer-accordion");
    const isOpen = accordion.classList.contains("open");

    // Close others
    document
      .querySelectorAll(".drawer-accordion")
      .forEach((a) => a.classList.remove("open"));

    if (!isOpen) accordion.classList.add("open");
  });
});

// ===========================
//  ACTIVE LINK HIGHLIGHT
// ===========================
document
  .querySelectorAll(
    ".nav-link:not(.dropdown-trigger), .drawer-link:not(.accordion-trigger)",
  )
  .forEach((link) => {
    link.addEventListener("click", function () {
      // Desktop
      document
        .querySelectorAll(".nav-link")
        .forEach((l) => l.classList.remove("active"));
      // Drawer
      document
        .querySelectorAll(".drawer-link")
        .forEach((l) => l.classList.remove("active"));

      this.classList.add("active");
    });
  });

// ===========================
//  CLOSE DRAWER ON RESIZE
// ===========================
window.addEventListener(
  "resize",
  () => {
    if (window.innerWidth > 860) closeMobileDrawer();
  },
  { passive: true },
);
