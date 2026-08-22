// ===========================
//  PASSWORD TOGGLE
// ===========================
const togglePass = document.getElementById("togglePass");
const passwordInput = document.getElementById("password");

togglePass.addEventListener("click", () => {
  const isPass = passwordInput.type === "password";
  passwordInput.type = isPass ? "text" : "password";
  togglePass.textContent = isPass ? "visibility" : "visibility_off";
});

// ===========================
//  HELPERS
// ===========================
function setError(inputId, errId, msg) {
  const box = document.getElementById(inputId)?.closest(".input-box");
  const err = document.getElementById(errId);
  if (box) {
    box.classList.add("error-state");
    box.classList.remove("success-state");
  }
  if (err) err.textContent = msg;
}

function setSuccess(inputId, errId) {
  const box = document.getElementById(inputId)?.closest(".input-box");
  const err = document.getElementById(errId);
  if (box) {
    box.classList.remove("error-state");
    box.classList.add("success-state");
  }
  if (err) err.textContent = "";
}

function clearState(inputId, errId) {
  const box = document.getElementById(inputId)?.closest(".input-box");
  const err = document.getElementById(errId);
  if (box) box.classList.remove("error-state", "success-state");
  if (err) err.textContent = "";
}

// ===========================
//  LIVE VALIDATION
// ===========================
const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

document.getElementById("email").addEventListener("blur", () => {
  const val = document.getElementById("email").value.trim();
  emailRx.test(val)
    ? setSuccess("email", "emailErr")
    : setError("email", "emailErr", "Enter a valid email address.");
});

document.getElementById("email").addEventListener("input", () => {
  const val = document.getElementById("email").value.trim();
  if (val.length === 0) clearState("email", "emailErr");
});

document.getElementById("password").addEventListener("input", () => {
  const val = document.getElementById("password").value;
  if (val.length === 0) {
    clearState("password", "passwordErr");
    return;
  }
  val.length >= 6
    ? setSuccess("password", "passwordErr")
    : setError(
        "password",
        "passwordErr",
        "Password must be at least 6 characters.",
      );
});

// ===========================
//  FORM SUBMIT
// ===========================
document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  let valid = true;

  if (!emailRx.test(email)) {
    setError("email", "emailErr", "Enter a valid email address.");
    valid = false;
  } else {
    setSuccess("email", "emailErr");
  }

  if (password.length < 6) {
    setError(
      "password",
      "passwordErr",
      "Password must be at least 6 characters.",
    );
    valid = false;
  } else {
    setSuccess("password", "passwordErr");
  }

  if (!valid) return;

  // Success state
  const btn = document.querySelector(".submit-btn");
  btn.classList.add("success-state");
  btn.innerHTML = `<span class="material-icons-round">check_circle</span><span>Welcome Back!</span>`;
  btn.disabled = true;
});

// ===========================
//  SOCIAL BUTTON RIPPLE
// ===========================
document.querySelectorAll(".social-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    this.style.transform = "scale(0.96)";
    setTimeout(() => (this.style.transform = ""), 150);
  });
});
