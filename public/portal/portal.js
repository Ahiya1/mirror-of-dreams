// Portal - TRANSFORMED: Sacred Access Logic with User State Awareness
// NEW: Detects user authentication and shows appropriate CTAs

const mirrorsContainer = document.getElementById("mirrorsContainer");
const reflectBtn = document.querySelector(".reflect-button");

let pressTimer = null;
let pressStartTime = 0;
let isLongPressing = false;
let userState = null; // Will hold user authentication state

// TRANSFORMED: Initialize with user state detection
window.addEventListener("load", async () => {
  await detectUserState();
  updatePortalInterface();
  setupInteractions();
});

// ╭─ USER STATE DETECTION ──────────────────────────────────────╮
async function detectUserState() {
  const token = localStorage.getItem("mirrorAuthToken");

  if (!token) {
    userState = { authenticated: false, type: "new_visitor" };
    return;
  }

  try {
    // Verify token and get user data
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: "verify-token" }),
    });

    const result = await response.json();

    if (result.success && result.user) {
      // Get current usage status
      const usageResponse = await fetch("/api/users?action=get-usage", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const usageData = await usageResponse.json();
      const usage = usageData.success ? usageData.usage : null;

      userState = {
        authenticated: true,
        type: "returning_user",
        user: result.user,
        usage: usage,
        canReflect: usage?.current?.canReflect || false,
        needsUpgrade: usage?.current?.percentUsed >= 100,
      };

      console.log("✅ User authenticated:", userState.user.email);
    } else {
      // Invalid token, clear it
      localStorage.removeItem("mirrorAuthToken");
      localStorage.removeItem("mirrorUserData");
      userState = { authenticated: false, type: "new_visitor" };
    }
  } catch (error) {
    console.error("Auth check failed:", error);
    userState = { authenticated: false, type: "new_visitor" };
  }
}

// ╭─ PORTAL INTERFACE UPDATES ─────────────────────────────────╮
function updatePortalInterface() {
  updateReflectButton();
  updateNavigation();
  updateTaglines();
  updateSignInVisibility();
}

function updateReflectButton() {
  if (!userState.authenticated) {
    // New visitor - original behavior
    reflectBtn.innerHTML = "<span>Reflect Me</span>";
    reflectBtn.href = "/register";
    return;
  }

  // Authenticated user - context-aware CTAs
  if (userState.user.isCreator) {
    reflectBtn.innerHTML = "<span>✨ Creator Reflection</span>";
    reflectBtn.href = "/reflection?mode=creator";
  } else if (userState.canReflect) {
    reflectBtn.innerHTML = "<span>Continue Your Journey</span>";
    reflectBtn.href = "/reflection";
  } else if (userState.needsUpgrade) {
    reflectBtn.innerHTML = "<span>Upgrade for More</span>";
    reflectBtn.href = "/dashboard?tab=upgrade";
  } else {
    reflectBtn.innerHTML = "<span>View Your Reflections</span>";
    reflectBtn.href = "/dashboard";
  }
}

function updateNavigation() {
  const navLinks = document.querySelector(".nav-links");

  if (userState.authenticated) {
    // Add user menu for authenticated users
    const userMenu = document.createElement("div");
    userMenu.className = "user-menu";
    userMenu.innerHTML = `
      <div class="user-menu-trigger" onclick="toggleUserMenu()">
        <span class="user-name">${userState.user.name}</span>
        <span class="menu-indicator">▼</span>
      </div>
      <div class="user-menu-dropdown" id="userMenuDropdown" style="display: none;">
        <a href="/dashboard" class="menu-item">
          <span>🏠</span><span>Dashboard</span>
        </a>
        <a href="/reflections" class="menu-item">
          <span>📚</span><span>My Reflections</span>
        </a>
        ${
          userState.user.tier !== "free"
            ? `
        <a href="/evolution" class="menu-item">
          <span>🌱</span><span>Evolution Reports</span>
        </a>`
            : ""
        }
        <a href="/settings" class="menu-item">
          <span>⚙️</span><span>Settings</span>
        </a>
        <div class="menu-divider"></div>
        <a href="#" onclick="signOut()" class="menu-item sign-out">
          <span>🚪</span><span>Sign Out</span>
        </a>
      </div>
    `;

    // Replace or add user menu
    const existingMenu = navLinks.querySelector(".user-menu");
    if (existingMenu) {
      existingMenu.replaceWith(userMenu);
    } else {
      navLinks.appendChild(userMenu);
    }
  }
}

