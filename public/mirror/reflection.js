// Mirror – Reflection Logic (impulse particles + tone fade)
// ---------------------------------------------------------

let userData = null;
let hasDateSet = null;
let isAdminMode = false;
let selectedTone = "fusion"; // default
let particleTimer = null; // interval id for particle spawning

/* — Init — */
window.addEventListener("load", () => {
  checkAuthAndSetup();
  setTimeout(animateQuestions, 300);
  setupInteractions();
  startParticles(selectedTone); // initial field
});

/* — Auth check (unchanged) — */
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

/* — Question rise animation — */
function animateQuestions() {
  document.querySelectorAll(".question-group").forEach((q, i) => {
    setTimeout(() => q.classList.add("visible"), i * 200);
  });
}

/* — Tone / Yes-No / Form interactions — */
function setupInteractions() {
  /* Tone picker */
  document.querySelectorAll(".tone-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      this.parentNode
        .querySelectorAll(".tone-btn")
        .forEach((b) => b.classList.remove("selected"));
      this.classList.add("selected");

      const newTone = this.dataset.tone || "fusion";
      if (newTone === selectedTone) return;

      selectedTone = newTone;
      bodyToneSwap(newTone);
      startParticles(newTone);
    });
  });

  /* Yes/No */
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

  /* Form submit (unchanged except payload tone) */
  document
    .getElementById("reflectionForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
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

/* — Fade-swap helper — */
function bodyToneSwap(newTone) {
  document.body.classList.add("fade-transition", "fade-out");
  setTimeout(() => {
    document.body.classList.remove(
      "tone-gentle",
      "tone-intense",
      "tone-fusion"
    );
    document.body.classList.add(`tone-${newTone}`);
    document.body.classList.remove("fade-out");
    document.body.classList.add("fade-in");
    setTimeout(
      () => document.body.classList.remove("fade-transition", "fade-in"),
      800
    );
  }, 60);
}

/* — Particle system — */
function startParticles(mode) {
  if (particleTimer) clearInterval(particleTimer);

  const spawn = () => spawnParticle(mode);

  /* gentle: slower, intense: quicker, fusion: medium */
  let rate = 1800;
  if (mode === "gentle") rate = 2200;
  if (mode === "intense") rate = 900;

  spawn(); // immediate first
  particleTimer = setInterval(spawn, rate);
}

function spawnParticle(mode) {
  /* decide type based on mode */
  let type;
  if (mode === "gentle") {
    type = Math.random() < 0.35 ? "breath" : "star";
  } else if (mode === "intense") {
    type = "ember";
  } else {
    /* fusion */
    type = Math.random() < 0.5 ? "ember" : "breath";
  }

  const el = document.createElement("div");
  el.className = `particle particle-${type}`;

  /* random position */
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (type === "ember") {
    /* start near bottom centre, drift up-right with random vector */
    el.style.left = vw * 0.4 + Math.random() * vw * 0.2 + "px";
    el.style.top = vh * 0.75 + Math.random() * vh * 0.15 + "px";
    const dx = 50 + Math.random() * 120;
    const dy = 150 + Math.random() * 180;
    el.style.setProperty("--dx", dx);
    el.style.setProperty("--dy", -dy);
  } else if (type === "breath") {
    /* breathe near centre-ish */
    el.style.left = vw * 0.3 + Math.random() * vw * 0.4 + "px";
    el.style.top = vh * 0.3 + Math.random() * vh * 0.4 + "px";
  } else {
    /* star */
    el.style.left = Math.random() * vw + "px";
    el.style.top = Math.random() * vh + "px";
  }

  document.body.appendChild(el);
  el.addEventListener("animationend", () => el.remove());
}

/* — Simple section show utility (unchanged) — */
function showSection(id) {
  document.querySelectorAll(".experience-section").forEach((sec) => {
    sec.classList.remove("active");
    setTimeout(() => sec.classList.add("hidden"), 300);
  });
  setTimeout(() => {
    document
      .querySelectorAll(".experience-section")
      .forEach((s) => s.classList.add("hidden"));
    const sec = document.getElementById(id);
    sec.classList.remove("hidden");
    setTimeout(() => sec.classList.add("active"), 50);
  }, 300);
}

/* — Email helper (unchanged) — */
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
    .then((d) => alert(d.success ? "Reflection sent." : "Issue sending."))
    .catch(() => alert("Error sending."));
}
