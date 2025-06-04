// Portal - Mobile-Optimized Sacred Access Logic
// Complete replacement for public/portal/portal.js

const mirrorsContainer = document.getElementById("mirrorsContainer");
const reflectBtn = document.querySelector(".reflect-button");

let pressTimer = null;
let pressStartTime = 0;

// Simple creator bypass: Hold for 8.3 seconds (no visual indicator)
reflectBtn.addEventListener("mousedown", startPress);
reflectBtn.addEventListener("touchstart", startPress, { passive: false });
reflectBtn.addEventListener("mouseup", endPress);
reflectBtn.addEventListener("mouseleave", endPress);
reflectBtn.addEventListener("touchend", endPress);
reflectBtn.addEventListener("touchcancel", endPress);

// Prevent context menu on long press for mobile
reflectBtn.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

function startPress(e) {
  e.preventDefault();
  pressStartTime = Date.now();

  // Set timer for creator access (no visual feedback)
  pressTimer = setTimeout(() => {
    showCreatorAccess();
  }, 8300); // 8.3 seconds
}

function endPress(e) {
  const pressDuration = Date.now() - pressStartTime;

  if (pressTimer) {
    clearTimeout(pressTimer);
    pressTimer = null;
  }

  // If they didn't hold long enough, do nothing (let normal click through)
  if (pressDuration < 8300) {
    return;
  }
}

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
      // Only auto-focus on desktop
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
        localStorage.setItem("mirrorVerifiedUser", JSON.stringify(data.user));

        // Go directly to reflection with creator mode
        window.location.href = `/mirror/reflection.html?payment=creator&verified=true&lang=en&mode=creator`;
      } else {
        // Prompt for the name they want to use
        const testName = prompt("🌟 What name should the mirror know you by?");
        if (!testName) return;

        const testEmail =
          prompt("✨ What email should receive the reflection?") ||
          "test@example.com";

        // Store test user data (not creator)
        const testUser = {
          name: testName,
          email: testEmail,
          language: "en",
          isCreator: false, // Important: not creator mode
          testMode: true,
        };

        localStorage.setItem("mirrorVerifiedUser", JSON.stringify(testUser));

        // Go to reflection as a regular user
        window.location.href = `/mirror/reflection.html?payment=test&verified=true&lang=en&mode=user`;
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

// Mirror hover interaction (desktop only)
if (window.matchMedia("(hover: hover)").matches) {
  reflectBtn.addEventListener("mouseenter", () =>
    mirrorsContainer.classList.add("hover")
  );

  reflectBtn.addEventListener("mouseleave", () =>
    mirrorsContainer.classList.remove("hover")
  );
}
