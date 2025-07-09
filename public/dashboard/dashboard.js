// Sacred Dashboard - Consciousness Command Center Logic
// Complete interactive functionality for the user dashboard

let userData = null;
let usageData = null;
let recentReflections = [];
let isLoading = false;

// Tier limits and evolution thresholds
const TIER_LIMITS = {
  free: 1,
  essential: 5,
  premium: 10,
  creator: "unlimited",
};

const EVOLUTION_THRESHOLDS = {
  essential: 4,
  premium: 6,
};

// Initialize dashboard on page load
window.addEventListener("load", initializeDashboard);

async function initializeDashboard() {
  try {
    await authenticateAndLoadUser();
    await loadDashboardData();
    setupInteractions();
    animateEntry();
  } catch (error) {
    console.error("🪞 Dashboard initialization failed:", error);
    handleAuthenticationError();
  }
}

// ╭─ AUTHENTICATION & USER DATA ─────────────────────────────╮
async function authenticateAndLoadUser() {
  const token = localStorage.getItem("mirror_auth_token");

  if (!token) {
    throw new Error("No authentication token found");
  }

  try {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: "verify-token" }),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Token verification failed");
    }

    userData = data.user;

    // Update localStorage with fresh data
    const updatedUserData = {
      name: userData.name,
      email: userData.email,
      language: userData.language || "en",
      isCreator: userData.isCreator || false,
      isAdmin: userData.isAdmin || false,
      tier: userData.tier || "free",
      subscriptionStatus: userData.subscriptionStatus || "active",
      reflectionCountThisMonth: userData.reflectionCountThisMonth || 0,
      totalReflections: userData.totalReflections || 0,
    };

    localStorage.setItem("mirrorVerifiedUser", JSON.stringify(updatedUserData));

    console.log(
      `🪞 Dashboard loaded for: ${userData.email} (${userData.tier})`
    );

    updateUserInterface();
  } catch (error) {
    console.error("🪞 Authentication error:", error);
    throw error;
  }
}

function updateUserInterface() {
  // Update navigation based on user type
  updateNavigation();

  // Update welcome section
  updateWelcomeSection();

  // Update user menu
  updateUserMenu();

  // Show/hide tier-specific elements
  updateTierSpecificElements();
}

function updateNavigation() {
  // Show admin link for creators/admins
  if (userData.isCreator || userData.isAdmin) {
    document.querySelector(".admin-only").style.display = "flex";
  }

  // Show upgrade button for free users
  if (userData.tier === "free") {
    document.querySelector(".tier-upgrade").style.display = "flex";
  }

  // Update reflection link with appropriate mode
  const reflectLink = document.querySelector(".reflect-nav");
  if (userData.isCreator) {
    reflectLink.href = "/reflection?mode=creator";
  } else {
    reflectLink.href = "/reflection";
  }
}

function updateWelcomeSection() {
  const greeting = getTimeBasedGreeting();
  const firstName = userData.name.split(" ")[0];

  document.getElementById("welcomeGreeting").textContent = greeting;
  document.getElementById("welcomeName").textContent = firstName;

  // Update welcome message based on tier and usage
  const welcomeMessage = getWelcomeMessage();
  document.getElementById("welcomeMessage").textContent = welcomeMessage;
}

function updateUserMenu() {
  const userName = document.getElementById("userName");
  const userDisplayName = document.getElementById("userDisplayName");
  const userTierBadge = document.getElementById("userTierBadge");
  const userAvatar = document.getElementById("userAvatar");

  // Update display name (first name only for UI)
  const firstName = userData.name.split(" ")[0];
  userName.textContent = firstName;
  userDisplayName.textContent = userData.name;

  // Update tier badge
  userTierBadge.textContent =
    userData.tier.charAt(0).toUpperCase() + userData.tier.slice(1);
  userTierBadge.className = `user-tier-badge ${userData.tier}`;

  // Update avatar based on tier
  if (userData.isCreator) {
    userAvatar.textContent = "🌟";
  } else if (userData.tier === "premium") {
    userAvatar.textContent = "💎";
  } else if (userData.tier === "essential") {
    userAvatar.textContent = "✨";
  } else {
    userAvatar.textContent = "👤";
  }

  // Show/hide tier-specific menu items
  if (userData.tier === "free") {
    document
      .querySelectorAll(".evolution-only")
      .forEach((el) => (el.style.display = "none"));
  } else {
    document
      .querySelectorAll(".evolution-only")
      .forEach((el) => (el.style.display = "flex"));
  }
}

