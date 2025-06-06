// Gifting - Sacred Gift Logic with Premium Support

let paypalConfig = null;
let paypalInitialized = false;
let selectedGiftTier = "basic"; // default to basic
let currentGiftAmount = "2.99";

// Initialize
window.addEventListener("load", initializeApp);

async function initializeApp() {
  setupEventListeners();
  await loadPayPalConfig();
  initializeGiftTierSelection();
}

function setupEventListeners() {
  // Form validation
  document
    .getElementById("giverName")
    .addEventListener("input", updateFormValidation);
  document
    .getElementById("giverEmail")
    .addEventListener("input", updateFormValidation);
  document
    .getElementById("recipientName")
    .addEventListener("input", updateFormValidation);
  document
    .getElementById("recipientEmail")
    .addEventListener("input", updateFormValidation);

  // Message character counter
  const messageTextarea = document.getElementById("personalMessage");
  const messageCount = document.getElementById("messageCount");

  messageTextarea.addEventListener("input", () => {
    const length = messageTextarea.value.length;
    messageCount.textContent = length;

    if (length > 450) {
      messageCount.style.color = "#ef4444";
    } else if (length > 400) {
      messageCount.style.color = "#f59e0b";
    } else {
      messageCount.style.color = "rgba(255, 255, 255, 0.6)";
    }
  });
}

function initializeGiftTierSelection() {
  // Set up gift tier card interactions
  document.querySelectorAll(".gift-tier-card").forEach((card) => {
    card.addEventListener("click", function () {
      const tier = this.dataset.tier;
      selectGiftTier(tier);
    });
  });

  // Select basic by default
  selectGiftTier("basic");
}

