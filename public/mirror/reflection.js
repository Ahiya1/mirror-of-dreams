// Mirror - Reflection Experience

let userData = null;
let hasDateSet = null;
let isAdminMode = false;

// Initialize
window.addEventListener("load", () => {
  checkAuthAndSetup();
  setTimeout(animateQuestions, 300);
  setupInteractions();
});

function checkAuthAndSetup() {
  // Check for admin mode
  const url = new URLSearchParams(location.search);
  if (url.get("admin") === "true") {
    isAdminMode = true;
    document.getElementById("adminNotice").style.display = "block";
  }

  // Check for verified user
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

function setupInteractions() {
  // Yes/No buttons
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

  // Form submission
  document
    .getElementById("reflectionForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      showSection("loading");

      const formData = new FormData(e.target);

      // Check if user is creator
      let creatorContext = null;
      let isCreatorMode = false;

      if (userData?.isCreator) {
        isCreatorMode = true;
        const storedContext = localStorage.getItem("mirrorCreatorContext");
        if (storedContext) {
          try {
            creatorContext = JSON.parse(storedContext);
          } catch (e) {
            console.warn("Failed to parse creator context:", e);
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
        creatorContext: creatorContext,
      };

      try {
        const response = await fetch("/api/reflection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Reflection failed");
        }

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
    .then((response) => response.json())
    .then((data) => {
      alert(
        data.success
          ? "Reflection sent to your email."
          : "There was an issue sending."
      );
    })
    .catch(() => alert("Error sending."));
}
