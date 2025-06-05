// Commitment - Registration & PayPal Integration (Production)

let paypalConfig = null;
let paypalInitialized = false;

// Initialize
window.addEventListener("load", initializeApp);

async function initializeApp() {
  setupEventListeners();
  await loadPayPalConfig();
}

function setupEventListeners() {
  document
    .getElementById("userName")
    .addEventListener("input", updateFormValidation);
  document
    .getElementById("userEmail")
    .addEventListener("input", updateFormValidation);
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

        createOrder: function (data, actions) {
          const userEmail =
            document.getElementById("userEmail")?.value?.trim() || "";
          const userName =
            document.getElementById("userName")?.value?.trim() || "";

          const orderData = {
            purchase_units: [
              {
                amount: {
                  value: "2.99",
                  currency_code: paypalConfig.currency,
                },
                description: "Mirror of Truth - Reflection Experience",
              },
            ],
          };

          if (userEmail && userEmail.includes("@")) {
            orderData.payer = {
              email_address: userEmail,
              name: {
                given_name: userName.split(" ")[0] || userName,
                surname: userName.split(" ").slice(1).join(" ") || "",
              },
            };
          }

          return actions.order.create(orderData);
        },

        onApprove: function (data, actions) {
          return actions.order.capture().then(function (details) {
            handlePaymentSuccess(details);
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

async function handlePaymentSuccess(paymentDetails) {
  document.getElementById("registrationForm").classList.add("form-disabled");
  document.getElementById("processingMessage").style.display = "block";

  try {
    const userData = {
      name: document.getElementById("userName").value.trim(),
      email: document.getElementById("userEmail").value.trim(),
      language: "en",
      paymentId: paymentDetails.id,
      paymentMethod: "paypal",
    };

    localStorage.setItem("mirrorVerifiedUser", JSON.stringify(userData));

    // Generate receipt
    try {
      await fetch("/api/communication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-receipt",
          email: userData.email,
          name: userData.name,
          amount: 2.99,
          paymentMethod: "paypal",
          language: "en",
        }),
      });
    } catch (receiptError) {
      console.warn("Receipt generation error:", receiptError);
    }

    // Navigate to breathing
    setTimeout(() => {
      window.location.href = `/transition/breathing.html?payment=paypal&verified=true&lang=en`;
    }, 2000);
  } catch (error) {
    setTimeout(() => {
      window.location.href = `/transition/breathing.html?payment=paypal&verified=true&lang=en`;
    }, 2000);
  }
}

function resetFormState() {
  document.getElementById("registrationForm").classList.remove("form-disabled");
  document.getElementById("processingMessage").style.display = "none";
}
