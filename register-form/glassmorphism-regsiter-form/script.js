// ===========================
//  PASSWORD TOGGLE
// ===========================
function setupToggle(toggleId, inputId) {
  const toggle = document.getElementById(toggleId);
  const input = document.getElementById(inputId);
  if (!toggle || !input) return;

  toggle.addEventListener("click", () => {
    const isPass = input.type === "password";
    input.type = isPass ? "text" : "password";
    toggle.textContent = isPass ? "visibility" : "visibility_off";
  });
}

setupToggle("togglePass", "password");
setupToggle("toggleConfirm", "confirmPassword");

// ===========================
//  HELPERS
// ===========================
function setError(inputBoxId, errId, msg) {
  const box = document.getElementById(inputBoxId)?.closest(".input-box");
  const err = document.getElementById(errId);
  if (box) {
    box.classList.add("error-state");
    box.classList.remove("success-state");
  }
  if (err) err.textContent = msg;
}

function setSuccess(inputBoxId, errId) {
  const box = document.getElementById(inputBoxId)?.closest(".input-box");
  const err = document.getElementById(errId);
  if (box) {
    box.classList.remove("error-state");
    box.classList.add("success-state");
  }
  if (err) err.textContent = "";
}

function clearState(inputBoxId, errId) {
  const box = document.getElementById(inputBoxId)?.closest(".input-box");
  const err = document.getElementById(errId);
  if (box) {
    box.classList.remove("error-state", "success-state");
  }
  if (err) err.textContent = "";
}

// ===========================
//  LIVE VALIDATION
// ===========================
document.getElementById("firstName").addEventListener("blur", () => {
  const val = document.getElementById("firstName").value.trim();
  val.length >= 2
    ? setSuccess("firstName", "firstNameErr")
    : setError(
        "firstName",
        "firstNameErr",
        "First name must be at least 2 characters.",
      );
});

document.getElementById("lastName").addEventListener("blur", () => {
  const val = document.getElementById("lastName").value.trim();
  val.length >= 2
    ? setSuccess("lastName", "lastNameErr")
    : setError(
        "lastName",
        "lastNameErr",
        "Last name must be at least 2 characters.",
      );
});

document.getElementById("email").addEventListener("blur", () => {
  const val = document.getElementById("email").value.trim();
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  emailRx.test(val)
    ? setSuccess("email", "emailErr")
    : setError("email", "emailErr", "Enter a valid email address.");
});

document.getElementById("password").addEventListener("input", () => {
  const val = document.getElementById("password").value;
  if (val.length === 0) {
    clearState("password", "passwordErr");
    return;
  }
  val.length >= 8
    ? setSuccess("password", "passwordErr")
    : setError(
        "password",
        "passwordErr",
        "Password must be at least 8 characters.",
      );
});

document.getElementById("confirmPassword").addEventListener("input", () => {
  const pass = document.getElementById("password").value;
  const confirm = document.getElementById("confirmPassword").value;
  if (confirm.length === 0) {
    clearState("confirmPassword", "confirmPasswordErr");
    return;
  }
  pass === confirm
    ? setSuccess("confirmPassword", "confirmPasswordErr")
    : setError(
        "confirmPassword",
        "confirmPasswordErr",
        "Passwords do not match.",
      );
});

// ===========================
//  FORM SUBMIT
// ===========================
document.getElementById("registerForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const terms = document.getElementById("terms").checked;
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let valid = true;

  if (firstName.length < 2) {
    setError(
      "firstName",
      "firstNameErr",
      "First name must be at least 2 characters.",
    );
    valid = false;
  } else setSuccess("firstName", "firstNameErr");

  if (lastName.length < 2) {
    setError(
      "lastName",
      "lastNameErr",
      "Last name must be at least 2 characters.",
    );
    valid = false;
  } else setSuccess("lastName", "lastNameErr");

  if (!emailRx.test(email)) {
    setError("email", "emailErr", "Enter a valid email address.");
    valid = false;
  } else setSuccess("email", "emailErr");

  if (password.length < 8) {
    setError(
      "password",
      "passwordErr",
      "Password must be at least 8 characters.",
    );
    valid = false;
  } else setSuccess("password", "passwordErr");

  if (password !== confirmPassword) {
    setError(
      "confirmPassword",
      "confirmPasswordErr",
      "Passwords do not match.",
    );
    valid = false;
  } else if (confirmPassword.length > 0)
    setSuccess("confirmPassword", "confirmPasswordErr");

  if (!terms) {
    document.getElementById("termsErr").textContent =
      "Please accept the terms to continue.";
    valid = false;
  } else {
    document.getElementById("termsErr").textContent = "";
  }

  if (!valid) return;

  // Success state
  const btn = document.querySelector(".submit-btn");
  btn.classList.add("success-state");
  btn.innerHTML = `<span class="material-icons-round">check_circle</span><span>Account Created!</span>`;
  btn.disabled = true;
});
