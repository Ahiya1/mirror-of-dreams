// Transition - Breathing to Reflection

// Activate click-anywhere once indicator shows (after 23 seconds)
setTimeout(() => {
  document.body.addEventListener("click", proceed);
  document.body.style.cursor = "pointer";
}, 23500);

// Auto-proceed after 30 seconds total for the complete experience
setTimeout(proceed, 30000);

function proceed() {
  const qs = new URLSearchParams(location.search);
  const payment = qs.get("payment") || "paypal";
  window.location.href = `../mirror/reflection.html?payment=${payment}&verified=true&lang=en`;
}

// Subtle interaction feedback with breathing circles
document.addEventListener("mousemove", (e) => {
  const circles = document.querySelectorAll(".breathing-circle");
  const mouseX = e.clientX / window.innerWidth;
  const mouseY = e.clientY / window.innerHeight;

  circles.forEach((circle, i) => {
    const offset = (i + 1) * 1.5; // More subtle movement
    const moveX = (mouseX - 0.5) * offset;
    const moveY = (mouseY - 0.5) * offset;
    circle.style.transform = `translate(${moveX}px, ${moveY}px)`;
  });
});

// Gentle breathing sound visualization
let breathPhase = 0;
setInterval(() => {
  breathPhase = (breathPhase + 0.1) % (Math.PI * 2);
  const scale = 1 + Math.sin(breathPhase) * 0.02;
  document.querySelector(".geometry-layer").style.transform = `scale(${scale})`;
}, 50);

// Special effect when "what now?" appears
setTimeout(() => {
  // Create a subtle radial pulse
  const pulse = document.createElement("div");
  pulse.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      pointer-events: none;
      z-index: 5;
      animation: whatNowPulse 3s ease-out forwards;
    `;
  document.body.appendChild(pulse);

  // Remove after animation
  setTimeout(() => pulse.remove(), 3000);
}, 20000);

// Add the pulse animation
const style = document.createElement("style");
style.textContent = `
    @keyframes whatNowPulse {
      0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 0;
      }
      50% {
        opacity: 0.5;
      }
      100% {
        transform: translate(-50%, -50%) scale(3);
        opacity: 0;
      }
    }
  `;
document.head.appendChild(style);
