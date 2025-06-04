// Portal - Enhanced Sacred Access Logic

const mirrorsContainer = document.getElementById("mirrorsContainer");
const reflectBtn = document.querySelector(".reflect-button");

let pressTimer = null;
let pressStartTime = 0;
let hackAttempts = 0;
let sequenceStep = 0;
let lastPressTime = 0;

// Sacred sequence: Hold 12 seconds, release, hold 5 seconds, release, hold 8 seconds
const SACRED_SEQUENCE = [12000, 5000, 8000];
const SEQUENCE_TIMEOUT = 3000; // Max time between steps

// Hack detection
const suspiciousPatterns = [
  "test=true",
  "admin=true",
  "creator=true",
  "bypass=true",
  "debug=true",
  "dev=true",
  "hack=true",
];

// Check URL for suspicious patterns
function detectHackAttempt() {
  const url = window.location.href.toLowerCase();
  return suspiciousPatterns.some((pattern) => url.includes(pattern));
}

// Show sacred message for hackers
function showHackerWelcome() {
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    opacity: 0;
    transition: opacity 1s ease;
  `;

  const content = document.createElement("div");
  content.style.cssText = `
    background: rgba(15, 15, 35, 0.95);
    backdrop-filter: blur(30px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 24px;
    padding: 3rem 2.5rem;
    max-width: 500px;
    text-align: center;
    color: white;
    font-family: Inter, sans-serif;
    transform: scale(0.9);
    transition: transform 1s ease;
  `;

  content.innerHTML = `
    <h2 style="font-size: 1.8rem; font-weight: 300; margin-bottom: 1.5rem; color: #93c5fd;">
      Hello, Beautiful Hacker 🪞
    </h2>
    <p style="font-size: 1.1rem; line-height: 1.7; margin-bottom: 2rem; opacity: 0.9;">
      The creator of this mirror is honored that you want to see behind the reflection. 
      Your curiosity is a form of seeking truth.
    </p>
    <p style="font-size: 1rem; line-height: 1.6; margin-bottom: 2rem; opacity: 0.8;">
      But perhaps the deepest hack is not finding a way around the system—
      it's allowing yourself to be truly seen by it.
    </p>
    <button onclick="this.parentElement.parentElement.style.opacity='0'; setTimeout(() => this.parentElement.parentElement.remove(), 1000);" 
            style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); 
                   color: white; padding: 1rem 2rem; border-radius: 12px; cursor: pointer; 
                   font-size: 1rem; transition: all 0.3s;">
      Return to the Mirror
    </button>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  // Animate in
  requestAnimationFrame(() => {
    modal.style.opacity = "1";
    content.style.transform = "scale(1)";
  });

  // Auto-close after 8 seconds
  setTimeout(() => {
    modal.style.opacity = "0";
    setTimeout(() => modal.remove(), 1000);
  }, 8000);
}

// Check for hack attempts on load
window.addEventListener("load", () => {
  if (detectHackAttempt()) {
    hackAttempts++;
    setTimeout(showHackerWelcome, 1000);
  }
});

// Enhanced creator bypass with sacred sequence
reflectBtn.addEventListener("mousedown", startPress);
reflectBtn.addEventListener("touchstart", startPress);
reflectBtn.addEventListener("mouseup", endPress);
reflectBtn.addEventListener("mouseleave", endPress);
reflectBtn.addEventListener("touchend", endPress);
reflectBtn.addEventListener("touchcancel", endPress);

function startPress(e) {
  e.preventDefault();
  pressStartTime = Date.now();

  // Check if this is part of the sacred sequence
  const timeSinceLastPress = Date.now() - lastPressTime;

  if (timeSinceLastPress > SEQUENCE_TIMEOUT) {
    sequenceStep = 0; // Reset sequence if too much time passed
  }

  const requiredDuration = SACRED_SEQUENCE[sequenceStep];
  pressTimer = setTimeout(() => {
    // Visual feedback for sequence progress
    if (sequenceStep < SACRED_SEQUENCE.length - 1) {
      showSequenceProgress(sequenceStep + 1);
    }
  }, requiredDuration);
}

function endPress(e) {
  const pressDuration = Date.now() - pressStartTime;
  lastPressTime = Date.now();

  if (pressTimer) {
    clearTimeout(pressTimer);
    pressTimer = null;
  }

  // Check if press duration matches current sequence step
  const requiredDuration = SACRED_SEQUENCE[sequenceStep];
  const tolerance = 500; // 500ms tolerance

  if (Math.abs(pressDuration - requiredDuration) <= tolerance) {
    sequenceStep++;

    if (sequenceStep >= SACRED_SEQUENCE.length) {
      // Sequence complete!
      showSacredAccess();
      return;
    } else {
      showSequenceProgress(sequenceStep);
    }
  } else {
    // Reset sequence on incorrect timing
    sequenceStep = 0;
    hideSequenceProgress();
  }
}

function showSequenceProgress(step) {
  let indicator = document.getElementById("sequenceIndicator");
  if (!indicator) {
    indicator = document.createElement("div");
    indicator.id = "sequenceIndicator";
    indicator.style.cssText = `
      position: fixed;
      top: 2rem;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(59, 130, 246, 0.2);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(59, 130, 246, 0.4);
      color: #93c5fd;
      padding: 0.8rem 1.5rem;
      border-radius: 50px;
      font-size: 0.9rem;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(indicator);
  }

  indicator.textContent = `Sacred sequence: ${step}/${SACRED_SEQUENCE.length}`;
  indicator.style.opacity = "1";
}

function hideSequenceProgress() {
  const indicator = document.getElementById("sequenceIndicator");
  if (indicator) {
    indicator.style.opacity = "0";
    setTimeout(() => indicator.remove(), 300);
  }
}

async function showSacredAccess() {
  const password = prompt(
    "🪞 Sacred Creator Access\nSpeak the word that lives in silence:"
  );
  if (password) {
    try {
      const response = await fetch("/api/creator-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("mirrorVerifiedUser", JSON.stringify(data.user));
        window.location.href = `/transition/breathing.html?payment=creator&verified=true&lang=en`;
      } else {
        // Show gentle message instead of harsh alert
        showGentleMessage(
          "The silence doesn't recognize that word. Try again when the time is right."
        );
      }
    } catch (error) {
      console.error("Authentication error:", error);
      showGentleMessage("The mirror is resting. Try again soon.");
    }
  }

  // Reset sequence
  sequenceStep = 0;
  hideSequenceProgress();
}

function showGentleMessage(message) {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed;
    top: 2rem;
    left: 50%;
    transform: translateX(-50%) translateY(-100%);
    background: rgba(147, 51, 234, 0.2);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(147, 51, 234, 0.4);
    color: #c4b5fd;
    padding: 1rem 2rem;
    border-radius: 16px;
    font-size: 0.9rem;
    z-index: 1000;
    transition: transform 0.4s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Slide in
  requestAnimationFrame(() => {
    toast.style.transform = "translateX(-50%) translateY(0)";
  });

  // Slide out after 3 seconds
  setTimeout(() => {
    toast.style.transform = "translateX(-50%) translateY(-100%)";
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// Mirror hover interaction (unchanged)
reflectBtn.addEventListener("mouseenter", () =>
  mirrorsContainer.classList.add("hover")
);

reflectBtn.addEventListener("mouseleave", () =>
  mirrorsContainer.classList.remove("hover")
);