function updateTaglines() {
  const tagline = document.querySelector(".tagline");
  const subTagline = document.querySelector(".sub-tagline");

  if (!userState.authenticated) {
    // Default taglines for new visitors
    return;
  }

  // Personalized taglines for returning users
  const personalizedTaglines = {
    can_reflect: {
      main: "Ready for your next<br/>moment of truth?",
      sub: "Your reflection awaits.",
    },
    limit_reached: {
      main: "Your journey continues<br/>beyond limits.",
      sub: "Upgrade to reflect again this month.",
    },
    view_history: {
      main: "See how far<br/>you've traveled.",
      sub: "Your reflections hold your evolution.",
    },
    creator: {
      main: "Sacred creator space<br/>awaits.",
      sub: "Unlimited reflections for the mirror maker.",
    },
  };

  let taglineSet;
  if (userState.user.isCreator) {
    taglineSet = personalizedTaglines.creator;
  } else if (userState.canReflect) {
    taglineSet = personalizedTaglines.can_reflect;
  } else if (userState.needsUpgrade) {
    taglineSet = personalizedTaglines.limit_reached;
  } else {
    taglineSet = personalizedTaglines.view_history;
  }

  if (taglineSet && tagline) {
    tagline.innerHTML = taglineSet.main;
  }
  if (taglineSet && subTagline) {
    subTagline.textContent = taglineSet.sub;
  }
}

// ╭─ NEW: Sign-In Visibility Management ──────────────────────╮
function updateSignInVisibility() {
  const signInPrompt = document.getElementById("signInPrompt");

  if (!userState.authenticated) {
    // Show inline sign-in prompt
    if (signInPrompt) {
      signInPrompt.style.display = "block";
    }

    // Add sign-in button to top-left
    if (!document.querySelector(".sign-in-button")) {
      const signInButton = document.createElement("a");
      signInButton.href = "/auth";
      signInButton.className = "sign-in-button";
      signInButton.innerHTML = "<span>Sign In</span>";
      document.body.appendChild(signInButton);
    }
  } else {
    // Hide sign-in elements for authenticated users
    if (signInPrompt) {
      signInPrompt.style.display = "none";
    }

    const signInButton = document.querySelector(".sign-in-button");
    if (signInButton) {
      signInButton.remove();
    }
  }
}

// ╭─ USER MENU INTERACTIONS ──────────────────────────────────╮
function toggleUserMenu() {
  const dropdown = document.getElementById("userMenuDropdown");
  if (dropdown) {
    const isVisible = dropdown.style.display !== "none";
    dropdown.style.display = isVisible ? "none" : "block";
  }
}

async function signOut() {
  try {
    const token = localStorage.getItem("mirrorAuthToken");
    if (token) {
      await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "signout" }),
      });
    }
  } catch (error) {
    console.error("Sign out error:", error);
  }

  // Clear local storage
  localStorage.removeItem("mirrorAuthToken");
  localStorage.removeItem("mirrorUserData");

  // Refresh portal to show logged-out state
  window.location.reload();
}

// Close user menu when clicking outside
document.addEventListener("click", (e) => {
  const userMenu = document.querySelector(".user-menu");
  const dropdown = document.getElementById("userMenuDropdown");

  if (userMenu && dropdown && !userMenu.contains(e.target)) {
    dropdown.style.display = "none";
  }
});

// ╭─ ORIGINAL CREATOR ACCESS (PRESERVED) ─────────────────────╮
function setupInteractions() {
  // Simple creator bypass: Hold for 8.3 seconds (no visual indicator)
  reflectBtn.addEventListener("mousedown", startPress);
  reflectBtn.addEventListener("touchstart", startPress, { passive: false });
  reflectBtn.addEventListener("mouseup", endPress);
  reflectBtn.addEventListener("mouseleave", endPress);
  reflectBtn.addEventListener("touchend", endPress);
  reflectBtn.addEventListener("touchcancel", endPress);
  reflectBtn.addEventListener("click", handleClick);

  // Prevent context menu on long press for mobile
  reflectBtn.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  // Mirror hover interaction (desktop only)
  if (window.matchMedia("(hover: hover)").matches) {
    reflectBtn.addEventListener("mouseenter", () =>
      mirrorsContainer.classList.add("hover")
    );

    reflectBtn.addEventListener("mouseleave", () =>
      mirrorsContainer.classList.remove("hover")
    );
  }
}

