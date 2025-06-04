// Portal - Simplified Sacred Access Logic
// Complete replacement for public/portal/portal.js

const mirrorsContainer = document.getElementById("mirrorsContainer");
const reflectBtn = document.querySelector(".reflect-button");

let pressTimer = null;
let pressStartTime = 0;

// Simple creator bypass: Hold for 8.3 seconds
reflectBtn.addEventListener("mousedown", startPress);
reflectBtn.addEventListener("touchstart", startPress, { passive: false });
reflectBtn.addEventListener("mouseup", endPress);
reflectBtn.addEventListener("mouseleave", endPress);
reflectBtn.addEventListener("touchend", endPress);
reflectBtn.addEventListener("touchcancel", endPress);

function startPress(e) {
  e.preventDefault();
  pressStartTime = Date.now();

  // Visual feedback during hold
  pressTimer = setTimeout(() => {
    showCreatorAccess();
  }, 8300); // 8.3 seconds

  // Show progress indicator
  showHoldProgress();
}

function endPress(e) {
  const pressDuration = Date.now() - pressStartTime;

  if (pressTimer) {
    clearTimeout(pressTimer);
    pressTimer = null;
  }

  hideHoldProgress();

  // If they didn't hold long enough, do nothing (let normal click through)
  if (pressDuration < 8300) {
    return;
  }
}

function showHoldProgress() {
  let progressIndicator = document.getElementById("holdProgress");
  if (!progressIndicator) {
    progressIndicator = document.createElement("div");
    progressIndicator.id = "holdProgress";
    progressIndicator.style.cssText = `
      position: fixed;
      top: 2rem;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(99, 102, 241, 0.2);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(99, 102, 241, 0.4);
      color: #a5b4fc;
      padding: 0.8rem 1.5rem;
      border-radius: 50px;
      font-size: 0.9rem;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    `;
    progressIndicator.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <div style="width: 100px; height: 2px; background: rgba(99, 102, 241, 0.3); border-radius: 1px; overflow: hidden;">
          <div id="progressBar" style="width: 0%; height: 100%; background: #6366f1; transition: width 8.3s linear;"></div>
        </div>
        <span>Sacred access...</span>
      </div>
    `;
    document.body.appendChild(progressIndicator);
  }

  progressIndicator.style.opacity = "1";

  // Start progress bar animation
  setTimeout(() => {
    const progressBar = document.getElementById("progressBar");
    if (progressBar) {
      progressBar.style.width = "100%";
    }
  }, 50);
}

function hideHoldProgress() {
  const progressIndicator = document.getElementById("holdProgress");
  if (progressIndicator) {
    progressIndicator.style.opacity = "0";
    setTimeout(() => {
      const progressBar = document.getElementById("progressBar");
      if (progressBar) {
        progressBar.style.width = "0%";
        progressBar.style.transition = "none";
      }
    }, 300);
  }
}

function showCreatorAccess() {
  hideHoldProgress();

  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.5s ease;
  `;

  const content = document.createElement("div");
  content.style.cssText = `
    background: rgba(15, 15, 35, 0.95);
    backdrop-filter: blur(30px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 24px;
    padding: 3rem 2.5rem;
    max-width: 450px;
    width: 90%;
    text-align: center;
    color: white;
    font-family: Inter, sans-serif;
    transform: scale(0.9);
    transition: transform 0.5s ease;
    position: relative;
    overflow: hidden;
  `;

  content.innerHTML = `
    <div style="position: absolute; inset: 1px; background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%); border-radius: 23px; pointer-events: none;"></div>
    
    <h2 style="font-size: 1.8rem; font-weight: 300; margin-bottom: 0.5rem; 
               background: linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%);
               -webkit-background-clip: text; color: transparent; position: relative; z-index: 1;">
      Sacred Creator Access 🪞
    </h2>
    <p style="margin-bottom: 2rem; opacity: 0.8; line-height: 1.6; position: relative; z-index: 1;">
      How would you like to experience the mirror?
    </p>

    <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; position: relative; z-index: 1;">
      <button onclick="selectMode('creator')" id="creatorBtn" style="
        padding: 1.2rem 2rem; 
        background: linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(99, 102, 241, 0.15));
        border: 1px solid rgba(147, 51, 234, 0.4);
        border-radius: 16px; 
        color: #c4b5fd; 
        cursor: pointer; 
        font-size: 1rem;
        font-weight: 500;
        transition: all 0.3s ease;
        letter-spacing: 0.3px;
        position: relative;
        overflow: hidden;
      ">
        ✨ As the Creator<br>
        <small style="opacity: 0.7; font-size: 0.85rem;">Experience with creator context</small>
      </button>

      <button onclick="selectMode('user')" id="userBtn" style="
        padding: 1.2rem 2rem; 
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.15));
        border: 1px solid rgba(16, 185, 129, 0.4);
        border-radius: 16px; 
        color: #6ee7b7; 
        cursor: pointer; 
        font-size: 1rem;
        font-weight: 500;
        transition: all 0.3s ease;
        letter-spacing: 0.3px;
        position: relative;
        overflow: hidden;
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
        font-size: 1rem;
        transition: all 0.3s ease;
      " />
    </div>

    <div style="display: flex; gap: 1rem; position: relative; z-index: 1;">
      <button onclick="closeCreatorModal()" style="
        flex: 1;
        background: rgba(255, 255, 255, 0.1); 
        border: 1px solid rgba(255, 255, 255, 0.2); 
        border-radius: 12px; 
        color: rgba(255, 255, 255, 0.7); 
        padding: 0.8rem 1.5rem; 
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.3s ease;
      ">
        Cancel
      </button>
      
      <button onclick="proceedWithMode()" id="proceedBtn" style="
        flex: 2;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        color: #fff;
        padding: 0.8rem 1.5rem;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
        transition: all 0.3s ease;
        letter-spacing: 0.3px;
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

  // Focus password input
  setTimeout(() => {
    document.getElementById("creatorPassword")?.focus();
  }, 500);

  // Handle enter key
  content.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      proceedWithMode();
    }
  });

  // Store modal reference for global access
  window.creatorModal = modal;
  window.selectedCreatorMode = "creator"; // Default

  // Add hover effects
  addButtonHoverEffects();
}

function addButtonHoverEffects() {
  const creatorBtn = document.getElementById("creatorBtn");
  const userBtn = document.getElementById("userBtn");

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
      font-size: 0.9rem;
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

// Mirror hover interaction (existing functionality)
reflectBtn.addEventListener("mouseenter", () =>
  mirrorsContainer.classList.add("hover")
);

reflectBtn.addEventListener("mouseleave", () =>
  mirrorsContainer.classList.remove("hover")
);
