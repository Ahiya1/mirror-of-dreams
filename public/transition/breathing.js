// Transition - Breathing to Reflection TRANSFORMED: Auth-Aware Flow + Gift Support
// MAJOR CHANGES: Handle authenticated users, preserve subscription context, maintain gift flow

let isGiftFlow = false;
let giftData = null;
let sessionParams = null;
let authToken = null;
let userContext = null;

// Initialize on load
window.addEventListener("load", initializeBreathing);

async function initializeBreathing() {
  sessionParams = getUrlParams();
  authToken = localStorage.getItem("mirrorAuthToken");

  // TRANSFORMED: Check for authenticated user context
  if (authToken && !sessionParams.gift) {
    await loadUserContext();
  }

  // Check if this is a gift flow
  if (sessionParams.gift) {
    isGiftFlow = true;
    await handleGiftFlow(sessionParams.gift);
  } else {
    // Regular flow - show breathing experience immediately
    showBreathingExperience();
  }
}

function getUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    payment: urlParams.get("payment"),
    verified: urlParams.get("verified"),
    lang: urlParams.get("lang"),
    mode: urlParams.get("mode"),
    tier: urlParams.get("tier"),
    period: urlParams.get("period"),
    gift: urlParams.get("gift"),
  };
}

// TRANSFORMED: Load authenticated user context
async function loadUserContext() {
  try {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ action: "verify-token" }),
    });

    const result = await response.json();
    if (result.success && result.user) {
      userContext = result.user;
      console.log(
        `✅ User context loaded: ${userContext.email} (${userContext.tier})`
      );

      // Customize breathing experience for returning users
      customizeForUser();
    } else {
      // Invalid token, clear it
      localStorage.removeItem("mirrorAuthToken");
      localStorage.removeItem("mirrorUserData");
    }
  } catch (error) {
    console.error("User context loading failed:", error);
    // Continue with regular flow
  }
}

function customizeForUser() {
  if (!userContext) return;

  // Customize text for returning users
  const welcomeTexts = document.querySelectorAll(".breath-text");
  if (welcomeTexts.length >= 4) {
    // Personalize some of the breathing texts
    welcomeTexts[0].textContent = `welcome back, ${
      userContext.name.split(" ")[0]
    }`;
    welcomeTexts[1].textContent = "your truth deepens";
    welcomeTexts[2].textContent = "with each return";
    welcomeTexts[3].textContent = "ready for more clarity?";
  }

  // Update the "what now?" text for returning users
  const whatNowText = document.querySelector(".what-now-text");
  if (whatNowText) {
    if (userContext.tier === "free") {
      whatNowText.textContent = "ready to upgrade?";
    } else {
      whatNowText.textContent = "what calls you now?";
    }
  }
}

// PRESERVED: Gift flow handling
async function handleGiftFlow(giftCode) {
  try {
    // Show validation screen
    document.getElementById("giftValidation").style.display = "flex";

    // Validate the gift
    const response = await fetch(
      `/api/subscriptions?action=validate-gift&giftCode=${encodeURIComponent(
        giftCode
      )}`
    );
    const result = await response.json();

    if (!result.success || !result.valid) {
      showGiftError(result.error || "Invalid or expired gift code");
      return;
    }

    giftData = result.gift;

    // Hide validation and show welcome
    document.getElementById("giftValidation").style.display = "none";
    showGiftWelcome();
  } catch (error) {
    console.error("Gift validation error:", error);
    showGiftError("Unable to validate gift. Please try again.");
  }
}

function showGiftWelcome() {
  const welcomeScreen = document.getElementById("giftWelcome");
  const titleEl = document.getElementById("giftWelcomeTitle");
  const messageEl = document.getElementById("giftWelcomeMessage");
  const personalMessageEl = document.getElementById("giftPersonalMessage");
  const personalContentEl = document.getElementById("personalMessageContent");

  titleEl.textContent = `Welcome, ${giftData.recipientName}`;

  const tierName =
    giftData.subscriptionTier === "essential" ? "Essential" : "Premium";
  const duration =
    giftData.subscriptionDuration === 1
      ? "1 month"
      : giftData.subscriptionDuration === 3
      ? "3 months"
      : "1 year";

  messageEl.textContent = `${giftData.giverName} has gifted you a ${tierName} subscription for ${duration}.`;

  if (giftData.personalMessage && giftData.personalMessage.trim()) {
    personalMessageEl.style.display = "block";
    personalContentEl.textContent = `"${giftData.personalMessage}"`;
  }

  welcomeScreen.style.display = "flex";
}

function showGiftError(message) {
  document.getElementById("giftValidation").style.display = "none";

  // Create error display
  const errorDiv = document.createElement("div");
  errorDiv.className = "gift-error";
  errorDiv.innerHTML = `
    <div class="gift-error-content">
      <div class="error-icon">⚠️</div>
      <h2>Gift Issue</h2>
      <p>${message}</p>
      <button onclick="window.location.href = '/'" class="error-return-btn">
        Return to Portal
      </button>
    </div>
  `;

  document.body.appendChild(errorDiv);
}