function startPress(e) {
  pressStartTime = Date.now();
  isLongPressing = false;

  // Set timer for creator access (no visual feedback)
  pressTimer = setTimeout(() => {
    isLongPressing = true;
    showCreatorAccess();
  }, 8300); // 8.3 seconds
}

function endPress(e) {
  if (pressTimer) {
    clearTimeout(pressTimer);
    pressTimer = null;
  }

  // Reset long press flag after a short delay
  setTimeout(() => {
    isLongPressing = false;
  }, 100);
}

function handleClick(e) {
  // If this was a long press, prevent the normal click
  if (isLongPressing) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  // Otherwise, let the normal navigation happen via href
}

// ╭─ CREATOR ACCESS MODAL (PRESERVED WITH UPDATES) ──────────╮
function showCreatorAccess() {
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.5s ease;
    padding: 1rem;
  `;

  const content = document.createElement("div");
  content.style.cssText = `
    background: rgba(15, 15, 35, 0.95);
    backdrop-filter: blur(30px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 24px;
    padding: 2rem 1.5rem;
    max-width: 400px;
    width: 100%;
    text-align: center;
    color: white;
    font-family: Inter, sans-serif;
    transform: scale(0.9);
    transition: transform 0.5s ease;
    position: relative;
    overflow: hidden;
    max-height: 90vh;
    overflow-y: auto;
  `;

  content.innerHTML = `
    <div style="position: absolute; inset: 1px; background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%); border-radius: 23px; pointer-events: none;"></div>
    
    <h2 style="font-size: clamp(1.4rem, 4vw, 1.8rem); font-weight: 300; margin-bottom: 0.5rem; 
               background: linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%);
               -webkit-background-clip: text; color: transparent; position: relative; z-index: 1;">
      Sacred Creator Access 🪞
    </h2>
    <p style="margin-bottom: 2rem; opacity: 0.8; line-height: 1.6; position: relative; z-index: 1; font-size: clamp(0.9rem, 2.5vw, 1rem);">
      How would you like to experience the mirror?
    </p>

    <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; position: relative; z-index: 1;">
      <button onclick="selectMode('creator')" id="creatorBtn" style="
        padding: 1.2rem 1.5rem; 
        background: linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(99, 102, 241, 0.15));
        border: 1px solid rgba(147, 51, 234, 0.4);
        border-radius: 16px; 
        color: #c4b5fd; 
        cursor: pointer; 
        font-size: clamp(0.9rem, 2.5vw, 1rem);
        font-weight: 500;
        transition: all 0.3s ease;
        letter-spacing: 0.3px;
        position: relative;
        overflow: hidden;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      ">
        ✨ As the Creator<br>
        <small style="opacity: 0.7; font-size: 0.85rem;">Experience with creator context</small>
      </button>

      <button onclick="selectMode('user')" id="userBtn" style="
        padding: 1.2rem 1.5rem; 
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.15));
        border: 1px solid rgba(16, 185, 129, 0.4);
        border-radius: 16px; 
        color: #6ee7b7; 
        cursor: pointer; 
        font-size: clamp(0.9rem, 2.5vw, 1rem);
        font-weight: 500;
        transition: all 0.3s ease;
        letter-spacing: 0.3px;
        position: relative;
        overflow: hidden;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      ">
        🌟 As Another Soul<br>
        <small style="opacity: 0.7; font-size: 0.85rem;">Experience as a regular user</small>
      </button>
    </div>

    <div style="margin-bottom: 2rem; position: relative; z-index: 1;">
      <input type="password" id="creatorPassword" placeholder="Sacred creator password..." style="
        width: 100%; 
        padding: 1rem; 
        background: rgba(255, 255, 255, 0.08); 
        border: 1px solid rgba(255, 255, 255, 0.15); 
        border-radius: 12px; 
        color: white; 
        text-align: center;
        font-size: clamp(0.9rem, 2.5vw, 1rem);
        transition: all 0.3s ease;
        touch-action: manipulation;
        -webkit-appearance: none;
        box-sizing: border-box;
      " />
    </div>

    <div style="display: flex; gap: 1rem; position: relative; z-index: 1; flex-wrap: wrap;">
      <button onclick="closeCreatorModal()" style="
        flex: 1;
        min-width: 100px;
        background: rgba(255, 255, 255, 0.1); 
        border: 1px solid rgba(255, 255, 255, 0.2); 
        border-radius: 12px; 
        color: rgba(255, 255, 255, 0.7); 
        padding: 1rem 1.5rem; 
        cursor: pointer;
        font-size: clamp(0.8rem, 2vw, 0.9rem);
        transition: all 0.3s ease;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      ">
        Cancel
      </button>
      
      <button onclick="proceedWithMode()" id="proceedBtn" style="
        flex: 2;
        min-width: 120px;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        color: #fff;
        padding: 1rem 1.5rem;
        cursor: pointer;
        font-size: clamp(0.8rem, 2vw, 0.9rem);
        font-weight: 500;
        transition: all 0.3s ease;
        letter-spacing: 0.3px;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      ">
        Enter Sacred Space
      </button>
    </div>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  // Animate in
  requestAnimationFrame(() => {
    modal.style.opacity = "1";
    content.style.transform = "scale(1)";
  });

  // Focus password input (with delay for mobile)
  setTimeout(() => {
    const passwordInput = document.getElementById("creatorPassword");
    if (passwordInput && window.innerWidth > 768) {
      passwordInput.focus();
    }
  }, 500);

  // Handle enter key
  content.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      proceedWithMode();
    }
  });

  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeCreatorModal();
    }
  });

  // Store modal reference for global access
  window.creatorModal = modal;
  window.selectedCreatorMode = "creator"; // Default

  // Add mobile-friendly button interactions
  addMobileButtonEffects();
}

