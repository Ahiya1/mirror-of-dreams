// Mirror – Luminous Reflection Logic
// Deep space • tone-responsive patterns • cosmic consciousness
// ---------------------------------------------------------

let userData = null;
let hasDateSet = null;
let isAdminMode = false;
let selectedTone = "fusion"; // default

/* — COSMIC INITIALIZATION — */
window.addEventListener("load", () => {
  checkAuthAndSetup();
  initializeCosmicSpace();
  setTimeout(animateQuestions, 500);
  setupInteractions();
});

/* — COSMIC SPACE SETUP — */
function initializeCosmicSpace() {
  // Create pattern containers
  const patternLeft = document.createElement("div");
  const patternRight = document.createElement("div");
  patternLeft.className = "pattern-left";
  patternRight.className = "pattern-right";
  document.body.appendChild(patternLeft);
  document.body.appendChild(patternRight);

  // Create cosmic particles
  const particlesContainer = document.createElement("div");
  particlesContainer.className = "cosmic-particles";

  for (let i = 0; i < 4; i++) {
    const particle = document.createElement("div");
    particle.className = "cosmic-particle";
    particlesContainer.appendChild(particle);
  }

  document.body.appendChild(particlesContainer);

  // Set initial tone
  document.body.classList.add(`tone-${selectedTone}`);
}

/* — AUTH CHECK (unchanged) — */
function checkAuthAndSetup() {
  const url = new URLSearchParams(location.search);
  if (url.get("admin") === "true") {
    isAdminMode = true;
    document.getElementById("adminNotice").style.display = "block";
  }
  const stored = localStorage.getItem("mirrorVerifiedUser");
  if (stored) {
    try {
      userData = JSON.parse(stored);
    } catch (e) {
      console.error("User parse", e);
      location.href = "../commitment/register.html";
    }
  } else if (!isAdminMode) {
    location.href = "../commitment/register.html";
  }
}

/* — LUMINOUS QUESTION ANIMATION — */
function animateQuestions() {
  document.querySelectorAll(".question-group").forEach((q, i) => {
    setTimeout(() => {
      q.classList.add("visible");

      // Add subtle glow effect on reveal
      q.style.transition = "all 0.8s ease, box-shadow 0.8s ease";
      q.style.boxShadow = "0 0 30px rgba(255, 255, 255, 0.05)";

      setTimeout(() => {
        q.style.boxShadow = "none";
      }, 1000);
    }, i * 300);
  });
}

/* — TONE & INTERACTION SETUP — */
function setupInteractions() {
  /* Luminous Tone Picker */
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

    // Add hover cosmic effect
    btn.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-2px) scale(1.02)";
      this.style.boxShadow = "0 8px 32px rgba(255, 255, 255, 0.1)";
    });

    btn.addEventListener("mouseleave", function () {
      if (!this.classList.contains("selected")) {
        this.style.transform = "";
        this.style.boxShadow = "";
      }
    });
  });

  /* Enhanced Yes/No Interactions */
  document.querySelectorAll(".yes-no-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      // Cosmic selection animation
      this.style.transform = "scale(0.95)";
      setTimeout(() => {
        this.style.transform = "translateY(-2px) scale(1)";
      }, 100);

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
        box.style.animation = "fadeIn 0.6s ease forwards";
        dateInp.required = true;
      } else {
        box.style.display = "none";
        dateInp.required = false;
        dateInp.value = "";
      }
    });

    // Hover effects
    btn.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-2px)";
      this.style.boxShadow = "0 4px 20px rgba(255, 255, 255, 0.1)";
    });

    btn.addEventListener("mouseleave", function () {
      if (!this.classList.contains("selected")) {
        this.style.transform = "";
        this.style.boxShadow = "";
      }
    });
  });

  /* Enhanced Input Focus Effects */
  document.querySelectorAll(".sacred-input").forEach((input) => {
    input.addEventListener("focus", function () {
      this.parentNode.style.transform = "scale(1.01)";
      this.parentNode.style.transition = "transform 0.3s ease";
    });

    input.addEventListener("blur", function () {
      this.parentNode.style.transform = "";
    });

    input.addEventListener("input", function () {
      // Subtle typing glow
      this.style.boxShadow = "0 0 20px rgba(255, 255, 255, 0.05)";
      clearTimeout(this.glowTimeout);
      this.glowTimeout = setTimeout(() => {
        this.style.boxShadow = "";
      }, 1000);
    });
  });

  /* Form Submission with Cosmic Loading */
  document
    .getElementById("reflectionForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      // Cosmic transition to loading
      showSection("loading", true);

      const fd = new FormData(e.target);

      let creatorContext = null,
        isCreatorMode = false;
      if (userData?.isCreator) {
        isCreatorMode = true;
        const storedCtx = localStorage.getItem("mirrorCreatorContext");
        if (storedCtx)
          try {
            creatorContext = JSON.parse(storedCtx);
          } catch {}
      }

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
        isAdmin: isAdminMode,
        isCreator: isCreatorMode,
        creatorContext,
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
        showSection("results", true);
      } catch (err) {
        console.error(err);
        document.getElementById("reflectionContent").innerHTML = `
          <h2>A moment of silence…</h2>
          <p>Your reflection is being prepared. Please try again soon.</p>`;
        showSection("results", true);
      }
    });
}