async function proceedFromGift() {
  try {
    // Redeem the gift
    const response = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "redeem-gift",
        giftCode: sessionParams.gift,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to redeem gift");
    }

    // TRANSFORMED: Store auth token if user was created
    if (result.token) {
      localStorage.setItem("mirrorAuthToken", result.token);
    }
    if (result.user) {
      localStorage.setItem("mirrorUserData", JSON.stringify(result.user));
    }

    console.log("🎁 Gift redeemed successfully");

    // Hide gift welcome and show breathing experience
    document.getElementById("giftWelcome").style.display = "none";
    showBreathingExperience();
  } catch (error) {
    console.error("Gift redemption error:", error);
    alert(
      "There was an issue redeeming your gift. Please try again or contact support."
    );
  }
}

function showBreathingExperience() {
  const container = document.querySelector(".breathing-container");
  container.style.display = "flex";

  // TRANSFORMED: Customize continue indicator based on user context
  const continueIndicator = document.querySelector(".continue-indicator span");
  if (continueIndicator && userContext) {
    if (userContext.totalReflections > 0) {
      continueIndicator.textContent = "breathe to continue your journey";
    } else {
      continueIndicator.textContent = "breathe to begin";
    }
  }

  // Activate click-anywhere once indicator shows (after 23 seconds)
  setTimeout(() => {
    document.body.addEventListener("click", proceed);
    document.body.style.cursor = "pointer";
  }, 23500);

  // Auto-proceed after 30 seconds total for the complete experience
  setTimeout(proceed, 30000);
}

// TRANSFORMED: Enhanced proceed function with auth-aware routing
function proceed() {
  const params = sessionParams;

  // Build the reflection URL based on user context
  let reflectionUrl = "/reflection";

  if (isGiftFlow) {
    // For gifts, user is now authenticated
    reflectionUrl = "/reflection?source=gift";
  } else if (userContext) {
    // Authenticated user - direct to reflection
    const urlParams = new URLSearchParams();
    if (params.tier) urlParams.set("tier", params.tier);
    if (params.mode) urlParams.set("mode", params.mode);

    const queryString = urlParams.toString();
    reflectionUrl = queryString ? `/reflection?${queryString}` : "/reflection";
  } else if (params.payment || params.verified || params.lang || params.mode) {
    // Legacy flow support (creator/test modes)
    const queryParams = new URLSearchParams();

    if (params.payment) queryParams.set("payment", params.payment);
    if (params.verified) queryParams.set("verified", params.verified);
    if (params.lang) queryParams.set("lang", params.lang);
    if (params.mode) queryParams.set("mode", params.mode);
    if (params.tier) queryParams.set("tier", params.tier);

    reflectionUrl += "?" + queryParams.toString();
  } else {
    // No authentication - redirect to sign in
    const returnUrl = encodeURIComponent("/reflection");
    window.location.href = `/auth/signin?returnTo=${returnUrl}`;
    return;
  }

  console.log(`🔄 Proceeding to reflection: ${reflectionUrl}`);

  // Navigate to reflection with preserved parameters
  window.location.href = reflectionUrl;
}

// PRESERVED: Subtle interaction feedback with breathing circles
document.addEventListener("mousemove", (e) => {
  const circles = document.querySelectorAll(".breathing-circle");
  const mouseX = e.clientX / window.innerWidth;
  const mouseY = e.clientY / window.innerHeight;

  circles.forEach((circle, i) => {
    const offset = (i + 1) * 1.5; // Very subtle movement
    const moveX = (mouseX - 0.5) * offset;
    const moveY = (mouseY - 0.5) * offset;
    circle.style.transform = `translate(${moveX}px, ${moveY}px)`;
  });
});

// PRESERVED: Gentle breathing sound visualization
let breathPhase = 0;
setInterval(() => {
  breathPhase = (breathPhase + 0.1) % (Math.PI * 2);
  const scale = 1 + Math.sin(breathPhase) * 0.015; // Very subtle
  const geometryLayer = document.querySelector(".geometry-layer");
  if (geometryLayer) {
    geometryLayer.style.transform = `scale(${scale})`;
  }
}, 50);

