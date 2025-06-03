// Transition - Breathing to Reflection

// Activate click-anywhere once indicator shows
setTimeout(() => {
  document.body.addEventListener("click", proceed);
  document.body.style.cursor = "pointer";
}, 8500);

// Auto-proceed after 12 seconds total
setTimeout(proceed, 12000);

function proceed() {
  const qs = new URLSearchParams(location.search);
  const payment = qs.get("payment") || "paypal";
  window.location.href = `../mirror/reflection.html?payment=${payment}&verified=true&lang=en`;
}

// Subtle interaction feedback
document.addEventListener("mousemove", (e) => {
  const circles = document.querySelectorAll(".breathing-circle");
  const mouseX = e.clientX / window.innerWidth;
  const mouseY = e.clientY / window.innerHeight;

  circles.forEach((circle, i) => {
    const offset = (i + 1) * 2;
    const moveX = (mouseX - 0.5) * offset;
    const moveY = (mouseY - 0.5) * offset;
    circle.style.transform = `translate(${moveX}px, ${moveY}px)`;
  });
});