/* — COSMIC TONE TRANSITION — */
function transitionToTone(newTone) {
  // Fade out current patterns
  document.body.style.transition = "filter 0.6s ease";
  document.body.style.filter = "blur(1px) brightness(0.7)";

  setTimeout(() => {
    // Switch tone classes
    document.body.classList.remove(
      "tone-gentle",
      "tone-intense",
      "tone-fusion"
    );
    document.body.classList.add(`tone-${newTone}`);

    // Fade back in with new patterns
    document.body.style.filter = "";

    // Add cosmic shimmer effect during transition
    const shimmer = document.createElement("div");
    shimmer.style.cssText = `
      position: fixed;
      inset: 0;
      background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
      background-size: 200% 200%;
      animation: cosmicShimmer 1s ease-out;
      pointer-events: none;
      z-index: 100;
    `;
    document.body.appendChild(shimmer);

    setTimeout(() => shimmer.remove(), 1000);
  }, 300);
}

/* — ENHANCED SECTION TRANSITIONS — */
function showSection(id, cosmic = false) {
  document.querySelectorAll(".experience-section").forEach((sec) => {
    sec.classList.remove("active");
    sec.style.transform = "translateY(20px) scale(0.98)";
    sec.style.opacity = "0";
    setTimeout(() => sec.classList.add("hidden"), 400);
  });

  setTimeout(() => {
    document
      .querySelectorAll(".experience-section")
      .forEach((s) => s.classList.add("hidden"));

    const sec = document.getElementById(id);
    sec.classList.remove("hidden");

    if (cosmic) {
      // Cosmic emergence animation
      sec.style.transform = "translateY(30px) scale(0.95)";
      sec.style.opacity = "0";
      sec.style.filter = "blur(2px)";
    }

    setTimeout(() => {
      sec.classList.add("active");
      sec.style.transform = "translateY(0) scale(1)";
      sec.style.opacity = "1";
      sec.style.filter = "none";
    }, 100);
  }, 400);
}

/* — COSMIC EMAIL HELPER — */
function emailReflection() {
  if (!userData?.email) {
    const email = prompt("Enter your email to receive this reflection:");
    if (!email) return;
    userData = { ...userData, email };
  }

  // Cosmic sending animation
  const btn = event.target;
  const originalText = btn.innerHTML;
  btn.innerHTML = "<span>✨</span><span>Sending through the cosmos...</span>";
  btn.style.background =
    "linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.2))";
  btn.disabled = true;

  fetch("/api/communication", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "send-reflection",
      email: userData.email,
      content: document.getElementById("reflectionContent").innerHTML,
      userName: userData.name || "Friend",
      language: "en",
    }),
  })
    .then((r) => r.json())
    .then((d) => {
      btn.innerHTML = d.success
        ? "<span>🌟</span><span>Sent to the stars</span>"
        : "<span>⚡</span><span>Cosmic interference</span>";

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = "";
        btn.disabled = false;
      }, 2000);
    })
    .catch(() => {
      btn.innerHTML = "<span>🌙</span><span>Try again</span>";
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = "";
        btn.disabled = false;
      }, 2000);
    });
}

/* — COSMIC CURSOR INTERACTION — */
document.addEventListener("mousemove", (e) => {
  const mouseX = e.clientX / window.innerWidth;
  const mouseY = e.clientY / window.innerHeight;

  // Subtle cosmic response to cursor
  document.documentElement.style.setProperty("--mouse-x", mouseX);
  document.documentElement.style.setProperty("--mouse-y", mouseY);

  // Create occasional cosmic sparkles on movement
  if (Math.random() < 0.02) {
    createCosmicSparkle(e.clientX, e.clientY);
  }
});

function createCosmicSparkle(x, y) {
  const sparkle = document.createElement("div");
  sparkle.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    width: 2px;
    height: 2px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    pointer-events: none;
    z-index: 1000;
    animation: sparkle 1s ease-out forwards;
  `;

  document.body.appendChild(sparkle);
  setTimeout(() => sparkle.remove(), 1000);
}

/* — COSMIC SPARKLE ANIMATION — */
const style = document.createElement("style");
style.textContent = `
  @keyframes sparkle {
    0% {
      opacity: 0;
      transform: scale(0);
    }
    50% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(0) translateY(-20px);
    }
  }
`;
document.head.appendChild(style);
