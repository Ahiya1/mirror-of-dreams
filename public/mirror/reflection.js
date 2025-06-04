// Mirror – Luminous Reflection Logic
// Aligned with the subtle elegance of registration
// ---------------------------------------------------------

let userData = null;
let hasDateSet = null;
let isAdminMode = false;
let selectedTone = "fusion"; // default

/* — INITIALIZATION — */
window.addEventListener("load", () => {
  checkAuthAndSetup();
  initializeConsciousnessWaves();
  setTimeout(animateQuestions, 500);
  setupInteractions();
});

/* — CONSCIOUSNESS WAVES (like registration) — */
function initializeConsciousnessWaves() {
  // Create waves container
  const wavesContainer = document.createElement("div");
  wavesContainer.className = "consciousness-waves";

  // Create 2 waves for subtle movement
  for (let i = 0; i < 2; i++) {
    const wave = document.createElement("div");
    wave.className = "wave";
    wavesContainer.appendChild(wave);
  }

  document.body.appendChild(wavesContainer);

  // Create particles
  const particlesContainer = document.createElement("div");
  particlesContainer.className = "cosmic-particles";

  for (let i = 0; i < 3; i++) {
    const particle = document.createElement("div");
    particle.className = "cosmic-particle";
    particlesContainer.appendChild(particle);
  }

  document.body.appendChild(particlesContainer);

  // Set initial tone
  document.body.classList.add(`tone-${selectedTone}`);
}

/* — AUTH CHECK — */
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

/* — SUBTLE QUESTION ANIMATION — */
function animateQuestions() {
  document.querySelectorAll(".question-group").forEach((q, i) => {
    setTimeout(() => {
      q.classList.add("visible");
    }, i * 200);
  });
}

/* — TONE & INTERACTION SETUP — */
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

  /* Form Submission */
  document
    .getElementById("reflectionForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      // Transition to loading
      showSection("loading");

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

/* — SUBTLE TONE TRANSITION — */
function transitionToTone(newTone) {
  // Simply switch tone classes
  document.body.classList.remove("tone-gentle", "tone-intense", "tone-fusion");
  document.body.classList.add(`tone-${newTone}`);
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

/* — SUBTLE CURSOR INTERACTION — */
document.addEventListener("mousemove", (e) => {
  const mouseX = e.clientX / window.innerWidth;
  const mouseY = e.clientY / window.innerHeight;

  // Update CSS variables for subtle following
  document.documentElement.style.setProperty("--mouse-x", mouseX);
  document.documentElement.style.setProperty("--mouse-y", mouseY);
});

/* — SUBTLE BREATHING FOR QUESTIONS — */
window.addEventListener("load", () => {
  // Add gentle breathing to questions after they appear
  setTimeout(() => {
    document.querySelectorAll(".question-group").forEach((q, i) => {
      q.style.animation = `subtleBreathe ${8 + i * 2}s ease-in-out infinite`;
      q.style.animationDelay = `${i * 0.5}s`;
    });
  }, 2000);
});

/* — BREATHING ANIMATION — */
const breathingStyles = document.createElement("style");
breathingStyles.textContent = `
  @keyframes subtleBreathe {
    0%, 100% {
      transform: translateY(0) scale(1);
      box-shadow: 0 0 0 rgba(255, 255, 255, 0);
    }
    50% {
      transform: translateY(-2px) scale(1.005);
      box-shadow: 0 5px 20px rgba(255, 255, 255, 0.03);
    }
  }
  
  /* Subtle hover states */
  .question-group {
    transition: all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
  }
  
  .question-group:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.12);
  }
  
  /* Smooth tone transitions */
  body {
    transition: background 1.2s ease;
  }
  
  .wave {
    transition: all 1.5s ease;
  }
`;
document.head.appendChild(breathingStyles);
