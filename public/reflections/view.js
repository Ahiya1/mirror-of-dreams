// Individual Reflection View - Sacred Reader Logic
// Complete reflection viewing experience with navigation and actions

let authToken = null;
let currentUser = null;
let currentReflection = null;
let allReflectionIds = [];
let currentIndex = -1;
let reflectionId = null;

/* ═══ INITIALIZATION ═══ */
window.addEventListener("load", async () => {
  await checkAuthentication();
  extractReflectionId();
  await loadReflection();
  setupEventListeners();
  animateEntrance();
});

/* ═══ AUTHENTICATION ═══ */
async function checkAuthentication() {
  authToken = localStorage.getItem("mirror_auth_token");

  if (!authToken) {
    window.location.href =
      "/auth/signin?redirect=" +
      encodeURIComponent(window.location.pathname + window.location.search);
    return;
  }

  try {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ action: "verify-token" }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      localStorage.removeItem("mirror_auth_token");
      window.location.href = "/auth/signin";
      return;
    }

    currentUser = data.user;
    console.log("🪞 Authenticated user:", currentUser.email);
  } catch (error) {
    console.error("Auth verification failed:", error);
    localStorage.removeItem("mirror_auth_token");
    window.location.href = "/auth/signin";
  }
}

/* ═══ REFLECTION LOADING ═══ */
function extractReflectionId() {
  const urlParams = new URLSearchParams(window.location.search);
  reflectionId = urlParams.get("id");

  if (!reflectionId) {
    showError("No reflection ID provided");
    return;
  }
}

async function loadReflection() {
  if (!reflectionId) return;

  setLoading(true);

  try {
    // Load the specific reflection
    const response = await fetch("/api/reflections", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        action: "get-reflection",
        id: reflectionId,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to load reflection");
    }

    currentReflection = data.reflection;

    // Load all reflection IDs for navigation
    await loadReflectionNavigation();

    // Display the reflection
    displayReflection();
  } catch (error) {
    console.error("Failed to load reflection:", error);
    showError(
      "Unable to load this reflection. It may have been removed or you may not have permission to view it."
    );
  } finally {
    setLoading(false);
  }
}

async function loadReflectionNavigation() {
  try {
    // Get list of all reflection IDs for navigation
    const response = await fetch("/api/reflections", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        action: "get-history",
        page: 1,
        limit: 1000, // Get all for navigation
        sortBy: "created_at",
        sortOrder: "desc",
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      allReflectionIds = data.reflections.map((r) => r.id);
      currentIndex = allReflectionIds.indexOf(reflectionId);
      updateNavigationUI();
    }
  } catch (error) {
    console.error("Failed to load navigation data:", error);
    // Navigation will be disabled but viewing still works
  }
}

/* ═══ DISPLAY REFLECTION ═══ */
function displayReflection() {
  if (!currentReflection) return;

  // Update page title
  document.title = `${
    currentReflection.title || "Reflection"
  } | Mirror of Truth`;

  // Display header information
  document.getElementById("reflectionDate").textContent = formatReflectionDate(
    currentReflection.created_at
  );
  document.getElementById("reflectionTone").textContent =
    currentReflection.tone;
  document.getElementById(
    "reflectionTone"
  ).className = `reflection-tone ${currentReflection.tone}`;

  // Show premium indicator if applicable
  if (currentReflection.is_premium) {
    document.getElementById("premiumIndicator").classList.remove("hidden");
  }

  // Display title
  document.getElementById("reflectionTitle").textContent =
    currentReflection.title || "Your Mirror of Truth";

  // Display stats
  document.getElementById("wordCount").textContent = `${
    currentReflection.word_count || 0
  } words`;
  document.getElementById("readTime").textContent = `${
    currentReflection.estimated_read_time || 1
  } min read`;
  document.getElementById("viewCount").textContent = `${
    currentReflection.view_count || 0
  } views`;

  // Display original questions
  document.getElementById("dreamText").textContent =
    currentReflection.dream || "—";
  document.getElementById("planText").textContent =
    currentReflection.plan || "—";

  // Handle date display
  let dateText = currentReflection.has_date || "No";
  if (currentReflection.has_date === "yes" && currentReflection.dream_date) {
    const dreamDate = new Date(currentReflection.dream_date);
    dateText = `Yes - ${dreamDate.toLocaleDateString()}`;
  }
  document.getElementById("dateText").textContent = dateText;

  document.getElementById("relationshipText").textContent =
    currentReflection.relationship || "—";
  document.getElementById("offeringText").textContent =
    currentReflection.offering || "—";

  // Display the mirror's response
  const responseElement = document.querySelector(
    "#mirrorResponse .response-content"
  );
  if (currentReflection.ai_response) {
    responseElement.innerHTML = currentReflection.ai_response;
  } else {
    responseElement.textContent = "No reflection content available.";
  }

  // Show the article
  showReflection();
}