function updateTierSpecificElements() {
  // Update subscription card
  updateSubscriptionCard();

  // Update evolution card based on tier
  updateEvolutionCard();
}

// ╭─ DASHBOARD DATA LOADING ──────────────────────────────────╮
async function loadDashboardData() {
  showLoadingState(true);

  try {
    // Load usage data
    await loadUsageData();

    // Load recent reflections
    await loadRecentReflections();

    // Update dashboard displays
    updateUsageDisplay();
    updateReflectionsDisplay();
    updateEvolutionDisplay();
  } catch (error) {
    console.error("🪞 Failed to load dashboard data:", error);
    showToast(
      "Failed to load dashboard data. Please refresh the page.",
      "error"
    );
  } finally {
    showLoadingState(false);
  }
}

async function loadUsageData() {
  try {
    const token = localStorage.getItem("mirror_auth_token");

    const response = await fetch("/api/reflections", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: "check-usage" }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        usageData = data.usage;
      }
    }
  } catch (error) {
    console.error("🪞 Failed to load usage data:", error);
    // Use fallback data from userData
    usageData = {
      currentCount: userData.reflectionCountThisMonth,
      limit: userData.isCreator ? "unlimited" : TIER_LIMITS[userData.tier],
      canReflect: true,
      tier: userData.tier,
      totalReflections: userData.totalReflections,
      percentUsed: 0,
    };
  }
}

async function loadRecentReflections() {
  try {
    const token = localStorage.getItem("mirror_auth_token");

    const response = await fetch("/api/reflections", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      url: new URL(
        "/api/reflections?action=get-history&limit=5",
        window.location.origin
      ),
    });

    // Use GET request with query parameters
    const url = new URL("/api/reflections", window.location.origin);
    url.searchParams.set("action", "get-history");
    url.searchParams.set("limit", "5");

    const reflectionsResponse = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (reflectionsResponse.ok) {
      const data = await reflectionsResponse.json();
      if (data.success) {
        recentReflections = data.reflections || [];
      }
    }
  } catch (error) {
    console.error("🪞 Failed to load recent reflections:", error);
    recentReflections = [];
  }
}

// ╭─ DISPLAY UPDATES ─────────────────────────────────────────╮
function updateUsageDisplay() {
  const currentCount =
    usageData?.currentCount || userData.reflectionCountThisMonth;
  const limit =
    usageData?.limit ||
    (userData.isCreator ? "unlimited" : TIER_LIMITS[userData.tier]);

  // Update usage numbers
  document.getElementById("currentCount").textContent = currentCount;
  document.getElementById("monthlyLimit").textContent =
    limit === "unlimited" ? "∞" : limit;

  // Update progress circle
  let percentage = 0;
  if (limit !== "unlimited" && limit > 0) {
    percentage = Math.min((currentCount / limit) * 100, 100);
  }

  document.getElementById("usagePercentage").textContent = `${Math.round(
    percentage
  )}%`;

  // Update CSS custom property for progress circle
  const progressCircle = document.querySelector(".progress-circle");
  if (progressCircle) {
    progressCircle.style.setProperty("--progress", `${percentage}%`);
  }

  // Update usage action button
  const usageActionBtn = document.getElementById("usageActionBtn");
  if (currentCount === 0) {
    usageActionBtn.textContent = "Create Your First Reflection";
    usageActionBtn.onclick = startReflection;
  } else {
    usageActionBtn.textContent = "View All Reflections";
    usageActionBtn.onclick = () => (window.location.href = "/reflections");
  }
}

function updateReflectionsDisplay() {
  const reflectionsList = document.getElementById("recentReflectionsList");
  const emptyState = document.getElementById("emptyReflections");

  if (recentReflections.length === 0) {
    reflectionsList.style.display = "none";
    emptyState.style.display = "block";
  } else {
    reflectionsList.style.display = "block";
    emptyState.style.display = "none";

    // Clear loading state
    reflectionsList.innerHTML = "";

    // Add reflections
    recentReflections.forEach((reflection, index) => {
      const reflectionElement = createReflectionElement(reflection);
      reflectionElement.style.animationDelay = `${index * 0.1}s`;
      reflectionsList.appendChild(reflectionElement);
    });
  }
}

