// Mirror – Luminous Reflection Logic with Creator Modes
// Complete replacement for public/mirror/reflection.js

let userData = null;
let hasDateSet = null;
let isCreatorMode = false;
let isTestMode = false;
let selectedTone = "fusion"; // default
let backgroundElements = [];

/* — INITIALIZATION — */
window.addEventListener("load", () => {
  checkAuthAndSetup();
  initializeToneBackground();
  setupInteractions();
  animateQuestions();
});

/* — TONE BACKGROUND SYSTEM — */
function initializeToneBackground() {
  // Set initial tone
  document.body.classList.add(`tone-${selectedTone}`);
  createToneElements(selectedTone);
}

function createToneElements(tone) {
  // Clear existing elements
  backgroundElements.forEach((el) => el.remove());
  backgroundElements = [];

  if (tone === "fusion") {
    // Create golden breathing circles - more visible
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
    // Create twinkling stars - more visible
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
    // Create purple fire swirls - more visible
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

/* — AUTH CHECK WITH MODE DETECTION — */
function checkAuthAndSetup() {
  const url = new URLSearchParams(location.search);
  const mode = url.get("mode");

  // Check for creator bypass modes
  if (mode === "creator") {
    isCreatorMode = true;
    document.getElementById("adminNotice").style.display = "block";
    document.getElementById("adminNotice").innerHTML =
      "<span>✨ Creator mode — experiencing as Ahiya</span>";
  } else if (mode === "user") {
    isTestMode = true;
    document.getElementById("adminNotice").style.display = "block";
    document.getElementById("adminNotice").innerHTML =
      "<span>🌟 Test mode — experiencing as another soul</span>";
  }

  const stored = localStorage.getItem("mirrorVerifiedUser");
  if (stored) {
    try {
      userData = JSON.parse(stored);

      // Override creator status based on mode
      if (isCreatorMode) {
        userData.isCreator = true;
        userData.name = "Ahiya";
        userData.email = "ahiya.butman@gmail.com";
      } else if (isTestMode) {
        userData.isCreator = false;
        // Keep the test name/email they entered
      }
    } catch (e) {
      console.error("User parse", e);
      location.href = "/register";
    }
  } else if (!isCreatorMode && !isTestMode) {
    location.href = "/register";
  }
}

/* — SUBTLE QUESTION ANIMATION — */
function animateQuestions() {
  const questions = document.querySelectorAll(".question-group");
  questions.forEach((q, i) => {
    q.style.opacity = "0";
    setTimeout(() => {
      q.classList.add("appear");
    }, 400 + i * 200);
  });
}

/* — INTERACTIONS — */
function setupInteractions() {
  /* Tone Picker */
  document.querySelectorAll(".tone-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      // Remove selection from siblings
      this.parentNode
        .querySelectorAll(".tone-btn")
        .forEach((b) => b.classList.remove("selected"));

      // Select current
      this.classList.add("selected");

      const newTone = this.dataset.tone || "fusion";
      if (newTone === selectedTone) return;

      selectedTone = newTone;
      transitionToTone(newTone);
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
    });
  });

  /* Subtle animations when typing */
  document.querySelectorAll(".sacred-input").forEach((input) => {
    input.addEventListener("focus", function () {
      // Create subtle breath when focusing
      if (selectedTone === "fusion") {
        createSubtleBreath(this);
      } else if (selectedTone === "gentle") {
        createSubtleTwinkle(this);
      } else if (selectedTone === "intense") {
        createSubtleSwirl(this);
      }
    });
  });

  /* Form Submission */
  document
    .getElementById("reflectionForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

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
        isAdmin: isCreatorMode || isTestMode, // Allow unlimited reflections
        isCreator: isCreatorMode, // Only true if in creator mode
        tone: selectedTone,
      };

      try {
        const res = await fetch("/api/reflection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Reflection failed");

        document.getElementById("reflectionContent").innerHTML =
          data.reflection;
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

/* — SUBTLE INTERACTION EFFECTS — */
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

/* — TONE TRANSITION — */
function transitionToTone(newTone) {
  // Simply switch tone classes
  document.body.classList.remove("tone-gentle", "tone-intense", "tone-fusion");
  document.body.classList.add(`tone-${newTone}`);

  // Recreate background elements
  createToneElements(newTone);
}

/* — SECTION TRANSITIONS — */
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

/* — EMAIL HELPER — */
function emailReflection() {
  if (!userData?.email) {
    const email = prompt("Enter your email to receive this reflection:");
    if (!email) return;
    userData = { ...userData, email };
  }

  const btn = event.target;
  const originalText = btn.innerHTML;
  btn.innerHTML = "<span>✨</span><span>Sending...</span>";
  btn.disabled = true;

  // Use the correct user name for the email
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

/* — SUBTLE ANIMATIONS — */
const style = document.createElement("style");
style.textContent = `
  @keyframes subtleExpand {
    0% {
      opacity: 0;
      transform: scale(0.5);
    }
    50% {
      opacity: 0.4;
    }
    100% {
      opacity: 0;
      transform: scale(2.5);
    }
  }
  
  @keyframes subtleTwinkle {
    0% {
      opacity: 0;
      transform: scale(0) rotate(0deg);
    }
    50% {
      opacity: 1;
      transform: scale(1.2) rotate(180deg);
    }
    100% {
      opacity: 0;
      transform: scale(0) rotate(360deg);
    }
  }
  
  @keyframes subtleSwirl {
    0% {
      opacity: 0;
      transform: scale(0.5) rotate(0deg);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.2) rotate(180deg);
    }
    100% {
      opacity: 0;
      transform: scale(1.8) rotate(360deg);
    }
  }
  
  /* Mode indicator styling */
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