function updateNavigationUI() {
  const prevBtn = document.getElementById("prevReflection");
  const nextBtn = document.getElementById("nextReflection");
  const currentPos = document.getElementById("currentPosition");
  const totalReflections = document.getElementById("totalReflections");

  if (allReflectionIds.length > 0 && currentIndex >= 0) {
    currentPos.textContent = currentIndex + 1;
    totalReflections.textContent = allReflectionIds.length;

    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === allReflectionIds.length - 1;
  } else {
    // Hide navigation if we don't have the data
    document.getElementById("reflectionNav").style.display = "none";
  }
}

/* ═══ EVENT LISTENERS ═══ */
function setupEventListeners() {
  // Navigation arrows
  document
    .getElementById("prevReflection")
    .addEventListener("click", () => navigateReflection("prev"));
  document
    .getElementById("nextReflection")
    .addEventListener("click", () => navigateReflection("next"));

  // Action buttons
  document
    .getElementById("emailBtn")
    .addEventListener("click", emailReflection);
  document
    .getElementById("shareBtn")
    .addEventListener("click", shareReflection);
  document
    .getElementById("downloadBtn")
    .addEventListener("click", downloadReflection);

  // Keyboard shortcuts
  document.addEventListener("keydown", handleKeyboardShortcuts);
}

function handleKeyboardShortcuts(e) {
  // Don't trigger if user is in an input field
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

  switch (e.key) {
    case "ArrowLeft":
      e.preventDefault();
      navigateReflection("prev");
      break;
    case "ArrowRight":
      e.preventDefault();
      navigateReflection("next");
      break;
    case "e":
      e.preventDefault();
      emailReflection();
      break;
    case "s":
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        downloadReflection();
      } else {
        e.preventDefault();
        shareReflection();
      }
      break;
    case "r":
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        window.location.href = "/mirror/reflection";
      }
      break;
    case "h":
      e.preventDefault();
      window.location.href = "/reflections/history";
      break;
  }
}

/* ═══ NAVIGATION ═══ */
function navigateReflection(direction) {
  if (allReflectionIds.length === 0 || currentIndex < 0) return;

  let newIndex;
  if (direction === "prev") {
    newIndex = currentIndex - 1;
  } else {
    newIndex = currentIndex + 1;
  }

  if (newIndex < 0 || newIndex >= allReflectionIds.length) return;

  const newReflectionId = allReflectionIds[newIndex];

  // Update URL and reload reflection
  const url = new URL(window.location);
  url.searchParams.set("id", newReflectionId);
  window.history.pushState({}, "", url);

  reflectionId = newReflectionId;
  currentIndex = newIndex;

  loadReflection();
}

/* ═══ ACTIONS ═══ */
async function emailReflection() {
  const btn = document.getElementById("emailBtn");
  const originalContent = btn.innerHTML;

  btn.innerHTML =
    '<span class="action-icon">📧</span><span class="action-text">Sending...</span>';
  btn.disabled = true;

  try {
    const response = await fetch("/api/communication", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "send-reflection",
        email: currentUser.email,
        content: currentReflection.ai_response,
        userName: currentUser.name || "Friend",
        language: currentUser.language || "en",
        isPremium: currentReflection.is_premium,
      }),
    });

    const data = await response.json();

    if (data.success) {
      showToast("✅ Reflection sent to your email");
      btn.innerHTML =
        '<span class="action-icon">✅</span><span class="action-text">Sent!</span>';
    } else {
      throw new Error(data.error || "Failed to send email");
    }
  } catch (error) {
    console.error("Email failed:", error);
    showToast("❌ Failed to send email. Please try again.");
    btn.innerHTML =
      '<span class="action-icon">⚡</span><span class="action-text">Try Again</span>';
  }

  setTimeout(() => {
    btn.innerHTML = originalContent;
    btn.disabled = false;
  }, 3000);
}

function shareReflection() {
  const url = window.location.href;

  if (navigator.share) {
    navigator
      .share({
        title: currentReflection.title || "My Mirror of Truth Reflection",
        text: "Check out my reflection from The Mirror of Truth",
        url: url,
      })
      .catch((err) => {
        console.log("Share failed:", err);
        copyToClipboard(url);
      });
  } else {
    copyToClipboard(url);
  }
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast("🔗 Link copied to clipboard");
      })
      .catch(() => {
        fallbackCopyToClipboard(text);
      });
  } else {
    fallbackCopyToClipboard(text);
  }
}

function fallbackCopyToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand("copy");
    showToast("🔗 Link copied to clipboard");
  } catch (err) {
    showToast("❌ Unable to copy link");
  }

  document.body.removeChild(textArea);
}

function downloadReflection() {
  try {
    // Create a simple text version for download
    const content = `
${currentReflection.title || "Mirror of Truth Reflection"}
${new Date(currentReflection.created_at).toLocaleDateString()}
Tone: ${currentReflection.tone}
${currentReflection.is_premium ? "Premium Reflection" : ""}

DREAM:
${currentReflection.dream}

PLAN:
${currentReflection.plan}

DATE SET:
${
  currentReflection.has_date === "yes"
    ? currentReflection.dream_date
      ? new Date(currentReflection.dream_date).toLocaleDateString()
      : "Yes"
    : "No"
}

RELATIONSHIP WITH DREAM:
${currentReflection.relationship}

OFFERING:
${currentReflection.offering}

MIRROR'S REFLECTION:
${stripHtml(currentReflection.ai_response)}

---
Generated by The Mirror of Truth
${window.location.origin}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `mirror-reflection-${
      new Date(currentReflection.created_at).toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("💾 Reflection downloaded");
  } catch (error) {
    console.error("Download failed:", error);
    showToast("❌ Download failed. Please try again.");
  }
}

/* ═══ UI STATES ═══ */
function setLoading(loading) {
  const loadingSection = document.getElementById("loadingSection");
  const reflectionArticle = document.getElementById("reflectionArticle");
  const errorSection = document.getElementById("errorSection");

  if (loading) {
    loadingSection.classList.remove("hidden");
    reflectionArticle.classList.add("hidden");
    errorSection.classList.add("hidden");
  } else {
    loadingSection.classList.add("hidden");
  }
}

function showReflection() {
  const reflectionArticle = document.getElementById("reflectionArticle");
  const errorSection = document.getElementById("errorSection");

  reflectionArticle.classList.remove("hidden");
  errorSection.classList.add("hidden");

  // Add fade-in animation
  reflectionArticle.classList.add("fade-in");
}

function showError(message) {
  const loadingSection = document.getElementById("loadingSection");
  const reflectionArticle = document.getElementById("reflectionArticle");
  const errorSection = document.getElementById("errorSection");

  loadingSection.classList.add("hidden");
  reflectionArticle.classList.add("hidden");
  errorSection.classList.remove("hidden");

  // Update error message if needed
  const errorSubtitle = errorSection.querySelector(".error-subtitle");
  if (errorSubtitle && message) {
    errorSubtitle.textContent = message;
  }
}

function showToast(message) {
  const toast = document.getElementById("successToast");
  const toastMessage = toast.querySelector(".toast-message");

  toastMessage.textContent = message;
  toast.classList.remove("hidden");
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 400);
  }, 3000);
}

/* ═══ ANIMATIONS ═══ */
function animateEntrance() {
  // Create a subtle entrance animation for the cosmic elements
  const cosmicElements = document.querySelectorAll(".cosmic-orb, .cosmic-dust");

  cosmicElements.forEach((element, index) => {
    element.style.opacity = "0";
    element.style.transform = "scale(0.5)";

    setTimeout(() => {
      element.style.transition = "all 1s ease";
      element.style.opacity = "";
      element.style.transform = "";
    }, index * 200);
  });
}

/* ═══ UTILITY FUNCTIONS ═══ */
function formatReflectionDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function stripHtml(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/* ═══ ERROR HANDLING ═══ */
window.addEventListener("error", (e) => {
  console.error("JavaScript error in reflection view:", e.error);
});

window.addEventListener("unhandledrejection", (e) => {
  console.error("Unhandled promise rejection in reflection view:", e.reason);
});

/* ═══ PAGE VISIBILITY ═══ */
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && currentReflection) {
    // Page became visible again - could refresh view count or check for updates
    console.log("🪞 Reflection view is visible again");
  }
});

/* ═══ RESPONSIVE HANDLING ═══ */
function handleResize() {
  // Handle any responsive adjustments needed
  const isMobile = window.innerWidth <= 768;

  // Hide navigation arrows on very small screens
  const navCenter = document.querySelector(".nav-center");
  if (window.innerWidth <= 480) {
    navCenter.style.display = "none";
  } else {
    navCenter.style.display = "flex";
  }
}

window.addEventListener("resize", debounce(handleResize, 250));

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initial resize check
handleResize();
