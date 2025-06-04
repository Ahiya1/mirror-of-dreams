// Mirror – Reflection Logic (multi-tone, fade transitions)
// -------------------------------------------------------

let userData = null;
let hasDateSet = null;
let isAdminMode = false;
let selectedTone = "fusion"; // default → Let the Mirror Breathe

// ─── Initialisation ───────────────────────────────────────────
window.addEventListener("load", () => {
  checkAuthAndSetup();
  setTimeout(animateQuestions, 300);
  setupInteractions();
});

// ─── Auth / stored user check ─────────────────────────────────
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
      console.error("Error parsing user data:", e);
      location.href = "../commitment/register.html";
    }
  } else if (!isAdminMode) {
    location.href = "../commitment/register.html";
  }
}

// ─── Section transitions ─────────────────────────────────────
function showSection(id) {
  document.querySelectorAll(".experience-section").forEach((sec) => {
    sec.classList.remove("active");
    setTimeout(() => sec.classList.add("hidden"), 300);
  });

  setTimeout(() => {
    document
      .querySelectorAll(".experience-section")
      .forEach((s) => s.classList.add("hidden"));
    const section = document.getElementById(id);
    section.classList.remove("hidden");
    setTimeout(() => section.classList.add("active"), 50);
  }, 300);
}

function animateQuestions() {
  document.querySelectorAll(".question-group").forEach((q, i) => {
    setTimeout(() => q.classList.add("visible"), i * 200);
  });
}

// ─── UI interactions (tone, yes/no, form) ─────────────────────
function setupInteractions() {
  /* Tone picker – adds a gentle fade-over when switching background */
  document.querySelectorAll(".tone-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      // visual toggle
      this.parentNode
        .querySelectorAll(".tone-btn")
        .forEach((b) => b.classList.remove("selected"));
      this.classList.add("selected");

      const newTone = this.dataset.tone || "fusion";
      if (newTone === selectedTone) return; // no change

      selectedTone = newTone;

      // Begin fade-out
      document.body.classList.add("fade-transition", "fade-out");

      setTimeout(() => {
        // swap tone classes
        document.body.classList.remove(
          "tone-gentle",
          "tone-intense",
          "tone-fusion"
        );
        document.body.classList.add(`tone-${selectedTone}`);

        // fade back in
        document.body.classList.remove("fade-out");
        document.body.classList.add("fade-in");

        // clean up after animation completes
        setTimeout(() => {
          document.body.classList.remove("fade-transition", "fade-in");
        }, 800);
      }, 60); // slight delay so fade-out class takes effect
    });
  });

  /* Yes / No picker */
  document.querySelectorAll(".yes-no-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      this.parentNode
        .querySelectorAll(".yes-no-btn")
        .forEach((b) => b.classList.remove("selected"));
      this.classList.add("selected");

      hasDateSet = this.dataset.value;
      document.querySelector('input[name="hasDate"]').value = hasDateSet;

      const dateContainer = document.getElementById("dateContainer");
      const dateInput = dateContainer.querySelector("input");

      if (hasDateSet === "yes") {
        dateContainer.style.display = "flex";
        dateInput.required = true;
      } else {
        dateContainer.style.display = "none";
        dateInput.required = false;
        dateInput.value = "";
      }
    });
  });

  /* Form submission */
  document
    .getElementById("reflectionForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      showSection("loading");

      const formData = new FormData(e.target);

      // Creator mode?
      let creatorContext = null;
      let isCreatorMode = false;
      if (userData?.isCreator) {
        isCreatorMode = true;
        const storedCtx = localStorage.getItem("mirrorCreatorContext");
        if (storedCtx) {
          try {
            creatorContext = JSON.parse(storedCtx);
          } catch (err) {
            console.warn("Creator context parse error:", err);
          }
        }
      }

      const payload = {
        dream: formData.get("dream"),
        plan: formData.get("plan"),
        hasDate: formData.get("hasDate"),
        dreamDate: formData.get("dreamDate"),
        relationship: formData.get("relationship"),
        offering: formData.get("offering"),
        userName: userData?.name || "Friend",
        userEmail: userData?.email || "",
        language: "en",
        isAdmin: isAdminMode,
        isCreator: isCreatorMode,
        creatorContext,
        tone: selectedTone || "fusion",
      };

      try {
        const res = await fetch("/api/reflection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json();

        if (!result.success)
          throw new Error(result.error || "Reflection failed");

        document.getElementById("reflectionContent").innerHTML =
          result.reflection;
        showSection("results");
      } catch (err) {
        console.error("Reflection error:", err);
        document.getElementById("reflectionContent").innerHTML = `
          <h2>A moment of silence…</h2>
          <p>Your reflection is being prepared. Please try again in a moment.</p>
          <p style="opacity:.7;font-style:italic;">Sometimes the deepest truth needs space to emerge.</p>
        `;
        showSection("results");
      }
    });
}

// ─── Email reflection helper ─────────────────────────────────¬
function emailReflection() {
  if (!userData?.email) {
    const email = prompt("Enter your email to receive this reflection:");
    if (!email) return;
    userData = { ...userData, email };
  }

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
    .then((data) => {
      alert(
        data.success
          ? "Reflection sent to your email."
          : "There was an issue sending."
      );
    })
    .catch(() => alert("Error sending."));
}
