// Mirror – Luminous Reflection Logic TRANSFORMED: Auth Integration + Database Storage
// MAJOR CHANGES: Authentication required, usage limits, database storage, dashboard redirect

let userData = null;
let hasDateSet = null;
let isCreatorMode = false;
let isTestMode = false;
let isPremiumMode = false;
let selectedTone = "fusion"; // default
let backgroundElements = [];
let formState = {};
let currentReflection = null;
let authToken = null;

/* — INITIALIZATION — */
window.addEventListener("load", () => {
  checkAuthAndSetup();
  initializeToneBackground();
  setupInteractions();
  animateQuestions();
  handleURLState();
});

/* — AUTHENTICATION & USER SETUP — */
async function checkAuthAndSetup() {
  const url = new URLSearchParams(location.search);
  const mode = url.get("mode");
  const premium = url.get("premium");

  // Get authentication token
  authToken = localStorage.getItem("mirrorAuthToken");

  // Check for creator/test modes (legacy support)
  if (mode === "creator") {
    isCreatorMode = true;
    isPremiumMode = true;

    // Verify creator token if available
    if (authToken) {
      try {
        const user = await verifyAuthToken();
        if (user && user.isCreator) {
          userData = user;
          showAdminNotice("✨ Creator mode — unlimited premium reflections");
          return;
        }
      } catch (error) {
        console.error("Creator auth verification failed:", error);
      }
    }

    // Fallback to temp creator data
    userData = {
      isCreator: true,
      name: "Ahiya",
      email: "ahiya.butman@gmail.com",
      tier: "premium",
    };
    showAdminNotice("✨ Creator mode — premium reflection as Ahiya");
  } else if (mode === "user") {
    isTestMode = true;
    isPremiumMode = premium === "true";

    // Use temp user data for testing
    const tempUser = localStorage.getItem("mirrorTempUser");
    if (tempUser) {
      userData = JSON.parse(tempUser);
      userData.testMode = true;
    } else {
      userData = {
        name: "Test User",
        email: "test@example.com",
        tier: isPremiumMode ? "premium" : "essential",
        testMode: true,
      };
    }
    showAdminNotice(
      `🌟 Test mode — ${
        isPremiumMode ? "premium" : "essential"
      } reflection as another soul`
    );
  } else {
    // TRANSFORMED: Regular authenticated flow required
    if (!authToken) {
      redirectToAuth("Authentication required for reflections");
      return;
    }

    try {
      userData = await verifyAuthToken();
      if (!userData) {
        redirectToAuth("Please sign in to continue");
        return;
      }

      // Check usage limits
      const canReflect = await checkUsageLimits();
      if (!canReflect) {
        return; // checkUsageLimits handles the redirect
      }

      isPremiumMode = userData.tier === "premium" || userData.isCreator;
      console.log(
        `✅ Authenticated reflection: ${userData.email} (${userData.tier})`
      );
    } catch (error) {
      console.error("Authentication error:", error);
      redirectToAuth("Authentication failed, please sign in again");
      return;
    }
  }
}

async function verifyAuthToken() {
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
      return result.user;
    }

    throw new Error("Token verification failed");
  } catch (error) {
    // Clear invalid token
    localStorage.removeItem("mirrorAuthToken");
    localStorage.removeItem("mirrorUserData");
    throw error;
  }
}