// PRESERVED: Special effect when "what now?" appears
setTimeout(() => {
  // Create a subtle radial pulse
  const pulse = document.createElement("div");
  pulse.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
    pointer-events: none;
    z-index: 5;
    animation: whatNowPulse 3s ease-out forwards;
  `;
  document.body.appendChild(pulse);

  // Remove after animation
  setTimeout(() => pulse.remove(), 3000);
}, 20000);

// ENHANCED: Add user context awareness to the breathing experience
setTimeout(() => {
  if (userContext && userContext.tier !== "free") {
    // Add subtle premium elements for paid users
    const premiumGlow = document.createElement("div");
    premiumGlow.style.cssText = `
      position: fixed;
      inset: 0;
      background: radial-gradient(
        circle at 50% 50%,
        rgba(251, 191, 36, 0.02) 0%,
        transparent 50%
      );
      pointer-events: none;
      z-index: 1;
      opacity: 0;
      animation: premiumGlow 8s ease-in-out infinite;
    `;
    document.body.appendChild(premiumGlow);
  }
}, 15000); // Start after 15 seconds

// Add enhanced animations and gift styles (preserved from original)
const style = document.createElement("style");
style.textContent = `
  @keyframes whatNowPulse {
    0% {
      transform: translate(-50%, -50%) scale(0);
      opacity: 0;
    }
    50% {
      opacity: 0.3;
    }
    100% {
      transform: translate(-50%, -50%) scale(3);
      opacity: 0;
    }
  }
  
  @keyframes premiumGlow {
    0%, 100% {
      opacity: 0;
    }
    50% {
      opacity: 0.6;
    }
  }
  
  /* Gift validation screen */
  .gift-validation {
    position: fixed;
    inset: 0;
    background: rgba(15, 15, 35, 0.95);
    backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .gift-validation-content {
    text-align: center;
    color: white;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(30px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 24px;
    padding: 3rem 2rem;
    max-width: 400px;
    width: 90%;
  }
  
  .gift-icon {
    font-size: 4rem;
    margin-bottom: 1.5rem;
    animation: giftPulse 2s ease-in-out infinite;
  }
  
  @keyframes giftPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
  
  .gift-title {
    font-size: clamp(1.4rem, 4vw, 1.8rem);
    font-weight: 300;
    margin-bottom: 1.5rem;
    background: linear-gradient(135deg, #ffffff 0%, rgba(251, 191, 36, 0.9) 50%, #ffffff 100%);
    -webkit-background-clip: text;
    color: transparent;
  }
  
  .gift-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 1rem;
  }
  
  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: rgba(251, 191, 36, 0.8);
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  /* Gift welcome screen */
  .gift-welcome {
    position: fixed;
    inset: 0;
    background: rgba(15, 15, 35, 0.95);
    backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: giftWelcomeIn 1s ease-out;
  }
  
  @keyframes giftWelcomeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .gift-welcome-content {
    text-align: center;
    color: white;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(30px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 24px;
    padding: 3rem 2rem;
    max-width: 500px;
    width: 90%;
    position: relative;
    overflow: hidden;
  }
  
  .gift-welcome-content::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  }
  
  .gift-message {
    font-size: clamp(1rem, 3vw, 1.2rem);
    margin-bottom: 2rem;
    opacity: 0.9;
    line-height: 1.6;
  }
  
  .gift-personal-message {
    background: rgba(251, 191, 36, 0.1);
    border: 1px solid rgba(251, 191, 36, 0.3);
    border-radius: 12px;
    padding: 1.5rem;
    margin: 1.5rem 0 2rem 0;
  }
  
  .message-content {
    font-style: italic;
    color: rgba(255, 255, 255, 0.95);
    line-height: 1.6;
    font-size: clamp(0.9rem, 2.5vw, 1.1rem);
  }
  
  .gift-continue-btn {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
    border: 2px solid rgba(255, 255, 255, 0.25);
    border-radius: 16px;
    color: white;
    padding: 1.2rem 2.5rem;
    font-size: clamp(1rem, 3vw, 1.1rem);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    letter-spacing: 0.3px;
    background-color: transparent;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }
  
  .gift-continue-btn:hover {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.12) 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 255, 255, 0.15);
  }
  
  .gift-continue-btn:active {
    transform: scale(0.98);
  }
  
  /* Gift error screen */
  .gift-error {
    position: fixed;
    inset: 0;
    background: rgba(15, 15, 35, 0.95);
    backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .gift-error-content {
    text-align: center;
    color: white;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(30px);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 24px;
    padding: 3rem 2rem;
    max-width: 400px;
    width: 90%;
  }
  
  .error-icon {
    font-size: 3rem;
    margin-bottom: 1.5rem;
    color: #ef4444;
  }
  
  .gift-error-content h2 {
    font-size: 1.5rem;
    font-weight: 400;
    margin-bottom: 1rem;
    color: #fca5a5;
  }
  
  .gift-error-content p {
    margin-bottom: 2rem;
    opacity: 0.8;
    line-height: 1.6;
  }
  
  .error-return-btn {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    border: none;
    border-radius: 12px;
    color: white;
    padding: 1rem 2rem;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }
  
  .error-return-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
  }
  
  /* User context enhancements */
  .user-welcome-text {
    color: rgba(251, 191, 36, 0.9);
    text-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
  }
  
  /* Mobile optimizations */
  @media (max-width: 768px) {
    .gift-validation-content,
    .gift-welcome-content,
    .gift-error-content {
      padding: 2rem 1.5rem;
      margin: 1rem;
    }
    
    .gift-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    
    .gift-continue-btn {
      padding: 1rem 2rem;
      font-size: 1rem;
    }
  }
`;
document.head.appendChild(style);