function selectGiftTier(tier) {
  selectedGiftTier = tier;

  // Update UI
  document.querySelectorAll(".gift-tier-card").forEach((card) => {
    card.classList.remove("selected");
  });
  document.querySelector(`[data-tier="${tier}"]`).classList.add("selected");

  // Update pricing and description
  if (tier === "premium") {
    currentGiftAmount = "4.99";
    document.getElementById("giftPaymentAmount").textContent = "$4.99";
    document.getElementById("giftPaymentDescription").textContent =
      "Sacred gift of Premium Reflection";

    // Show premium features in preview
    document.querySelectorAll(".premium-feature").forEach((el) => {
      el.style.display = "flex";
    });
  } else {
    currentGiftAmount = "2.99";
    document.getElementById("giftPaymentAmount").textContent = "$2.99";
    document.getElementById("giftPaymentDescription").textContent =
      "Sacred gift of Essential Reflection";

    // Hide premium features in preview
    document.querySelectorAll(".premium-feature").forEach((el) => {
      el.style.display = "none";
    });
  }

  // Reinitialize PayPal with new amount
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

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalConfig.clientId}&currency=${paypalConfig.currency}&intent=capture`;

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
  document.getElementById("paypalLoading").style.display = "none";
}

function showPayPalError(message) {
  document.getElementById("paypalLoading").style.display = "none";
  const errorDiv = document.getElementById("paypalError");
  errorDiv.style.display = "block";
  errorDiv.querySelector("span").textContent = `Error: ${message}`;
}

function updateFormValidation() {
  const giverName = document.getElementById("giverName").value.trim();
  const giverEmail = document.getElementById("giverEmail").value.trim();
  const recipientName = document.getElementById("recipientName").value.trim();
  const recipientEmail = document.getElementById("recipientEmail").value.trim();

  const allValid =
    giverName &&
    giverEmail.includes("@") &&
    recipientName &&
    recipientEmail.includes("@");

  // Enable/disable PayPal button based on validation
  const paypalContainer = document.getElementById("paypal-button-container");
  if (paypalContainer) {
    paypalContainer.style.opacity = allValid ? "1" : "0.5";
    paypalContainer.style.pointerEvents = allValid ? "auto" : "none";
  }
}

function reinitializePayPal() {
  // Clear existing PayPal button
  const container = document.getElementById("paypal-button-container");
  container.innerHTML = "";
  paypalInitialized = false;

  // Reinitialize with new amount
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
    window.paypal
      .Buttons({
        style: {
          color: "gold",
          shape: "rect",
          label: "pay",
          height: 45,
          tagline: false,
        },

        onClick: function (data, actions) {
          const giverName = document.getElementById("giverName").value.trim();
          const giverEmail = document.getElementById("giverEmail").value.trim();
          const recipientName = document
            .getElementById("recipientName")
            .value.trim();
          const recipientEmail = document
            .getElementById("recipientEmail")
            .value.trim();

          if (!giverName || giverName.length < 1) {
            alert("Please enter your name first.");
            return actions.reject();
          }

          if (!giverEmail || !giverEmail.includes("@")) {
            alert("Please enter your email address first.");
            return actions.reject();
          }

          if (!recipientName || recipientName.length < 1) {
            alert("Please enter the recipient's name first.");
            return actions.reject();
          }

          if (!recipientEmail || !recipientEmail.includes("@")) {
            alert("Please enter a valid email address for the recipient.");
            return actions.reject();
          }

          return actions.resolve();
        },

        createOrder: function (data, actions) {
          const giverName = document.getElementById("giverName").value.trim();
          const giverEmail = document.getElementById("giverEmail").value.trim();

          const giftType =
            selectedGiftTier === "premium" ? "Premium" : "Essential";

          const orderData = {
            purchase_units: [
              {
                amount: {
                  value: currentGiftAmount,
                  currency_code: paypalConfig.currency,
                },
                description: `Mirror of Truth - Gift ${giftType} Reflection`,
              },
            ],
          };

          if (giverEmail && giverEmail.includes("@")) {
            orderData.payer = {
              email_address: giverEmail,
              name: {
                given_name: giverName.split(" ")[0] || giverName,
                surname: giverName.split(" ").slice(1).join(" ") || "",
              },
            };
          }

          return actions.order.create(orderData);
        },

        onApprove: function (data, actions) {
          return actions.order.capture().then(function (details) {
            handleGiftPaymentSuccess(details);
          });
        },

        onError: function (err) {
          console.error("PayPal error:", err);
          alert("Payment error. Please try again.");
          resetFormState();
        },

        onCancel: function (data) {
          resetFormState();
        },
      })
      .render("#paypal-button-container")
      .then(() => {
        paypalInitialized = true;
        updateFormValidation(); // Set initial state
      })
      .catch((error) => {
        console.error("PayPal render error:", error);
        showPayPalError("Failed to render payment button");
      });
  } catch (error) {
    console.error("PayPal initialization error:", error);
    showPayPalError("Failed to initialize payment");
  }
}

async function handleGiftPaymentSuccess(paymentDetails) {
  document.getElementById("giftingForm").classList.add("form-disabled");
  document.getElementById("processingMessage").style.display = "block";

  try {
    const giftData = {
      giverName: document.getElementById("giverName").value.trim(),
      giverEmail: document.getElementById("giverEmail").value.trim(),
      recipientName: document.getElementById("recipientName").value.trim(),
      recipientEmail: document.getElementById("recipientEmail").value.trim(),
      personalMessage: document.getElementById("personalMessage").value.trim(),
      amount: parseFloat(currentGiftAmount),
      paymentMethod: "paypal",
      paymentId: paymentDetails.id,
      language: "en",
      isPremium: selectedGiftTier === "premium",
    };

    // Create the gift
    const giftResponse = await fetch("/api/gift", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        ...giftData,
      }),
    });

    const giftResult = await giftResponse.json();

    if (!giftResult.success) {
      throw new Error(giftResult.error || "Failed to create gift");
    }

    // Show success and redirect
    const giftType = selectedGiftTier === "premium" ? "Premium" : "Essential";
    setTimeout(() => {
      alert(
        `🎁 ${giftType} gift sent successfully! ${giftData.recipientName} will receive their sacred invitation shortly.`
      );
      window.location.href = "/";
    }, 2000);
  } catch (error) {
    console.error("Gift creation error:", error);
    alert(
      "Gift created but there was an issue sending the invitation. Please contact support."
    );

    setTimeout(() => {
      window.location.href = "/";
    }, 3000);
  }
}

function resetFormState() {
  document.getElementById("giftingForm").classList.remove("form-disabled");
  document.getElementById("processingMessage").style.display = "none";
}

// Cosmic background interaction
document.addEventListener("mousemove", (e) => {
  const particles = document.querySelectorAll(".gift-particle");
  const mouseX = e.clientX / window.innerWidth;
  const mouseY = e.clientY / window.innerHeight;

  particles.forEach((particle, i) => {
    const offset = (i + 1) * 2;
    const moveX = (mouseX - 0.5) * offset;
    const moveY = (mouseY - 0.5) * offset;
    particle.style.transform += ` translate(${moveX}px, ${moveY}px)`;
  });
});

// Form enhancement - auto-format names
document.getElementById("giverName").addEventListener("blur", function () {
  this.value = this.value.replace(/\b\w/g, (l) => l.toUpperCase());
});

document.getElementById("recipientName").addEventListener("blur", function () {
  this.value = this.value.replace(/\b\w/g, (l) => l.toUpperCase());
});

// Sacred form interaction feedback
document.querySelectorAll(".sacred-input").forEach((input) => {
  input.addEventListener("focus", function () {
    createGiftSparkle(this);
  });
});

function createGiftSparkle(element) {
  const rect = element.getBoundingClientRect();

  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const sparkle = document.createElement("div");
      const offsetX = (Math.random() - 0.5) * 100;
      const offsetY = (Math.random() - 0.5) * 100;

      sparkle.style.cssText = `
        position: fixed;
        left: ${rect.left + rect.width / 2 + offsetX}px;
        top: ${rect.top + rect.height / 2 + offsetY}px;
        width: 4px;
        height: 4px;
        background: radial-gradient(circle, rgba(251, 191, 36, 0.8) 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        animation: giftSparkle 2s ease-out forwards;
      `;

      document.body.appendChild(sparkle);
      setTimeout(() => sparkle.remove(), 2000);
    }, i * 100);
  }
}

// Add sparkle animation
const style = document.createElement("style");
style.textContent = `
  @keyframes giftSparkle {
    0% {
      opacity: 0;
      transform: scale(0) rotate(0deg);
    }
    50% {
      opacity: 1;
      transform: scale(1.5) rotate(180deg);
    }
    100% {
      opacity: 0;
      transform: scale(0) rotate(360deg);
    }
  }
`;
document.head.appendChild(style);
