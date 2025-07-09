// Commitment - Registration & PayPal Subscription Integration
// TRANSFORMED: From one-time payments to subscription billing with account creation

let paypalConfig = null;
let paypalInitialized = false;
let selectedTier = "essential"; // default to essential (was basic)
let selectedPeriod = "monthly"; // monthly or yearly
let currentAmount = "4.99";

// Initialize
window.addEventListener("load", initializeApp);

async function initializeApp() {
  setupEventListeners();
  await loadPayPalConfig();
  initializeTierSelection();
}

function setupEventListeners() {
  document
    .getElementById("userName")
    .addEventListener("input", updateFormValidation);
  document
    .getElementById("userEmail")
    .addEventListener("input", updateFormValidation);
}

function initializeTierSelection() {
  // Set up tier card interactions
  document.querySelectorAll(".tier-card").forEach((card) => {
    card.addEventListener("click", function () {
      const tier = this.dataset.tier;
      selectTier(tier);
    });
  });

  // Set up period toggle interactions (if exists)
  document.querySelectorAll(".period-toggle").forEach((toggle) => {
    toggle.addEventListener("click", function () {
      const period = this.dataset.period;
      selectPeriod(period);
    });
  });

  // Select essential by default
  selectTier("essential");
  selectPeriod("monthly");
}

function selectTier(tier) {
  selectedTier = tier;

  // Update UI
  document.querySelectorAll(".tier-card").forEach((card) => {
    card.classList.remove("selected");
  });

  const tierCard = document.querySelector(`[data-tier="${tier}"]`);
  if (tierCard) {
    tierCard.classList.add("selected");
  }

  updatePricing();
}

function selectPeriod(period) {
  selectedPeriod = period;

  // Update UI
  document.querySelectorAll(".period-toggle").forEach((toggle) => {
    toggle.classList.remove("selected");
  });

  const periodToggle = document.querySelector(`[data-period="${period}"]`);
  if (periodToggle) {
    periodToggle.classList.add("selected");
  }

  updatePricing();
}

function updatePricing() {
  // Set pricing based on tier and period
  const pricing = {
    essential: {
      monthly: "4.99",
      yearly: "49.99",
    },
    premium: {
      monthly: "9.99",
      yearly: "99.99",
    },
  };

  currentAmount = pricing[selectedTier][selectedPeriod];

  const amountElement = document.getElementById("paymentAmount");
  const descElement = document.getElementById("paymentDescription");

  if (amountElement) {
    amountElement.textContent = `$${currentAmount}`;
  }

  if (descElement) {
    const tierName = selectedTier === "essential" ? "Essential" : "Premium";
    const periodName = selectedPeriod === "monthly" ? "Monthly" : "Yearly";
    const savings = selectedPeriod === "yearly" ? " (Save 17%)" : "";
    descElement.textContent = `${tierName} Subscription - ${periodName}${savings}`;
  }

  // Reinitialize PayPal with new pricing
  if (paypalInitialized && paypalConfig) {
    reinitializePayPal();
  }
}

async function loadPayPalConfig() {
  try {
    const response = await fetch("/api/payment?action=config");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Failed to load PayPal config");
    }

    paypalConfig = result.config;
    await loadPayPalSDK();
  } catch (error) {
    console.error("PayPal config error:", error);
    showPayPalError(error.message);
  }
}

