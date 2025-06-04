// Enhanced Admin Security - admin.js

let adminData = null;
let authKey = null;
let currentTab = "overview";
let filteredReceipts = [];
let authAttempts = 0;
let lastAttemptTime = 0;

// Security constants
const MAX_AUTH_ATTEMPTS = 3;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour

// Initialize with security checks
window.addEventListener("load", () => {
  checkSecurityLockout();
  checkExistingAuth();
  setupSecurityMonitoring();
});

// Security monitoring
function setupSecurityMonitoring() {
  // Monitor for suspicious activity
  let suspiciousPatterns = 0;

  // Check URL manipulation attempts
  const url = window.location.href.toLowerCase();
  const suspiciousParams = [
    "debug",
    "test",
    "dev",
    "bypass",
    "hack",
    "admin=true",
  ];

  suspiciousParams.forEach((param) => {
    if (url.includes(param)) {
      suspiciousPatterns++;
    }
  });

  // Log suspicious activity
  if (suspiciousPatterns > 0) {
    console.log(
      `🔒 Security: ${suspiciousPatterns} suspicious patterns detected`
    );
    logSecurityEvent("URL_MANIPULATION_ATTEMPT", {
      patterns: suspiciousPatterns,
    });
  }

  // Monitor console access attempts
  const originalConsole = console.log;
  console.log = function (...args) {
    if (args.some((arg) => typeof arg === "string" && arg.includes("admin"))) {
      logSecurityEvent("CONSOLE_ADMIN_ACCESS_ATTEMPT");
    }
    originalConsole.apply(console, args);
  };
}

// Security lockout check
function checkSecurityLockout() {
  const lockoutData = JSON.parse(localStorage.getItem("adminLockout") || "{}");

  if (lockoutData.lockedUntil && Date.now() < lockoutData.lockedUntil) {
    const remainingTime = Math.ceil(
      (lockoutData.lockedUntil - Date.now()) / (1000 * 60)
    );
    showSecurityLockout(remainingTime);
    return true;
  }

  // Clear expired lockout
  if (lockoutData.lockedUntil && Date.now() >= lockoutData.lockedUntil) {
    localStorage.removeItem("adminLockout");
    authAttempts = 0;
  } else {
    authAttempts = lockoutData.attempts || 0;
  }

  return false;
}

// Enhanced authentication with rate limiting
async function authenticate() {
  if (checkSecurityLockout()) return;

  const password = document.getElementById("authPassword").value.trim();
  const errorDiv = document.getElementById("authError");

  if (!password) {
    showAuthError("Sacred key required");
    return;
  }

  // Rate limiting check
  const now = Date.now();
  if (now - lastAttemptTime < 2000) {
    // 2 second minimum between attempts
    showAuthError("Please wait before trying again");
    return;
  }
  lastAttemptTime = now;

  try {
    // Add timing variation to prevent timing attacks
    const startTime = Date.now();

    const response = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "authenticate",
        password,
        timestamp: now,
        clientInfo: {
          userAgent: navigator.userAgent.substring(0, 100), // Limited info
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      }),
    });

    // Ensure minimum response time to prevent timing attacks
    const elapsed = Date.now() - startTime;
    if (elapsed < 1000) {
      await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
    }

    const result = await response.json();

    if (result.success) {
      authKey = password;
      authAttempts = 0;
      localStorage.removeItem("adminLockout");

      // Set session with timeout
      const sessionData = {
        key: password,
        timestamp: Date.now(),
        expires: Date.now() + SESSION_TIMEOUT,
      };
      sessionStorage.setItem("mirrorAuthSession", JSON.stringify(sessionData));

      showAdminInterface();
      await loadAdminData();
      setInterval(loadAdminData, 30000); // Check every 30 seconds

      logSecurityEvent("SUCCESSFUL_ADMIN_LOGIN");
    } else {
      handleFailedAuth();
    }
  } catch (error) {
    console.error("Auth error:", error);
    handleFailedAuth("Sacred realm temporarily unavailable");
    updateConnectionStatus(false);
  }
}

// Handle failed authentication with progressive penalties
function handleFailedAuth(customMessage = null) {
  authAttempts++;

  const lockoutData = {
    attempts: authAttempts,
    lastAttempt: Date.now(),
  };

  logSecurityEvent("FAILED_ADMIN_LOGIN_ATTEMPT", { attempt: authAttempts });

  if (authAttempts >= MAX_AUTH_ATTEMPTS) {
    lockoutData.lockedUntil = Date.now() + LOCKOUT_DURATION;
    localStorage.setItem("adminLockout", JSON.stringify(lockoutData));
    showSecurityLockout(15);
    logSecurityEvent("ADMIN_ACCOUNT_LOCKED");
  } else {
    localStorage.setItem("adminLockout", JSON.stringify(lockoutData));
    const remaining = MAX_AUTH_ATTEMPTS - authAttempts;
    showAuthError(
      customMessage ||
        `Invalid sacred key. ${remaining} attempt${
          remaining === 1 ? "" : "s"
        } remaining.`
    );
  }

  document.getElementById("authPassword").value = "";
}