async function checkUsageLimits() {
  if (isCreatorMode || isTestMode) return true;

  try {
    const response = await fetch("/api/users?action=get-usage", {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error("Failed to check usage limits");
    }

    const usage = result.usage;
    if (!usage.current.canReflect) {
      showUsageLimitReached(usage.current);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Usage check error:", error);
    return true; // Allow reflection if check fails
  }
}

function redirectToAuth(message) {
  alert(message);
  const returnUrl = encodeURIComponent(
    window.location.pathname + window.location.search
  );
  window.location.href = `/auth/signin?returnTo=${returnUrl}`;
}

function showUsageLimitReached(usage) {
  const limitReachedHtml = `
    <div class="limit-reached-container">
      <div class="limit-reached-card">
        <div class="limit-icon">🌙</div>
        <h2>Reflection Limit Reached</h2>
        <p>You've used <strong>${usage.count} of ${usage.limit}</strong> reflections this month.</p>
        <p>Your journey continues beyond limits.</p>
        <div class="limit-actions">
          <a href="/dashboard?tab=upgrade" class="upgrade-btn">
            <span>🚀</span><span>Upgrade for More</span>
          </a>
          <a href="/dashboard" class="dashboard-btn">
            <span>📚</span><span>View My Reflections</span>
          </a>
        </div>
      </div>
    </div>
  `;

  // Replace page content
  document.body.innerHTML = limitReachedHtml;

  // Add limit reached styles
  const style = document.createElement("style");
  style.textContent = `
    .limit-reached-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #0f0f23 100%);
    }
    .limit-reached-card {
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(30px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 24px;
      padding: 3rem 2rem;
      text-align: center;
      color: white;
      max-width: 400px;
      width: 100%;
    }
    .limit-icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
    }
    .limit-reached-card h2 {
      font-size: 1.8rem;
      font-weight: 300;
      margin-bottom: 1rem;
      color: rgba(255, 255, 255, 0.95);
    }
    .limit-reached-card p {
      margin-bottom: 1rem;
      opacity: 0.8;
      line-height: 1.6;
    }
    .limit-actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 2rem;
    }
    .upgrade-btn, .dashboard-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.8rem;
      padding: 1rem 1.5rem;
      border-radius: 16px;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.3s ease;
    }
    .upgrade-btn {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
    }
    .dashboard-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.9);
    }
    .upgrade-btn:hover, .dashboard-btn:hover {
      transform: translateY(-2px);
    }
  `;
  document.head.appendChild(style);
}

function showAdminNotice(message) {
  const notice = document.getElementById("adminNotice");
  if (notice) {
    notice.style.display = "block";
    notice.innerHTML = `<span>${message}</span>`;
  }
}

/* — URL STATE MANAGEMENT (PRESERVED) — */
function handleURLState() {
  const urlParams = new URLSearchParams(window.location.search);

  // Check if we're returning to a reflection
  if (urlParams.get("state") === "reflection" && urlParams.get("id")) {
    const reflectionId = urlParams.get("id");
    const storedReflection = localStorage.getItem(`reflection_${reflectionId}`);

    if (storedReflection) {
      try {
        const reflectionData = JSON.parse(storedReflection);
        document.getElementById("reflectionContent").innerHTML =
          reflectionData.content;
        if (reflectionData.isPremium) {
          showPremiumBadge();
        }
        showSection("results");
        return;
      } catch (e) {
        console.error("Failed to restore reflection:", e);
      }
    }
  }

  // Check if we're returning to form with saved state
  if (urlParams.get("state") === "form") {
    const savedForm = localStorage.getItem("mirror_form_state");
    if (savedForm) {
      try {
        formState = JSON.parse(savedForm);
        restoreFormState();
      } catch (e) {
        console.error("Failed to restore form state:", e);
      }
    }
  }
}

function saveFormState() {
  const form = document.getElementById("reflectionForm");
  const formData = new FormData(form);

  formState = {
    dream: formData.get("dream") || "",
    plan: formData.get("plan") || "",
    hasDate: formData.get("hasDate") || "",
    dreamDate: formData.get("dreamDate") || "",
    relationship: formData.get("relationship") || "",
    offering: formData.get("offering") || "",
    tone: selectedTone,
    timestamp: Date.now(),
  };

  localStorage.setItem("mirror_form_state", JSON.stringify(formState));

  // Update URL to reflect form state
  const url = new URL(window.location);
  url.searchParams.set("state", "form");
  window.history.replaceState({}, "", url);
}

function restoreFormState() {
  if (!formState || Object.keys(formState).length === 0) return;

  // Restore form values
  const form = document.getElementById("reflectionForm");
  Object.entries(formState).forEach(([key, value]) => {
    if (key === "tone") {
      selectedTone = value;
      selectTone(value);
      return;
    }

    const field = form.querySelector(`[name="${key}"]`);
    if (field) {
      field.value = value;

      // Special handling for hasDate
      if (key === "hasDate" && value) {
        hasDateSet = value;

        // Update yes/no buttons
        document.querySelectorAll(".yes-no-btn").forEach((btn) => {
          btn.classList.remove("selected");
          if (btn.dataset.value === value) {
            btn.classList.add("selected");
          }
        });

        // Show/hide date container
        const dateContainer = document.getElementById("dateContainer");
        const dateInput = dateContainer.querySelector("input");
        if (value === "yes") {
          dateContainer.style.display = "flex";
          dateInput.required = true;
        }
      }
    }
  });
}

/* — TONE BACKGROUND SYSTEM (PRESERVED) — */
function initializeToneBackground() {
  document.body.classList.add(`tone-${selectedTone}`);
  createToneElements(selectedTone);
}

function createToneElements(tone) {
  backgroundElements.forEach((el) => el.remove());
  backgroundElements = [];

  if (tone === "fusion") {
    for (let i = 0; i < 5; i++) {
      const breath = document.createElement("div");
      breath.className = "fusion-breath";
      breath.style.width = `${180 + Math.random() * 120}px`;
      breath.style.height = breath.style.width;
      breath.style.left = `${Math.random() * 100}%`;
      breath.style.top = `${Math.random() * 100}%`;
      breath.style.animationDelay = `${i * 4}s`;
      breath.style.animationDuration = `${15 + Math.random() * 8}s`;
      document.body.appendChild(breath);
      backgroundElements.push(breath);
    }
  } else if (tone === "gentle") {
    for (let i = 0; i < 30; i++) {
      const star = document.createElement("div");
      star.className = "gentle-star";
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDelay = `${Math.random() * 8}s`;
      star.style.animationDuration = `${5 + Math.random() * 5}s`;
      document.body.appendChild(star);
      backgroundElements.push(star);
    }
  } else if (tone === "intense") {
    for (let i = 0; i < 6; i++) {
      const swirl = document.createElement("div");
      swirl.className = "intense-swirl";
      swirl.style.left = `${Math.random() * 100}%`;
      swirl.style.top = `${Math.random() * 100}%`;
      swirl.style.animationDelay = `${i * 3}s`;
      swirl.style.animationDuration = `${10 + Math.random() * 8}s`;
      document.body.appendChild(swirl);
      backgroundElements.push(swirl);
    }
  }
}

/* — QUESTION ANIMATION (PRESERVED) — */
function animateQuestions() {
  const questions = document.querySelectorAll(".question-group");
  questions.forEach((q, i) => {
    q.style.opacity = "0";
    setTimeout(() => {
      q.classList.add("appear");
    }, 400 + i * 200);
  });
}

/* — INTERACTIONS (ENHANCED) — */
function setupInteractions() {
  /* Tone Picker */
  document.querySelectorAll(".tone-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      selectTone(this.dataset.tone || "fusion");
    });
  });

  /* Yes/No Interactions */
  document.querySelectorAll(".yes-no-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      this.parentNode
        .querySelectorAll(".yes-no-btn")
        .forEach((b) => b.classList.remove("selected"));
      this.classList.add("selected");

      hasDateSet = this.dataset.value;
      document.querySelector('input[name="hasDate"]').value = hasDateSet;

      const box = document.getElementById("dateContainer");
      const dateInp = box.querySelector("input");
      if (hasDateSet === "yes") {
        box.style.display = "flex";
        dateInp.required = true;
      } else {
        box.style.display = "none";
        dateInp.required = false;
        dateInp.value = "";
      }

      saveFormState();
    });
  });

  /* Save form state on input changes */
  document.querySelectorAll(".sacred-input").forEach((input) => {
    input.addEventListener("input", debounce(saveFormState, 1000));
  });

  /* Subtle animations when typing */
  document.querySelectorAll(".sacred-input").forEach((input) => {
    input.addEventListener("focus", function () {
      if (selectedTone === "fusion") {
        createSubtleBreath(this);
      } else if (selectedTone === "gentle") {
        createSubtleTwinkle(this);
      } else if (selectedTone === "intense") {
        createSubtleSwirl(this);
      }
    });
  });

  /* TRANSFORMED: Form Submission with Auth & Usage */
  document
    .getElementById("reflectionForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      // Final auth check before submission
      if (!authToken && !isCreatorMode && !isTestMode) {
        redirectToAuth("Please sign in to save your reflection");
        return;
      }

      // Transition to loading
      showSection("loading");

      const fd = new FormData(e.target);

      const payload = {
        dream: fd.get("dream"),
        plan: fd.get("plan"),
        hasDate: fd.get("hasDate"),
        dreamDate: fd.get("dreamDate"),
        relationship: fd.get("relationship"),
        offering: fd.get("offering"),
        userName: userData?.name || "Friend",
        userEmail: userData?.email || "",
        language: "en",
        isAdmin: isCreatorMode || isTestMode,
        isCreator: isCreatorMode,
        isPremium: isPremiumMode,
        tone: selectedTone,
      };

      try {
        // TRANSFORMED: Include auth header for regular users
        const headers = { "Content-Type": "application/json" };
        if (authToken) {
          headers["Authorization"] = `Bearer ${authToken}`;
        }

        const res = await fetch("/api/reflection", {
          method: "POST",
          headers: headers,
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!data.success) {
          if (data.requiresAuth) {
            redirectToAuth("Authentication required");
            return;
          } else if (data.needsUpgrade) {
            showUsageLimitReached(data);
            return;
          }
          throw new Error(data.error || "Reflection failed");
        }

        document.getElementById("reflectionContent").innerHTML =
          data.reflection;

        // Show premium badge if this was a premium reflection
        if (data.isPremium) {
          showPremiumBadge();
        }

        // TRANSFORMED: Save reflection with ID for dashboard
        saveReflectionWithId(
          data.reflectionId,
          data.reflection,
          data.isPremium
        );

        // Show evolution report prompt if triggered
        if (data.shouldTriggerEvolution && !isCreatorMode && !isTestMode) {
          showEvolutionPrompt();
        }

        showSection("results");
      } catch (err) {
        console.error(err);
        document.getElementById("reflectionContent").innerHTML = `
          <h2>A moment of silence…</h2>
          <p>Your reflection is being prepared. Please try again soon.</p>`;
        showSection("results");
      }
    });
}