function loadPayPalSDK() {
  return new Promise((resolve, reject) => {
    if (window.paypal && window.paypal.Buttons) {
      hideLoadingState();
      initializePayPal();
      resolve();
      return;
    }

    // TRANSFORMED: Load PayPal SDK with subscription support
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalConfig.clientId}&vault=true&intent=subscription&currency=${paypalConfig.currency}`;

    const timeout = setTimeout(() => {
      reject(new Error("PayPal SDK loading timeout"));
    }, 15000);

    script.onload = () => {
      clearTimeout(timeout);
      setTimeout(() => {
        if (window.paypal && window.paypal.Buttons) {
          hideLoadingState();
          initializePayPal();
          resolve();
        } else {
          reject(new Error("PayPal SDK loaded but not available"));
        }
      }, 100);
    };

    script.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Failed to load PayPal SDK script"));
    };

    document.head.appendChild(script);
  });
}

function hideLoadingState() {
  const loadingEl = document.getElementById("paypalLoading");
  if (loadingEl) {
    loadingEl.style.display = "none";
  }
}

function showPayPalError(message) {
  hideLoadingState();
  const errorDiv = document.getElementById("paypalError");
  if (errorDiv) {
    errorDiv.style.display = "block";
    const errorSpan = errorDiv.querySelector("span");
    if (errorSpan) {
      errorSpan.textContent = `Error: ${message}`;
    }
  }
}

function updateFormValidation() {
  const nameInput = document.getElementById("userName");
  const emailInput = document.getElementById("userEmail");
  const nameIndicator = document.getElementById("nameIndicator");
  const emailIndicator = document.getElementById("emailIndicator");

  const nameValue = nameInput?.value?.trim() || "";
  const emailValue = emailInput?.value?.trim() || "";

  const nameValid = nameValue.length > 0;
  const emailValid = emailValue.length > 3 && emailValue.includes("@");

  updateFieldValidation(
    nameInput,
    nameIndicator,
    nameValid,
    nameValue.length > 0
  );
  updateFieldValidation(
    emailInput,
    emailIndicator,
    emailValid,
    emailValue.length > 0
  );
}

function updateFieldValidation(input, indicator, isValid, hasContent) {
  if (!input || !indicator) return;

  input.classList.remove("valid", "invalid");
  indicator.classList.remove("show");

  if (hasContent) {
    if (isValid) {
      input.classList.add("valid");
      indicator.textContent = "✓";
      indicator.style.color = "#22c55e";
      indicator.classList.add("show");
    } else {
      input.classList.add("invalid");
      indicator.textContent = "✗";
      indicator.style.color = "#ef4444";
      indicator.classList.add("show");
    }
  }
}

function reinitializePayPal() {
  // Clear existing PayPal button
  const container = document.getElementById("paypal-button-container");
  if (container) {
    container.innerHTML = "";
  }
  paypalInitialized = false;

  // Reinitialize with new settings
  initializePayPal();
}

function initializePayPal() {
  if (!window.paypal || !window.paypal.Buttons) {
    showPayPalError("PayPal SDK not loaded");
    return;
  }

  if (!paypalConfig) {
    showPayPalError("PayPal configuration missing");
    return;
  }

  if (paypalInitialized) return;

  try {
    // TRANSFORMED: Use PayPal subscription flow instead of one-time payments
    window.paypal
      .Buttons({
        style: {
          color: "gold",
          shape: "rect",
          label: "subscribe",
          height: 45,
          tagline: false,
        },

        onClick: function (data, actions) {
          const nameValue =
            document.getElementById("userName")?.value?.trim() || "";
          const emailValue =
            document.getElementById("userEmail")?.value?.trim() || "";

          if (!nameValue || nameValue.length < 1) {
            alert("Please enter your name first.");
            return actions.reject();
          }

          if (!emailValue || !emailValue.includes("@")) {
            alert("Please enter a valid email address first.");
            return actions.reject();
          }

          return actions.resolve();
        },

        // TRANSFORMED: Create subscription instead of one-time order
        createSubscription: function (data, actions) {
          const planId =
            paypalConfig.subscriptions[selectedTier][selectedPeriod].planId;

          if (!planId) {
            throw new Error("Subscription plan not configured");
          }

          return actions.subscription.create({
            plan_id: planId,
            subscriber: {
              name: {
                given_name:
                  document.getElementById("userName")?.value?.trim() || "",
              },
              email_address:
                document.getElementById("userEmail")?.value?.trim() || "",
            },
            application_context: {
              brand_name: "Mirror of Truth",
              user_action: "SUBSCRIBE_NOW",
              payment_method: {
                payer_selected: "PAYPAL",
                payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
              },
              return_url: `${window.location.origin}/breathing?payment=subscription&verified=true`,
              cancel_url: window.location.href,
            },
          });
        },

        // TRANSFORMED: Handle subscription approval
        onApprove: function (data, actions) {
          console.log("Subscription approved:", data.subscriptionID);
          return handleSubscriptionSuccess(data.subscriptionID);
        },

        onError: function (err) {
          console.error("PayPal subscription error:", err);
          alert("Subscription error. Please try again.");
          resetFormState();
        },

        onCancel: function (data) {
          console.log("Subscription cancelled:", data);
          resetFormState();
        },
      })
      .render("#paypal-button-container")
      .then(() => {
        paypalInitialized = true;
        console.log("PayPal subscription buttons initialized");
      })
      .catch((error) => {
        console.error("PayPal render error:", error);
        showPayPalError("Failed to render subscription button");
      });
  } catch (error) {
    console.error("PayPal initialization error:", error);
    showPayPalError("Failed to initialize subscription");
  }
}

// TRANSFORMED: Handle subscription success and account creation
async function handleSubscriptionSuccess(subscriptionId) {
  const form = document.getElementById("registrationForm");
  const processingMessage = document.getElementById("processingMessage");

  if (form) {
    form.classList.add("form-disabled");
  }
  if (processingMessage) {
    processingMessage.style.display = "block";
    processingMessage.innerHTML =
      "⏳ Creating your sacred space and activating subscription...";
  }

  try {
    const userData = {
      name: document.getElementById("userName").value.trim(),
      email: document.getElementById("userEmail").value.trim(),
      tier: selectedTier,
      period: selectedPeriod,
      language: "en",
      subscriptionId: subscriptionId,
    };

    // TRANSFORMED: Create subscription and user account
    const response = await fetch("/api/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create-subscription",
        ...userData,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      if (result.requiresSignin) {
        // User already exists, redirect to sign in
        alert(
          "An account with this email already exists. Please sign in instead."
        );
        window.location.href = "/auth/signin";
        return;
      }
      throw new Error(result.error || "Subscription creation failed");
    }

    // Store user session data
    localStorage.setItem("mirrorAuthToken", result.token);
    localStorage.setItem("mirrorUserData", JSON.stringify(result.user));

    console.log("✅ Subscription and account created successfully");

    // Navigate to breathing experience
    const urlParams = new URLSearchParams({
      payment: "subscription",
      verified: "true",
      lang: "en",
      tier: selectedTier,
      period: selectedPeriod,
    });

    setTimeout(() => {
      window.location.href = `/transition/breathing.html?${urlParams.toString()}`;
    }, 2000);
  } catch (error) {
    console.error("Subscription creation error:", error);

    if (processingMessage) {
      processingMessage.innerHTML =
        "❌ Subscription creation failed. Please try again.";
      processingMessage.style.background = "rgba(239, 68, 68, 0.15)";
      processingMessage.style.borderColor = "rgba(239, 68, 68, 0.3)";
      processingMessage.style.color = "#fca5a5";
    }

    setTimeout(() => {
      resetFormState();
    }, 3000);
  }
}

function resetFormState() {
  const form = document.getElementById("registrationForm");
  const processingMessage = document.getElementById("processingMessage");

  if (form) {
    form.classList.remove("form-disabled");
  }
  if (processingMessage) {
    processingMessage.style.display = "none";
    // Reset styling
    processingMessage.style.background = "";
    processingMessage.style.borderColor = "";
    processingMessage.style.color = "";
  }
}

// Handle sign in redirect for existing users
function redirectToSignIn() {
  window.location.href =
    "/auth/signin?returnTo=" + encodeURIComponent(window.location.pathname);
}
