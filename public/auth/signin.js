// Sacred Sign In - Authentication Logic for Mirror of Truth
// Connects seamlessly with existing auth.js API and user flow

let isLoading = false;
let validationState = {
  email: false,
  password: false,
};

// Initialize on page load
window.addEventListener("load", initializeSignIn);

function initializeSignIn() {
  setupFormValidation();
  setupFormSubmission();
  checkExistingSession();
  animateEntry();
}

// Check if user is already signed in
async function checkExistingSession() {
  const token = localStorage.getItem("mirror_auth_token");

  if (token) {
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "verify-token" }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // User is already signed in, redirect appropriately
          console.log("🪞 Existing session found, redirecting...");
          redirectUser(data.user);
          return;
        }
      }
    } catch (error) {
      console.log("🪞 Session check failed:", error.message);
    }

    // Invalid token, remove it
    localStorage.removeItem("mirror_auth_token");
    localStorage.removeItem("mirrorVerifiedUser");
  }
}

// Setup form validation with sacred feedback
function setupFormValidation() {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  // Email validation
  emailInput.addEventListener("input", function () {
    const email = this.value.trim();
    const isValid = validateEmail(email);

    validationState.email = isValid;
    updateFieldValidation(this, "emailFeedback", isValid, email.length > 0);
    updateSubmitButton();
  });

  emailInput.addEventListener("blur", function () {
    const email = this.value.trim();
    if (email.length > 0) {
      const isValid = validateEmail(email);
      updateFieldValidation(this, "emailFeedback", isValid, true);
    }
  });

  // Password validation
  passwordInput.addEventListener("input", function () {
    const password = this.value;
    const isValid = password.length >= 6;

    validationState.password = isValid;
    updateFieldValidation(
      this,
      "passwordFeedback",
      isValid,
      password.length > 0
    );
    updateSubmitButton();
  });

  // Enter key handling
  [emailInput, passwordInput].forEach((input) => {
    input.addEventListener("keypress", function (e) {
      if (e.key === "Enter" && !isLoading) {
        handleSignIn();
      }
    });
  });
}

// Setup form submission
function setupFormSubmission() {
  const form = document.getElementById("signinForm");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!isLoading) {
      handleSignIn();
    }
  });
}

// Email validation helper
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Update field validation state
function updateFieldValidation(input, feedbackId, isValid, hasContent) {
  const feedback = document.getElementById(feedbackId);

  // Remove previous states
  input.classList.remove("valid", "invalid");
  feedback.classList.remove("show");

  if (hasContent) {
    if (isValid) {
      input.classList.add("valid");
      feedback.textContent = "✓";
      feedback.style.color = "#22c55e";
      feedback.classList.add("show");
    } else {
      input.classList.add("invalid");
      feedback.textContent = "✗";
      feedback.style.color = "#ef4444";
      feedback.classList.add("show");
    }
  }
}

// Update submit button state
function updateSubmitButton() {
  const button = document.getElementById("signinButton");
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const canSubmit = email.length > 0 && password.length > 0 && !isLoading;

  button.disabled = !canSubmit;

  if (canSubmit) {
    button.style.opacity = "1";
    button.style.cursor = "pointer";
  } else {
    button.style.opacity = "0.6";
    button.style.cursor = "not-allowed";
  }
}

// Handle sign in submission
async function handleSignIn() {
  if (isLoading) return;

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  // Basic validation
  if (!email || !password) {
    showError("Please enter both email and password");
    return;
  }

  if (!validateEmail(email)) {
    showError("Please enter a valid email address");
    return;
  }

  if (password.length < 6) {
    showError("Password must be at least 6 characters");
    return;
  }

  // Start loading state
  setLoadingState(true);
  hideMessages();

  try {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "signin",
        email: email,
        password: password,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Store authentication token
      localStorage.setItem("mirror_auth_token", data.token);

      // Store user data in format expected by existing app
      const userData = {
        name: data.user.name,
        email: data.user.email,
        language: data.user.language || "en",
        isCreator: data.user.isCreator || false,
        isAdmin: data.user.isAdmin || false,
        tier: data.user.tier || "free",
        subscriptionStatus: data.user.subscriptionStatus || "active",
        reflectionCountThisMonth: data.user.reflectionCountThisMonth || 0,
        totalReflections: data.user.totalReflections || 0,
      };

      localStorage.setItem("mirrorVerifiedUser", JSON.stringify(userData));

      console.log(
        `🪞 Sign in successful: ${userData.email} (${userData.tier})`
      );

      // Show success message briefly
      showSuccess("Welcome back! Preparing your sacred space...");

      // Handle remember me
      const rememberMe = document.getElementById("rememberMe").checked;
      if (rememberMe) {
        localStorage.setItem("mirror_remember_email", email);
      } else {
        localStorage.removeItem("mirror_remember_email");
      }

      // Redirect after brief delay
      setTimeout(() => {
        redirectUser(userData);
      }, 1500);
    } else {
      // Handle authentication error
      const errorMessage = data.error || "Sign in failed";
      showError(errorMessage);
      setLoadingState(false);
    }
  } catch (error) {
    console.error("🪞 Sign in error:", error);
    showError("Connection error. Please check your internet and try again.");
    setLoadingState(false);
  }
}