function selectTone(tone) {
  if (tone === selectedTone) return;

  selectedTone = tone;

  document
    .querySelectorAll(".tone-btn")
    .forEach((b) => b.classList.remove("selected"));

  document.querySelector(`[data-tone="${tone}"]`).classList.add("selected");

  transitionToTone(tone);
  saveFormState();
}

function transitionToTone(newTone) {
  document.body.classList.remove("tone-gentle", "tone-intense", "tone-fusion");
  document.body.classList.add(`tone-${newTone}`);
  createToneElements(newTone);
}

function showSection(id) {
  document.querySelectorAll(".experience-section").forEach((sec) => {
    sec.classList.remove("active");
    setTimeout(() => sec.classList.add("hidden"), 400);
  });

  setTimeout(() => {
    document
      .querySelectorAll(".experience-section")
      .forEach((s) => s.classList.add("hidden"));

    const sec = document.getElementById(id);
    sec.classList.remove("hidden");

    setTimeout(() => {
      sec.classList.add("active");
    }, 100);
  }, 400);
}

/* — ENHANCED REFLECTION STORAGE — */
function saveReflectionWithId(reflectionId, content, isPremium) {
  const reflectionData = {
    content: content,
    isPremium: isPremium,
    timestamp: Date.now(),
    userData: userData,
    reflectionId: reflectionId, // Database ID for linking
  };

  // Store locally for immediate access
  localStorage.setItem(
    `reflection_${reflectionId}`,
    JSON.stringify(reflectionData)
  );

  // Update URL to reflection state
  const url = new URL(window.location);
  url.searchParams.set("state", "reflection");
  url.searchParams.set("id", reflectionId);
  window.history.replaceState({}, "", url);

  // Clean up form state
  localStorage.removeItem("mirror_form_state");
}