function createReflectionElement(reflection) {
  const element = document.createElement("div");
  element.className = "reflection-item";
  element.onclick = () => viewReflection(reflection.id);

  const timeAgo = reflection.timeAgo || formatTimeAgo(reflection.createdAt);
  const preview = reflection.dream
    ? reflection.dream.substring(0, 120)
    : "Reflection content...";

  element.innerHTML = `
    <div class="reflection-header">
      <div class="reflection-title">${
        reflection.title || "Sacred Reflection"
      }</div>
      <div class="reflection-date">${timeAgo}</div>
    </div>
    <div class="reflection-preview">${preview}${
    preview.length > 120 ? "..." : ""
  }</div>
    <div class="reflection-meta">
      <div class="reflection-tone ${
        reflection.tone || "fusion"
      }">${formatToneName(reflection.tone)}</div>
      ${
        reflection.isPremium
          ? '<div class="premium-indicator">Premium</div>'
          : ""
      }
    </div>
  `;

  return element;
}

function updateEvolutionDisplay() {
  const totalReflections = userData.totalReflections || 0;
  const evolutionContent = document.getElementById("evolutionContent");
  const evolutionActionBtn = document.getElementById("evolutionActionBtn");

  // Update total reflections
  document.getElementById("totalReflections").textContent = totalReflections;

  // Check evolution eligibility
  const canGenerateReport =
    userData.tier !== "free" &&
    totalReflections >= EVOLUTION_THRESHOLDS[userData.tier];

  // Update growth insight
  const growthInsight = document.getElementById("growthInsight");
  if (totalReflections >= 3) {
    growthInsight.classList.remove("growth-locked");
    growthInsight.querySelector(".insight-value").textContent = "Available";
    growthInsight.querySelector(".insight-value").className = "insight-value";
  } else {
    const needed = 3 - totalReflections;
    growthInsight.querySelector(".required-count").textContent = needed;
  }

  // Update evolution insight
  const evolutionInsight = document.getElementById("evolutionInsight");
  if (userData.tier === "free") {
    evolutionInsight.querySelector(".insight-value").textContent =
      "Upgrade to Essential";
  } else if (canGenerateReport) {
    evolutionInsight.classList.remove("evolution-locked");
    evolutionInsight.querySelector(".insight-value").textContent =
      "Ready to Generate";
    evolutionInsight.querySelector(".insight-value").className =
      "insight-value";

    // Show new badge if eligible
    document.getElementById("evolutionBadge").style.display = "block";
  } else {
    const needed = EVOLUTION_THRESHOLDS[userData.tier] - totalReflections;
    evolutionInsight.querySelector(
      ".insight-value"
    ).textContent = `${needed} more reflection${
      needed === 1 ? "" : "s"
    } needed`;
  }

  // Update action button
  if (userData.tier === "free") {
    evolutionActionBtn.textContent = "Upgrade for Evolution Reports";
    evolutionActionBtn.onclick = () => (window.location.href = "/register");
  } else if (canGenerateReport) {
    evolutionActionBtn.textContent = "Generate Evolution Report";
    evolutionActionBtn.className = "evolution-btn ready";
    evolutionActionBtn.onclick = generateEvolutionReport;
  } else {
    evolutionActionBtn.textContent = `Create ${
      EVOLUTION_THRESHOLDS[userData.tier] - totalReflections
    } more reflection${
      EVOLUTION_THRESHOLDS[userData.tier] - totalReflections === 1 ? "" : "s"
    }`;
    evolutionActionBtn.onclick = startReflection;
  }
}

