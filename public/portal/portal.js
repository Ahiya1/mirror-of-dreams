// Portal - Sacred Access Logic

const mirrorsContainer = document.getElementById("mirrorsContainer");
const reflectBtn = document.querySelector(".reflect-button");

let pressTimer = null;
let pressStartTime = 0;

// Secret creator bypass - hold for 8.3 seconds
reflectBtn.addEventListener("mousedown", startPress);
reflectBtn.addEventListener("touchstart", startPress);
reflectBtn.addEventListener("mouseup", endPress);
reflectBtn.addEventListener("mouseleave", endPress);
reflectBtn.addEventListener("touchend", endPress);
reflectBtn.addEventListener("touchcancel", endPress);

function startPress(e) {
  e.preventDefault();
  pressStartTime = Date.now();
  pressTimer = setTimeout(showSecretBypass, 8300);
}

function endPress(e) {
  const pressDuration = Date.now() - pressStartTime;
  if (pressTimer) {
    clearTimeout(pressTimer);
    pressTimer = null;
  }

  if (pressDuration < 8300) {
    return true;
  }
}

async function showSecretBypass() {
  const password = prompt("🪞 Creator Access\nEnter the sacred key:");
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
        location.href = `../transition/breathing.html?payment=creator&verified=true&lang=en`;
      } else {
        alert("🪞 Invalid sacred key");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      alert("🪞 Authentication failed");
    }
  }
}

// Mirror hover interaction
reflectBtn.addEventListener("mouseenter", () =>
  mirrorsContainer.classList.add("hover")
);

reflectBtn.addEventListener("mouseleave", () =>
  mirrorsContainer.classList.remove("hover")
);