/* — EVOLUTION REPORT PROMPT — */
function showEvolutionPrompt() {
  const evolutionPrompt = document.createElement("div");
  evolutionPrompt.className = "evolution-prompt";
  evolutionPrompt.innerHTML = `
    <div class="evolution-prompt-content">
      <div class="evolution-icon">🌱</div>
      <h3>Evolution Report Available</h3>
      <p>You've reached a milestone in your reflection journey. Generate your evolution report to see your growth patterns.</p>
      <div class="evolution-actions">
        <button onclick="generateEvolutionReport()" class="evolution-btn">
          Generate Report
        </button>
        <button onclick="closeEvolutionPrompt()" class="evolution-dismiss">
          Later
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(evolutionPrompt);

  // Add evolution prompt styles
  const style = document.createElement("style");
  style.textContent = `
    .evolution-prompt {
      position: fixed;
      top: 2rem;
      right: 2rem;
      background: rgba(16, 185, 129, 0.1);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 16px;
      padding: 1.5rem;
      max-width: 300px;
      color: white;
      z-index: 1000;
      animation: evolutionSlideIn 0.5s ease;
    }
    @keyframes evolutionSlideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .evolution-icon {
      font-size: 2rem;
      text-align: center;
      margin-bottom: 1rem;
    }
    .evolution-prompt h3 {
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
      color: #10b981;
    }
    .evolution-prompt p {
      font-size: 0.9rem;
      opacity: 0.8;
      margin-bottom: 1.5rem;
      line-height: 1.4;
    }
    .evolution-actions {
      display: flex;
      gap: 0.8rem;
    }
    .evolution-btn, .evolution-dismiss {
      flex: 1;
      padding: 0.8rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.3s ease;
    }
    .evolution-btn {
      background: #10b981;
      color: white;
    }
    .evolution-dismiss {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
    }
    .evolution-btn:hover, .evolution-dismiss:hover {
      transform: translateY(-1px);
    }
  `;
  document.head.appendChild(style);
}

function generateEvolutionReport() {
  closeEvolutionPrompt();
  window.location.href = "/evolution?action=generate";
}

function closeEvolutionPrompt() {
  const prompt = document.querySelector(".evolution-prompt");
  if (prompt) {
    prompt.remove();
  }
}

/* — ENHANCED EMAIL HELPER — */
function emailReflection() {
  // TRANSFORMED: Only for creator/test modes - regular users use dashboard
  if (!isCreatorMode && !isTestMode) {
    alert(
      "Your reflection is automatically saved to your dashboard. Visit your dashboard to access all your reflections."
    );
    return;
  }

  if (!userData?.email) {
    const email = prompt("Enter your email to receive this reflection:");
    if (!email) return;
    userData = { ...userData, email };
  }

  const btn = event.target;
  const originalText = btn.innerHTML;
  btn.innerHTML = "<span>✨</span><span>Sending...</span>";
  btn.disabled = true;

  const emailName = isCreatorMode ? "Ahiya" : userData.name || "Friend";

  fetch("/api/communication", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "send-reflection",
      email: userData.email,
      content: document.getElementById("reflectionContent").innerHTML,
      userName: emailName,
      language: "en",
      isPremium: isPremiumMode,
    }),
  })
    .then((r) => r.json())
    .then((d) => {
      btn.innerHTML = d.success
        ? "<span>✅</span><span>Reflection sent</span>"
        : "<span>⚡</span><span>Try again</span>";

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }, 2000);
    })
    .catch(() => {
      btn.innerHTML = "<span>🌙</span><span>Try again</span>";
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }, 2000);
    });
}

/* — HELPER FUNCTIONS (PRESERVED) — */
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

function createSubtleBreath(element) {
  const rect = element.getBoundingClientRect();
  const breath = document.createElement("div");
  breath.style.cssText = `
    position: fixed;
    left: ${rect.left + rect.width / 2}px;
    top: ${rect.top + rect.height / 2}px;
    width: 150px;
    height: 150px;
    margin-left: -75px;
    margin-top: -75px;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgba(251, 191, 36, 0.15) 0%,
      rgba(245, 158, 11, 0.08) 40%,
      transparent 70%
    );
    pointer-events: none;
    z-index: 5;
    animation: subtleExpand 3s ease-out forwards;
  `;
  document.body.appendChild(breath);
  setTimeout(() => breath.remove(), 3000);
}

function createSubtleTwinkle(element) {
  const rect = element.getBoundingClientRect();
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const star = document.createElement("div");
      const offsetX = (Math.random() - 0.5) * 150;
      const offsetY = (Math.random() - 0.5) * 150;
      star.style.cssText = `
        position: fixed;
        left: ${rect.left + rect.width / 2 + offsetX}px;
        top: ${rect.top + rect.height / 2 + offsetY}px;
        width: 3px;
        height: 3px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        box-shadow: 0 0 6px rgba(255, 255, 255, 0.5);
        pointer-events: none;
        z-index: 5;
        animation: subtleTwinkle 2s ease-out forwards;
      `;
      document.body.appendChild(star);
      setTimeout(() => star.remove(), 2000);
    }, i * 150);
  }
}

function createSubtleSwirl(element) {
  const rect = element.getBoundingClientRect();
  const swirl = document.createElement("div");
  swirl.style.cssText = `
    position: fixed;
    left: ${rect.left + rect.width / 2}px;
    top: ${rect.top + rect.height / 2}px;
    width: 120px;
    height: 120px;
    margin-left: -60px;
    margin-top: -60px;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgba(147, 51, 234, 0.2) 0%,
      rgba(168, 85, 247, 0.1) 40%,
      transparent 70%
    );
    pointer-events: none;
    z-index: 5;
    animation: subtleSwirl 3s ease-out forwards;
  `;
  document.body.appendChild(swirl);
  setTimeout(() => swirl.remove(), 3000);
}

function showPremiumBadge() {
  const resultsBackdrop = document.querySelector(".results-backdrop");
  const existingBadge = document.querySelector(".premium-badge");
  if (existingBadge) {
    existingBadge.remove();
  }

  if (resultsBackdrop) {
    const badge = document.createElement("div");
    badge.className = "premium-badge";
    badge.innerHTML = "✨ Premium Reflection";
    resultsBackdrop.insertBefore(badge, resultsBackdrop.firstChild);
  }
}

/* — ENHANCED STYLING — */
const style = document.createElement("style");
style.textContent = `
  @keyframes subtleExpand {
    0% { opacity: 0; transform: scale(0.5); }
    50% { opacity: 0.4; }
    100% { opacity: 0; transform: scale(2.5); }
  }
  
  @keyframes subtleTwinkle {
    0% { opacity: 0; transform: scale(0) rotate(0deg); }
    50% { opacity: 1; transform: scale(1.2) rotate(180deg); }
    100% { opacity: 0; transform: scale(0) rotate(360deg); }
  }
  
  @keyframes subtleSwirl {
    0% { opacity: 0; transform: scale(0.5) rotate(0deg); }
    50% { opacity: 0.5; transform: scale(1.2) rotate(180deg); }
    100% { opacity: 0; transform: scale(1.8) rotate(360deg); }
  }
  
  .premium-badge {
    position: absolute;
    top: -1px;
    right: 1.5rem;
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
    padding: 0.4rem 1rem;
    border-radius: 0 0 16px 16px;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    z-index: 20;
  }
  
  #adminNotice {
    animation: gentleGlow 3s ease-in-out infinite;
  }
  
  @keyframes gentleGlow {
    0%, 100% { 
      background: rgba(168, 85, 247, 0.08);
      border-color: rgba(168, 85, 247, 0.2);
    }
    50% { 
      background: rgba(168, 85, 247, 0.12);
      border-color: rgba(168, 85, 247, 0.3);
    }
  }
`;
document.head.appendChild(style);

// TRANSFORMED: Redirect to dashboard after reflection completion
setTimeout(() => {
  const resultsSection = document.getElementById("results");
  if (resultsSection && !resultsSection.classList.contains("hidden")) {
    // Add dashboard redirect option to results
    const actions = document.querySelector(".results-actions");
    if (actions && !isCreatorMode && !isTestMode && authToken) {
      const dashboardBtn = document.createElement("a");
      dashboardBtn.href = "/dashboard";
      dashboardBtn.className = "sacred-button primary";
      dashboardBtn.innerHTML = "<span>🏠</span><span>View Dashboard</span>";
      actions.insertBefore(dashboardBtn, actions.firstChild);
    }
  }
}, 5000); // Add after 5 seconds