// Redirect user based on their profile
function redirectUser(userData) {
  // Show loading overlay for transition
  const loadingOverlay = document.getElementById("loadingOverlay");
  loadingOverlay.style.display = "flex";
  requestAnimationFrame(() => {
    loadingOverlay.classList.add("show");
  });

  // Determine where to redirect
  let redirectUrl = "/dashboard"; // Default to dashboard (to be built in Phase 2)

  // For now, redirect to portal with user context since dashboard doesn't exist yet
  // In Phase 2, this will redirect to the actual dashboard
  if (userData.isCreator) {
    console.log("🪞 Creator signed in, redirecting to portal");
    redirectUrl = "/?signed-in=true&user=creator";
  } else {
    console.log("🪞 User signed in, redirecting to portal");
    redirectUrl = "/?signed-in=true&user=member";
  }

  // Navigate after brief loading animation
  setTimeout(() => {
    window.location.href = redirectUrl;
  }, 1000);
}

// Loading state management
function setLoadingState(loading) {
  isLoading = loading;
  const button = document.getElementById("signinButton");
  const buttonText = button.querySelector(".button-text");
  const buttonLoader = button.querySelector(".button-loader");

  if (loading) {
    buttonText.style.display = "none";
    buttonLoader.style.display = "flex";
    button.disabled = true;

    // Disable form inputs
    document.getElementById("email").disabled = true;
    document.getElementById("password").disabled = true;
  } else {
    buttonText.style.display = "block";
    buttonLoader.style.display = "none";

    // Re-enable form inputs
    document.getElementById("email").disabled = false;
    document.getElementById("password").disabled = false;

    updateSubmitButton();
  }
}

// Message display functions
function showError(message) {
  const errorDiv = document.getElementById("errorMessage");
  errorDiv.textContent = message;
  errorDiv.style.display = "block";

  requestAnimationFrame(() => {
    errorDiv.classList.add("show");
  });

  // Auto-hide after 5 seconds
  setTimeout(() => {
    hideError();
  }, 5000);
}

function showSuccess(message) {
  const successDiv = document.getElementById("successMessage");
  successDiv.textContent = message;
  successDiv.style.display = "block";

  requestAnimationFrame(() => {
    successDiv.classList.add("show");
  });
}

function hideError() {
  const errorDiv = document.getElementById("errorMessage");
  errorDiv.classList.remove("show");
  setTimeout(() => {
    errorDiv.style.display = "none";
  }, 300);
}

function hideSuccess() {
  const successDiv = document.getElementById("successMessage");
  successDiv.classList.remove("show");
  setTimeout(() => {
    successDiv.style.display = "none";
  }, 300);
}

function hideMessages() {
  hideError();
  hideSuccess();
}

// Forgot password modal
function showForgotPassword() {
  const modal = document.getElementById("forgotModal");
  modal.style.display = "flex";

  requestAnimationFrame(() => {
    modal.classList.add("show");
  });

  // Focus trap for accessibility
  const closeBtn = modal.querySelector(".modal-close");
  closeBtn.focus();
}

function closeForgotPassword() {
  const modal = document.getElementById("forgotModal");
  modal.classList.remove("show");

  setTimeout(() => {
    modal.style.display = "none";
  }, 300);

  // Return focus to forgot password link
  document.querySelector(".forgot-link").focus();
}

// Entry animation
function animateEntry() {
  // Pre-populate email if remembered
  const rememberedEmail = localStorage.getItem("mirror_remember_email");
  if (rememberedEmail) {
    document.getElementById("email").value = rememberedEmail;
    document.getElementById("rememberMe").checked = true;

    // Validate the pre-filled email
    setTimeout(() => {
      const emailInput = document.getElementById("email");
      const isValid = validateEmail(rememberedEmail);
      validationState.email = isValid;
      updateFieldValidation(emailInput, "emailFeedback", isValid, true);
      updateSubmitButton();

      // Focus password field
      document.getElementById("password").focus();
    }, 500);
  } else {
    // Focus email field
    setTimeout(() => {
      document.getElementById("email").focus();
    }, 500);
  }
}

// Handle modal backdrop clicks
document.addEventListener("click", function (e) {
  const forgotModal = document.getElementById("forgotModal");

  if (e.target === forgotModal) {
    closeForgotPassword();
  }
});

// Handle escape key for modal
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    const forgotModal = document.getElementById("forgotModal");
    if (forgotModal.classList.contains("show")) {
      closeForgotPassword();
    }
  }
});

// Prevent form submission on enter in modal
document
  .getElementById("forgotModal")
  .addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  });

// Touch-friendly interactions for mobile
if ("ontouchstart" in window) {
  // Add touch feedback for buttons
  document
    .querySelectorAll(".sacred-button, .register-link, .back-link")
    .forEach((button) => {
      button.addEventListener("touchstart", function () {
        this.style.transform = "scale(0.98)";
      });

      button.addEventListener("touchend", function () {
        this.style.transform = "";
      });
    });
}

// Log for debugging (development only)
if (window.location.hostname === "localhost") {
  console.log("🪞 Sacred Sign In initialized");

  // Add debug info
  window.debugSignIn = {
    validationState,
    isLoading: () => isLoading,
    checkSession: checkExistingSession,
  };
}
