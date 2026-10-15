// Validation rules — each returns an error message, or "" when the value is fine
const rules = {
  name: (v) => (v.trim().length < 2 ? "Please enter your name." : ""),
  email: (v) => (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "That email doesn't look right." : ""),
  topic: (v) => (!v ? "Pick what you need help with." : ""),
  message: (v) => (v.trim().length < 20 ? `A little more detail please (${20 - v.trim().length} more characters).` : ""),
};

const form = document.getElementById("contact-form");
const submitBtn = document.getElementById("submit");
const message = document.getElementById("message");
const counter = document.getElementById("counter");
const consent = document.getElementById("consent");
const consentError = document.getElementById("consent-error");
const success = document.getElementById("success");
const touched = new Set();

const showError = (el, text) => {
  el.textContent = text;
  el.classList.toggle("show", Boolean(text));
};

// Check one field and paint its valid / invalid state
const validateField = (name) => {
  const input = form.elements[name];
  const field = input.closest(".field");
  const error = rules[name](input.value);
  field.classList.toggle("is-invalid", Boolean(error));
  field.classList.toggle("is-valid", !error && name !== "message");
  input.setAttribute("aria-invalid", Boolean(error));
  input.setAttribute("aria-describedby", `${name}-error`);
  showError(document.getElementById(`${name}-error`), error);
  return !error;
};

Object.keys(rules).forEach((name) => {
  const input = form.elements[name];
  // Validate on leaving a field, then live while typing once it's been touched
  input.addEventListener("blur", () => {
    if (input.value) touched.add(name);
    if (touched.has(name)) validateField(name);
  });
  input.addEventListener("input", () => {
    if (touched.has(name)) validateField(name);
  });
  input.addEventListener("change", () => {
    touched.add(name);
    validateField(name);
  });
});

// Character counter for the message
const MAX = Number(message.getAttribute("maxlength"));
const updateCounter = () => {
  const n = message.value.length;
  counter.textContent = `${n} / ${MAX}`;
  counter.classList.toggle("near", n >= MAX * 0.8 && n < MAX);
  counter.classList.toggle("full", n >= MAX);
};
message.addEventListener("input", updateCounter);

consent.addEventListener("change", () => {
  if (consent.checked) showError(consentError, "");
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const results = Object.keys(rules).map((name) => {
    touched.add(name);
    return validateField(name);
  });
  const consentOk = consent.checked;
  showError(consentError, consentOk ? "" : "Please accept the privacy policy.");

  if (results.includes(false) || !consentOk) {
    submitBtn.classList.remove("shake");
    void submitBtn.offsetWidth; // restart the shake
    submitBtn.classList.add("shake");
    form.querySelector(".is-invalid input, .is-invalid select, .is-invalid textarea")?.focus();
    return;
  }

  // Fake request — swap this timeout for fetch("/api/contact", …)
  submitBtn.classList.add("is-sending");
  submitBtn.disabled = true;
  setTimeout(() => {
    document.getElementById("success-name").textContent = form.elements.name.value.trim().split(" ")[0];
    form.hidden = true;
    success.hidden = false;
    success.querySelector(".again").focus();
  }, 1100);
});

document.getElementById("again").addEventListener("click", () => {
  form.reset();
  touched.clear();
  form.querySelectorAll(".field").forEach((f) => f.classList.remove("is-valid", "is-invalid"));
  form.querySelectorAll(".error").forEach((el) => showError(el, ""));
  submitBtn.classList.remove("is-sending");
  submitBtn.disabled = false;
  updateCounter();
  success.hidden = true;
  form.hidden = false;
  form.elements.name.focus();
});