function addMobileButtonEffects() {
  const creatorBtn = document.getElementById("creatorBtn");
  const userBtn = document.getElementById("userBtn");

  // Touch-friendly interactions
  [creatorBtn, userBtn].forEach((btn) => {
    btn.addEventListener("touchstart", () => {
      btn.style.transform = "scale(0.98)";
    });

    btn.addEventListener("touchend", () => {
      btn.style.transform = "scale(1)";
    });
  });

  // Hover effects (desktop only)
  if (window.matchMedia("(hover: hover)").matches) {
    creatorBtn.addEventListener("mouseenter", () => {
      creatorBtn.style.background =
        "linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(99, 102, 241, 0.2))";
      creatorBtn.style.transform = "translateY(-2px)";
    });

    creatorBtn.addEventListener("mouseleave", () => {
      creatorBtn.style.background =
        "linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(99, 102, 241, 0.15))";
      creatorBtn.style.transform = "translateY(0)";
    });

    userBtn.addEventListener("mouseenter", () => {
      userBtn.style.background =
        "linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(6, 182, 212, 0.2))";
      userBtn.style.transform = "translateY(-2px)";
    });

    userBtn.addEventListener("mouseleave", () => {
      userBtn.style.background =
        "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.15))";
      userBtn.style.transform = "translateY(0)";
    });
  }
}

function selectMode(mode) {
  window.selectedCreatorMode = mode;

  // Update button styles
  const creatorBtn = document.getElementById("creatorBtn");
  const userBtn = document.getElementById("userBtn");

  if (mode === "creator") {
    creatorBtn.style.background =
      "linear-gradient(135deg, rgba(147, 51, 234, 0.4), rgba(99, 102, 241, 0.25))";
    creatorBtn.style.borderColor = "rgba(147, 51, 234, 0.6)";
    userBtn.style.background =
      "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.15))";
    userBtn.style.borderColor = "rgba(16, 185, 129, 0.4)";
  } else {
    userBtn.style.background =
      "linear-gradient(135deg, rgba(16, 185, 129, 0.4), rgba(6, 182, 212, 0.25))";
    userBtn.style.borderColor = "rgba(16, 185, 129, 0.6)";
    creatorBtn.style.background =
      "linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(99, 102, 241, 0.15))";
    creatorBtn.style.borderColor = "rgba(147, 51, 234, 0.4)";
  }
}