function updateSubscriptionCard() {
  const tierBadge = document.getElementById("tierBadge");
  const tierDescription = document.getElementById("tierDescription");
  const subscriptionActionBtn = document.getElementById(
    "subscriptionActionBtn"
  );

  // Update tier display
  tierBadge.textContent =
    userData.tier.charAt(0).toUpperCase() + userData.tier.slice(1);
  tierBadge.className = `tier-badge ${userData.tier}`;

  // Update description based on tier
  const descriptions = {
    free: "Limited to 1 reflection per month",
    essential: "Up to 5 reflections per month + Evolution Reports",
    premium: "Up to 10 reflections per month + Advanced Evolution Insights",
    creator: "Unlimited reflections and full access to all features",
  };

  tierDescription.textContent =
    descriptions[userData.tier] || descriptions.free;

  // Update action button
  if (userData.tier === "free") {
    subscriptionActionBtn.innerHTML =
      "<span>✨</span><span>Upgrade Your Journey</span>";
    subscriptionActionBtn.onclick = () => (window.location.href = "/register");
  } else if (userData.tier === "essential") {
    subscriptionActionBtn.innerHTML =
      "<span>💎</span><span>Upgrade to Premium</span>";
    subscriptionActionBtn.onclick = () =>
      (window.location.href = "/register?tier=premium");
  } else {
    subscriptionActionBtn.innerHTML =
      "<span>⚙️</span><span>Manage Subscription</span>";
    subscriptionActionBtn.onclick = () =>
      (window.location.href = "/subscription");
  }
}

// ╭─ INTERACTION HANDLERS ────────────────────────────────────╮
function setupInteractions() {
  // User menu toggle
  setupUserMenu();

  // Quick action buttons
  document.getElementById("reflectNowBtn").onclick = startReflection;
  document.getElementById("giftBtn").onclick = () =>
    (window.location.href = "/gifting");

  // View all reflections
  document.getElementById("viewAllReflections").onclick = () =>
    (window.location.href = "/reflections");

  // Mobile touch interactions
  if ("ontouchstart" in window) {
    addTouchInteractions();
  }

  // Keyboard navigation
  setupKeyboardNavigation();
}

function setupUserMenu() {
  const userMenuBtn = document.getElementById("userMenuBtn");
  const userDropdown = document.getElementById("userDropdown");
  const userMenu = document.querySelector(".user-menu");

  userMenuBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    userMenu.classList.toggle("open");
    userDropdown.classList.toggle("show");
  });

  // Close menu when clicking outside
  document.addEventListener("click", function (e) {
    if (!userMenu.contains(e.target)) {
      userMenu.classList.remove("open");
      userDropdown.classList.remove("show");
    }
  });

  // Close menu on escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      userMenu.classList.remove("open");
      userDropdown.classList.remove("show");
    }
  });
}

// ╭─ ACTION FUNCTIONS ─────────────────────────────────────────╮
function startReflection() {
  // Check if user can create reflections
  if (usageData && !usageData.canReflect) {
    showToast(
      "You've reached your monthly reflection limit. Upgrade to continue your journey.",
      "warning"
    );
    return;
  }

  // Redirect to reflection page with appropriate mode
  if (userData.isCreator) {
    window.location.href = "/reflection?mode=creator";
  } else {
    window.location.href = "/reflection";
  }
}

function viewReflection(reflectionId) {
  window.location.href = `/reflections/view?id=${reflectionId}`;
}

async function generateEvolutionReport() {
  if (isLoading) return;

  setLoadingState(true, "Generating your evolution report...");

  try {
    const token = localStorage.getItem("mirror_auth_token");

    const response = await fetch("/api/evolution", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: "generate-report" }),
    });

    const data = await response.json();

    if (data.success) {
      showToast("Evolution report generated successfully!", "success");
      setTimeout(() => {
        window.location.href = `/evolution?report=${data.report.id}`;
      }, 1500);
    } else {
      throw new Error(data.error || "Failed to generate evolution report");
    }
  } catch (error) {
    console.error("🪞 Evolution report error:", error);
    showToast(
      "Failed to generate evolution report. Please try again.",
      "error"
    );
  } finally {
    setLoadingState(false);
  }
}

async function handleSignOut() {
  if (confirm("Are you sure you want to sign out?")) {
    try {
      const token = localStorage.getItem("mirror_auth_token");

      // Call signout API
      await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "signout" }),
      });
    } catch (error) {
      console.error("🪞 Signout error:", error);
    } finally {
      // Clear local storage
      localStorage.removeItem("mirror_auth_token");
      localStorage.removeItem("mirrorVerifiedUser");

      // Redirect to portal
      window.location.href = "/";
    }
  }
}

// ╭─ UTILITY FUNCTIONS ───────────────────────────────────────╮
function getTimeBasedGreeting() {
  const hour = new Date().getHours();

  if (hour < 6) return "Deep night greetings,";
  if (hour < 12) return "Good morning,";
  if (hour < 17) return "Good afternoon,";
  if (hour < 21) return "Good evening,";
  return "Late night wisdom,";
}