// Show security lockout screen
function showSecurityLockout(minutes) {
  const authScreen = document.getElementById("authScreen");
  authScreen.innerHTML = `
    <div class="auth-card">
      <h1 class="auth-title">🔒 Sacred Protection</h1>
      <p class="auth-subtitle">Too many attempts detected</p>
      <div style="padding: 2rem; text-align: center; color: rgba(255,255,255,0.8);">
        <p style="margin-bottom: 1rem;">The mirror is protecting itself from unauthorized access.</p>
        <p style="font-size: 1.2rem; color: #fbbf24; margin-bottom: 1rem;">${minutes} minutes remaining</p>
        <p style="font-size: 0.9rem; opacity: 0.7;">This protection serves the sacred nature of the work.</p>
      </div>
    </div>
  `;

  // Auto-refresh when lockout expires
  setTimeout(() => {
    window.location.reload();
  }, minutes * 60 * 1000);
}

// Enhanced session management
async function checkExistingAuth() {
  if (checkSecurityLockout()) return;

  const sessionData = JSON.parse(
    sessionStorage.getItem("mirrorAuthSession") || "{}"
  );

  if (sessionData.key && sessionData.expires > Date.now()) {
    try {
      const response = await fetch(
        `/api/admin?action=auth&key=${encodeURIComponent(sessionData.key)}`
      );

      if (response.ok) {
        authKey = sessionData.key;
        showAdminInterface();
        loadAdminData();
        setInterval(loadAdminData, 30000);

        // Extend session
        sessionData.expires = Date.now() + SESSION_TIMEOUT;
        sessionStorage.setItem(
          "mirrorAuthSession",
          JSON.stringify(sessionData)
        );

        logSecurityEvent("SESSION_RESTORED");
      } else {
        sessionStorage.removeItem("mirrorAuthSession");
      }
    } catch (error) {
      console.error("Session check error:", error);
      sessionStorage.removeItem("mirrorAuthSession");
      updateConnectionStatus(false);
    }
  }

  // Auto-focus auth input after security checks
  setTimeout(() => {
    if (!authKey) {
      document.getElementById("authPassword")?.focus();
    }
  }, 500);
}

// Security event logging
function logSecurityEvent(eventType, details = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event: eventType,
    details,
    userAgent: navigator.userAgent.substring(0, 50),
    url: window.location.href,
  };

  // Store in session storage for debugging (not persistent)
  const logs = JSON.parse(sessionStorage.getItem("securityLogs") || "[]");
  logs.push(logEntry);

  // Keep only last 50 events
  if (logs.length > 50) {
    logs.splice(0, logs.length - 50);
  }

  sessionStorage.setItem("securityLogs", JSON.stringify(logs));

  // In production, you might want to send critical events to a logging service
  if (
    ["ADMIN_ACCOUNT_LOCKED", "MULTIPLE_FAILED_ATTEMPTS"].includes(eventType)
  ) {
    console.warn(`🔒 Security Event: ${eventType}`, details);
  }
}

// Session timeout handling
function setupSessionTimeout() {
  let timeoutWarning;
  let sessionTimeout;

  function resetSessionTimer() {
    clearTimeout(timeoutWarning);
    clearTimeout(sessionTimeout);

    // Warn 5 minutes before timeout
    timeoutWarning = setTimeout(() => {
      if (confirm("Your session will expire in 5 minutes. Continue working?")) {
        extendSession();
      }
    }, SESSION_TIMEOUT - 5 * 60 * 1000);

    // Auto-logout after timeout
    sessionTimeout = setTimeout(() => {
      logSecurityEvent("SESSION_EXPIRED");
      sessionStorage.removeItem("mirrorAuthSession");
      alert("Session expired for security. Please log in again.");
      window.location.reload();
    }, SESSION_TIMEOUT);
  }

  function extendSession() {
    const sessionData = JSON.parse(
      sessionStorage.getItem("mirrorAuthSession") || "{}"
    );
    if (sessionData.key) {
      sessionData.expires = Date.now() + SESSION_TIMEOUT;
      sessionStorage.setItem("mirrorAuthSession", JSON.stringify(sessionData));
      resetSessionTimer();
      logSecurityEvent("SESSION_EXTENDED");
    }
  }

  // Reset timer on user activity
  document.addEventListener("click", resetSessionTimer);
  document.addEventListener("keypress", resetSessionTimer);

  resetSessionTimer();
}

// Enhanced error display
function showAuthError(message) {
  const errorDiv = document.getElementById("authError");
  errorDiv.textContent = message;
  errorDiv.style.display = "block";

  // Auto-hide after 5 seconds
  setTimeout(() => {
    errorDiv.style.display = "none";
  }, 5000);

  document.getElementById("authPassword").value = "";
  document.getElementById("authPassword").focus();
}

// Initialize session management after successful auth
function showAdminInterface() {
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("adminInterface").classList.add("visible");
  updateConnectionStatus(true);
  setupSessionTimeout();
}

// The rest of your existing admin functions remain the same...
// (loadAdminData, updateStats, etc. - keeping them as they were)

// Enhanced keyboard shortcuts with security
document.addEventListener("keydown", (e) => {
  // Disable common dev shortcuts in production
  if (
    e.key === "F12" ||
    (e.ctrlKey && e.shiftKey && e.key === "I") ||
    (e.ctrlKey && e.shiftKey && e.key === "C") ||
    (e.ctrlKey && e.key === "u")
  ) {
    if (!authKey) {
      e.preventDefault();
      logSecurityEvent("DEV_TOOLS_ATTEMPT");
      return false;
    }
  }

  if (e.key === "Escape") {
    document.querySelectorAll(".modal.show").forEach((modal) => {
      modal.classList.remove("show");
    });
  }
});

// Auth form keyboard handling
document.addEventListener("keypress", (e) => {
  if (e.target.id === "authPassword" && e.key === "Enter") {
    authenticate();
  }
});
