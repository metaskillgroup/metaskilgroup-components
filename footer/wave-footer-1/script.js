// Current year in the copyright line
document.querySelector(".year").textContent = new Date().getFullYear();

// Newsletter form with validation + fake request
const form = document.querySelector(".newsletter");
const input = form.querySelector("input");
const msg = form.querySelector(".nl-msg");

const showMessage = (text, type) => {
  msg.textContent = text;
  msg.className = `nl-msg ${type}`;
};

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = input.value.trim();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

  form.classList.remove("invalid");
  if (!valid) {
    // Re-trigger the shake animation
    void form.offsetWidth;
    form.classList.add("invalid");
    showMessage(email ? "That email doesn't look right." : "Please enter your email.", "bad");
    input.focus();
    return;
  }

  form.classList.add("loading");
  showMessage("", "");
  setTimeout(() => {
    form.classList.remove("loading");
    showMessage(`🎉 You're in! Check ${email} to confirm.`, "ok");
    input.value = "";
  }, 1200);
});

input.addEventListener("input", () => {
  if (form.classList.contains("invalid")) {
    form.classList.remove("invalid");
    showMessage("", "");
  }
});

// Back to top
document.querySelector(".to-top").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Mobile accordion for the link columns
const mobile = window.matchMedia("(max-width: 640px)");

document.querySelectorAll(".col h3").forEach((heading) => {
  heading.addEventListener("click", () => {
    if (!mobile.matches) return;
    const col = heading.parentElement;
    const open = col.classList.toggle("open");
    heading.setAttribute("aria-expanded", String(open));
  });
});