async function proceedWithMode() {
  const password = document.getElementById("creatorPassword").value.trim();
  const mode = window.selectedCreatorMode || "creator";

  if (!password) {
    showCreatorError("Sacred password required");
    return;
  }

  try {
    const response = await fetch("/api/creator-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      if (mode === "creator") {
        // Store creator user data
        localStorage.setItem("mirrorAuthToken", data.token);
        localStorage.setItem("mirrorUserData", JSON.stringify(data.user));

        // Go to reflection with creator mode
        window.location.href = `/reflection?mode=creator&premium=true`;
      } else {
        // Prompt for the name they want to use
        const testName = prompt("🌟 What name should the mirror know you by?");
        if (!testName) return;

        const testEmail =
          prompt("✨ What email should receive the reflection?") ||
          "test@example.com";

        // Create temporary test user
        const testUser = {
          name: testName,
          email: testEmail,
          language: "en",
          isCreator: false,
          testMode: true,
        };

        localStorage.setItem("mirrorTempUser", JSON.stringify(testUser));

        // Go to reflection as a regular user
        window.location.href = `/reflection?mode=user&premium=false`;
      }
    } else {
      showCreatorError("Invalid sacred password");
    }
  } catch (error) {
    console.error("Creator auth error:", error);
    showCreatorError("Sacred realm temporarily unavailable");
  }
}

function showCreatorError(message) {
  let errorDiv = document.getElementById("creatorError");
  if (!errorDiv) {
    errorDiv = document.createElement("div");
    errorDiv.id = "creatorError";
    errorDiv.style.cssText = `
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
      padding: 0.8rem;
      border-radius: 12px;
      margin-top: 1rem;
      font-size: clamp(0.8rem, 2vw, 0.9rem);
      text-align: center;
      position: relative;
      z-index: 1;
    `;
    document
      .getElementById("creatorPassword")
      .parentElement.appendChild(errorDiv);
  }

  errorDiv.textContent = message;
  errorDiv.style.display = "block";

  // Clear password
  document.getElementById("creatorPassword").value = "";

  // Hide error after 3 seconds
  setTimeout(() => {
    errorDiv.style.display = "none";
  }, 3000);
}

function closeCreatorModal() {
  if (window.creatorModal) {
    window.creatorModal.style.opacity = "0";
    setTimeout(() => {
      window.creatorModal.remove();
      window.creatorModal = null;
    }, 500);
  }
}

// ╭─ USER MENU STYLES ──────────────────────────────────────────╮
const userMenuStyles = document.createElement("style");
userMenuStyles.textContent = `
  .user-menu {
    position: relative;
    display: inline-block;
  }

  .user-menu-trigger {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.8rem 1.5rem;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 50px;
    color: rgba(255, 255, 255, 0.9);
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: clamp(0.8rem, 2vw, 0.9rem);
    min-height: 44px;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  .user-menu-trigger:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  .user-name {
    font-weight: 500;
    letter-spacing: 0.3px;
  }

  .menu-indicator {
    font-size: 0.7rem;
    opacity: 0.7;
    transition: transform 0.3s ease;
  }

  .user-menu-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    background: rgba(15, 15, 35, 0.95);
    backdrop-filter: blur(30px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 16px;
    padding: 0.5rem;
    min-width: 200px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    z-index: 1000;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.8rem 1rem;
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    border-radius: 12px;
    transition: all 0.3s ease;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .menu-item:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.95);
    transform: translateX(2px);
  }

  .menu-item.sign-out {
    color: rgba(239, 68, 68, 0.8);
  }

  .menu-item.sign-out:hover {
    background: rgba(239, 68, 68, 0.1);
    color: rgba(239, 68, 68, 0.95);
  }

  .menu-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
    margin: 0.5rem 0;
  }

  @media (max-width: 768px) {
    .user-menu-trigger {
      padding: 0.7rem 1.2rem;
      font-size: 0.85rem;
    }

    .user-menu-dropdown {
      min-width: 180px;
      right: -0.5rem;
    }
  }
`;
document.head.appendChild(userMenuStyles);