function getWelcomeMessage() {
  const messages = {
    free: "Your journey of self-discovery awaits...",
    essential: "Continue exploring your inner landscape...",
    premium: "Dive deeper into your consciousness evolution...",
    creator: "Welcome to your sacred creative space...",
  };

  return messages[userData.tier] || messages.free;
}

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: diffDays > 365 ? "numeric" : undefined,
  });
}

function formatToneName(tone) {
  const toneNames = {
    gentle: "Gentle",
    intense: "Intense",
    fusion: "Fusion",
  };
  return toneNames[tone] || "Fusion";
}

// ╭─ LOADING & ERROR STATES ──────────────────────────────────╮
function showLoadingState(show, message = "Loading...") {
  const overlay = document.getElementById("loadingOverlay");
  const loadingText = overlay.querySelector("p");

  if (show) {
    loadingText.textContent = message;
    overlay.style.display = "flex";
    requestAnimationFrame(() => overlay.classList.add("show"));
  } else {
    overlay.classList.remove("show");
    setTimeout(() => (overlay.style.display = "none"), 300);
  }
}

function setLoadingState(loading, message = null) {
  isLoading = loading;
  if (message) {
    showLoadingState(loading, message);
  }
}

function handleAuthenticationError() {
  showToast("Authentication failed. Please sign in again.", "error");

  setTimeout(() => {
    localStorage.removeItem("mirror_auth_token");
    localStorage.removeItem("mirrorVerifiedUser");
    window.location.href = "/auth/signin";
  }, 2000);
}

// ╭─ TOAST NOTIFICATIONS ─────────────────────────────────────╮
function showToast(message, type = "info", duration = 5000) {
  const container = document.getElementById("toastContainer");

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // Remove toast after duration
  setTimeout(() => {
    toast.style.transform = "translateX(100%)";
    toast.style.opacity = "0";

    setTimeout(() => {
      if (container.contains(toast)) {
        container.removeChild(toast);
      }
    }, 300);
  }, duration);
}

// ╭─ MOBILE INTERACTIONS ─────────────────────────────────────╮
function addTouchInteractions() {
  // Add touch feedback for interactive elements
  document
    .querySelectorAll(".dashboard-card, .action-btn, .nav-link")
    .forEach((element) => {
      element.addEventListener("touchstart", function () {
        this.style.transform = "scale(0.98)";
      });

      element.addEventListener("touchend", function () {
        this.style.transform = "";
      });
    });
}

function setupKeyboardNavigation() {
  // Handle keyboard shortcuts
  document.addEventListener("keydown", function (e) {
    // Cmd/Ctrl + R for new reflection
    if ((e.metaKey || e.ctrlKey) && e.key === "r") {
      e.preventDefault();
      startReflection();
    }

    // Cmd/Ctrl + G for gift
    if ((e.metaKey || e.ctrlKey) && e.key === "g") {
      e.preventDefault();
      window.location.href = "/gifting";
    }
  });
}

// ╭─ ANIMATIONS ───────────────────────────────────────────────╮
function animateEntry() {
  // Stagger card animations
  const cards = document.querySelectorAll(".dashboard-card");
  cards.forEach((card, index) => {
    card.style.animationDelay = `${0.1 + index * 0.1}s`;
  });

  // Animate progress circle
  setTimeout(() => {
    const progressCircle = document.querySelector(".progress-circle");
    if (progressCircle) {
      progressCircle.style.animation = "progressSpin 2s ease-out";
    }
  }, 500);
}

// ╭─ ERROR HANDLING ───────────────────────────────────────────╮
window.addEventListener("error", function (e) {
  console.error("🪞 Dashboard error:", e.error);
  // Don't show toast for every error, only critical ones
});

window.addEventListener("unhandledrejection", function (e) {
  console.error("🪞 Unhandled promise rejection:", e.reason);
  // Handle gracefully without showing user errors for every rejection
});

// ╭─ DEBUG (Development Only) ─────────────────────────────────╮
if (window.location.hostname === "localhost") {
  console.log("🪞 Sacred Dashboard initialized");

  // Add debug utilities to window
  window.dashboardDebug = {
    userData: () => userData,
    usageData: () => usageData,
    recentReflections: () => recentReflections,
    refreshData: loadDashboardData,
    testToast: (message, type) => showToast(message, type),
  };
}
