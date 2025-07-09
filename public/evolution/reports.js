// Sacred Evolution Reports - Consciousness Tracking Interface
// Complete interactive functionality for evolution analytics

let currentUser = null;
let currentReport = null;
let allReports = [];
let isGenerating = false;
let evolutionEligibility = null;

// Report display states
const DISPLAY_STATES = {
  LOADING: "loading",
  ERROR: "error",
  CONTENT: "content",
};

// Initialize evolution interface on page load
window.addEventListener("load", initializeEvolution);

async function initializeEvolution() {
  try {
    await authenticateUser();
    await checkEvolutionEligibility();
    await loadEvolutionData();
    setupInteractions();
    handleUrlParameters();
  } catch (error) {
    console.error("🦋 Evolution initialization failed:", error);
    showErrorState("Failed to load evolution interface");
  }
}

// ╭─ AUTHENTICATION & USER MANAGEMENT ────────────────────────╮
async function authenticateUser() {
  const token = localStorage.getItem("mirror_auth_token");

  if (!token) {
    throw new Error("Authentication required");
  }

  try {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: "verify-token" }),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Token verification failed");
    }

    currentUser = data.user;

    console.log(
      `🦋 Evolution loaded for: ${currentUser.email} (${currentUser.tier})`
    );
  } catch (error) {
    console.error("🦋 Authentication error:", error);
    handleAuthenticationError();
    throw error;
  }
}

async function checkEvolutionEligibility() {
  try {
    const token = localStorage.getItem("mirror_auth_token");

    const response = await fetch("/api/evolution?action=check-eligibility", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        evolutionEligibility = data;

        // Show error if user not eligible
        if (!data.eligible) {
          if (data.upgradeRequired) {
            showErrorState(
              "Evolution reports require Essential or Premium subscription",
              "Upgrade to unlock consciousness evolution tracking",
              [
                { text: "Upgrade Now", href: "/register", primary: true },
                { text: "Return to Dashboard", href: "/dashboard" },
              ]
            );
          } else {
            showErrorState(
              `Need ${
                data.requiredReflections - data.currentReflections
              } more reflections`,
              `Create ${
                data.requiredReflections - data.currentReflections
              } more reflection${
                data.requiredReflections - data.currentReflections === 1
                  ? ""
                  : "s"
              } to unlock your ${data.tier} evolution report`,
              [
                {
                  text: "Create Reflection",
                  href: "/reflection",
                  primary: true,
                },
                { text: "Return to Dashboard", href: "/dashboard" },
              ]
            );
          }
          return;
        }
      }
    }
  } catch (error) {
    console.error("🦋 Eligibility check failed:", error);
  }
}

// ╭─ DATA LOADING ─────────────────────────────────────────────╮
async function loadEvolutionData() {
  if (!evolutionEligibility?.eligible) {
    return; // Skip loading if not eligible
  }

  setDisplayState(DISPLAY_STATES.LOADING);

  try {
    // Load all evolution reports
    await loadEvolutionReports();

    // If we have reports, show the interface
    if (allReports.length > 0) {
      setDisplayState(DISPLAY_STATES.CONTENT);
      updateSidebar();

      // Load most recent report by default
      if (!currentReport) {
        await loadReport(allReports[0].id);
      }
    } else {
      // No reports exist, show generation prompt
      showGenerationPrompt();
    }
  } catch (error) {
    console.error("🦋 Failed to load evolution data:", error);
    showErrorState("Failed to load evolution reports");
  }
}

async function loadEvolutionReports() {
  const token = localStorage.getItem("mirror_auth_token");

  const response = await fetch("/api/evolution?action=get-reports&limit=20", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    const data = await response.json();
    if (data.success) {
      allReports = data.reports || [];
    }
  }
}

async function loadReport(reportId) {
  const token = localStorage.getItem("mirror_auth_token");

  try {
    const response = await fetch(
      `/api/evolution?action=get-report&id=${reportId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        currentReport = data.report;
        displayReport(currentReport);
        updateSidebarSelection(reportId);
        updateUrl(reportId);
        return;
      }
    }

    throw new Error("Failed to load report");
  } catch (error) {
    console.error("🦋 Failed to load report:", error);
    showToast("Failed to load evolution report", "error");
  }
}

// ╭─ REPORT DISPLAY ───────────────────────────────────────────╮
function displayReport(report) {
  // Update header metadata
  updateReportHeader(report);

  // Display analysis with typing effect
  displayAnalysis(report.analysis);

  // Show patterns
  displayPatterns(report.patterns);

  // Show growth visualization
  displayGrowthVisualization(report);

  // Show insights
  displayInsights(report.insights);
}

function updateReportHeader(report) {
  // Growth score
  document.getElementById("growthScore").textContent =
    report.growthScore || "--";

  // Reflections analyzed
  document.getElementById("reflectionsAnalyzed").textContent =
    report.reflectionCount || "--";

  // Report date
  const reportDate = new Date(report.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  document.getElementById("reportDate").textContent = reportDate;

  // Time period
  if (report.timePeriod) {
    const startDate = new Date(report.timePeriod.start).toLocaleDateString(
      "en-US",
      { month: "short", day: "numeric" }
    );
    const endDate = new Date(report.timePeriod.end).toLocaleDateString(
      "en-US",
      { month: "short", day: "numeric" }
    );
    document.getElementById(
      "timePeriodText"
    ).textContent = `${startDate} - ${endDate}`;
  }

  // Report type badge
  const badge = document.getElementById("reportTypeBadge");
  badge.textContent = `${
    report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1)
  } Report`;
  badge.className = `report-type-badge ${report.reportType}`;
}

function displayAnalysis(analysisText) {
  const analysisContainer = document.getElementById("mirrorAnalysis");

  // Clear loading state
  analysisContainer.innerHTML = "";

  // Create analysis content with typing effect
  const analysisDiv = document.createElement("div");
  analysisDiv.className = "analysis-text";
  analysisContainer.appendChild(analysisDiv);

  // Type out the analysis text
  typeText(analysisDiv, analysisText, 30); // 30ms delay between characters
}

function displayPatterns(patterns) {
  const patternsGrid = document.getElementById("patternsGrid");
  patternsGrid.innerHTML = "";

  if (!patterns || patterns.length === 0) {
    patternsGrid.innerHTML = `
      <div class="pattern-placeholder">
        <div class="pattern-icon">🌱</div>
        <div class="pattern-text">Your unique patterns are still emerging...</div>
      </div>
    `;
    return;
  }

  patterns.forEach((pattern, index) => {
    const patternCard = createPatternCard(pattern, index);
    patternsGrid.appendChild(patternCard);
  });
}

function createPatternCard(pattern, index) {
  const card = document.createElement("div");
  card.className = "pattern-card";
  card.style.animationDelay = `${index * 0.1}s`;

  const patternInfo = getPatternInfo(pattern);

  card.innerHTML = `
    <div class="pattern-header">
      <div class="pattern-icon">${patternInfo.icon}</div>
      <div class="pattern-title">${patternInfo.title}</div>
    </div>
    <div class="pattern-description">${patternInfo.description}</div>
    <div class="pattern-frequency">${patternInfo.frequency}</div>
  `;

  return card;
}

function getPatternInfo(pattern) {
  // Extract pattern type and count from API format (e.g., "business_3")
  const [type, count] = pattern.includes("_")
    ? pattern.split("_")
    : [pattern, 1];

  const patternMap = {
    business: {
      icon: "💼",
      title: "Entrepreneurial Spirit",
      description:
        "You consistently explore business ventures and creative independence.",
      getFrequency: (c) => `${c} reflection${c === 1 ? "" : "s"}`,
    },
    creativity: {
      icon: "🎨",
      title: "Creative Expression",
      description: "Your artistic and creative impulses guide your journey.",
      getFrequency: (c) => `${c} reflection${c === 1 ? "" : "s"}`,
    },
    relationships: {
      icon: "💝",
      title: "Connection & Love",
      description:
        "Deep relationships and meaningful connections drive your choices.",
      getFrequency: (c) => `${c} reflection${c === 1 ? "" : "s"}`,
    },
    independence: {
      icon: "🗽",
      title: "Freedom Seeking",
      description: "You value autonomy and creating your own path forward.",
      getFrequency: (c) => `${c} reflection${c === 1 ? "" : "s"}`,
    },
    uncertainty: {
      icon: "🌊",
      title: "Navigating Unknown",
      description: "You acknowledge fears while moving toward your dreams.",
      getFrequency: (c) => `${c} reflection${c === 1 ? "" : "s"}`,
    },
    confidence: {
      icon: "✨",
      title: "Growing Certainty",
      description: "Your self-trust and confidence are expanding over time.",
      getFrequency: (c) => `${c} reflection${c === 1 ? "" : "s"}`,
    },
  };

  const info = patternMap[type] || {
    icon: "🔮",
    title: "Unique Pattern",
    description: "A distinctive theme in your consciousness evolution.",
    getFrequency: (c) => `Emerging`,
  };

  return {
    ...info,
    frequency: info.getFrequency(parseInt(count) || 1),
  };
}

function displayGrowthVisualization(report) {
  const chartContainer = document.getElementById("growthChart");

  // For now, create a simple visualization
  // In a full implementation, you might use Chart.js or D3.js
  chartContainer.innerHTML = `
    <div class="simple-growth-chart">
      <div class="growth-score-display">
        <div class="score-circle">
          <div class="score-value">${report.growthScore}</div>
          <div class="score-label">Growth Score</div>
        </div>
      </div>
      <div class="growth-indicators">
        <div class="indicator">
          <div class="indicator-icon">📈</div>
          <div class="indicator-text">
            <div class="indicator-title">Reflection Frequency</div>
            <div class="indicator-value">${
              report.reflectionCount
            } analyzed</div>
          </div>
        </div>
        <div class="indicator">
          <div class="indicator-icon">🌱</div>
          <div class="indicator-text">
            <div class="indicator-title">Pattern Diversity</div>
            <div class="indicator-value">${
              report.patterns?.length || 0
            } themes</div>
          </div>
        </div>
        <div class="indicator">
          <div class="indicator-icon">⏰</div>
          <div class="indicator-text">
            <div class="indicator-title">Evolution Period</div>
            <div class="indicator-value">${calculatePeriodLength(
              report.timePeriod
            )}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add CSS for the simple chart
  addSimpleChartStyles();
}

function displayInsights(insights) {
  const insightsGrid = document.getElementById("insightsGrid");
  insightsGrid.innerHTML = "";

  if (!insights || typeof insights !== "object") {
    insightsGrid.innerHTML = `
      <div class="insight-placeholder">
        <div class="insight-icon">💎</div>
        <div class="insight-text">Your wisdom insights are crystallizing...</div>
      </div>
    `;
    return;
  }

  // Generate insights from the structured data
  const insightCards = generateInsightCards(insights);

  insightCards.forEach((insight, index) => {
    const card = createInsightCard(insight, index);
    insightsGrid.appendChild(card);
  });
}

function generateInsightCards(insights) {
  const cards = [];

  // Time span insight
  if (insights.timeSpan) {
    cards.push({
      icon: "⏳",
      title: "Evolution Timespan",
      content: `Your consciousness has been evolving over ${insights.timeSpan.duration}, showing consistent growth patterns.`,
    });
  }

  // Growth indicators
  if (insights.growthIndicators?.includes("increasing_confidence")) {
    cards.push({
      icon: "🌅",
      title: "Rising Confidence",
      content:
        "Your recent reflections show increasing self-trust and certainty in your path.",
    });
  }

  // Theme evolution
  if (insights.themes?.length > 0) {
    cards.push({
      icon: "🧬",
      title: "Recurring Themes",
      content: `Your consciousness consistently returns to themes of growth, creativity, and authentic expression.`,
    });
  }

  // Progression notes
  if (insights.progressionNotes?.length > 0) {
    cards.push({
      icon: "📖",
      title: "Evolution Notes",
      content:
        "Your journey shows a natural progression from uncertainty to clarity, from seeking to knowing.",
    });
  }

  // Default wisdom insight if no specific insights
  if (cards.length === 0) {
    cards.push({
      icon: "🔮",
      title: "Emerging Wisdom",
      content:
        "Your unique patterns of growth are still crystallizing. Each reflection adds depth to your evolving story.",
    });
  }

  return cards;
}

function createInsightCard(insight, index) {
  const card = document.createElement("div");
  card.className = "insight-card";
  card.style.animationDelay = `${index * 0.1}s`;

  card.innerHTML = `
    <div class="insight-header">
      <div class="insight-icon">${insight.icon}</div>
      <div class="insight-title">${insight.title}</div>
    </div>
    <div class="insight-content">${insight.content}</div>
  `;

  return card;
}

// ╭─ REPORT GENERATION ────────────────────────────────────────╮
async function generateNewReport() {
  if (isGenerating) return;

  try {
    isGenerating = true;
    setDisplayState(DISPLAY_STATES.LOADING);

    const token = localStorage.getItem("mirror_auth_token");

    const response = await fetch("/api/evolution", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: "generate-report" }),
    });

    const data = await response.json();

    if (data.success) {
      // Report generated successfully
      currentReport = data.report;

      // Update reports list
      allReports.unshift(currentReport);

      // Display the new report
      setDisplayState(DISPLAY_STATES.CONTENT);
      displayReport(currentReport);
      updateSidebar();
      updateUrl(currentReport.id);

      showToast("Evolution report generated successfully!", "success");
    } else {
      throw new Error(data.error || "Failed to generate evolution report");
    }
  } catch (error) {
    console.error("🦋 Report generation error:", error);
    showErrorState("Failed to generate evolution report", error.message);
    showToast(
      "Failed to generate evolution report. Please try again.",
      "error"
    );
  } finally {
    isGenerating = false;
  }
}

function showGenerationPrompt() {
  setDisplayState(DISPLAY_STATES.CONTENT);

  const container = document.getElementById("evolutionContainer");
  container.innerHTML = `
    <div class="generation-prompt">
      <div class="prompt-content">
        <div class="prompt-icon">🦋</div>
        <h2 class="prompt-title">Begin Your Evolution Journey</h2>
        <p class="prompt-subtitle">
          Generate your first evolution report to witness patterns in your consciousness development.
        </p>
        <div class="prompt-info">
          <div class="info-item">
            <span class="info-icon">🌙</span>
            <span>${
              evolutionEligibility?.currentReflections || 0
            } reflections available for analysis</span>
          </div>
          <div class="info-item">
            <span class="info-icon">🔮</span>
            <span>${
              evolutionEligibility?.tier || "Essential"
            } evolution insights</span>
          </div>
        </div>
        <button class="generate-first-btn" onclick="generateNewReport()">
          <span>🦋</span>
          <span>Generate First Evolution Report</span>
        </button>
      </div>
    </div>
  `;

  // Add styles for generation prompt
  addGenerationPromptStyles();
}

// ╭─ SIDEBAR MANAGEMENT ───────────────────────────────────────╮
function updateSidebar() {
  const reportsList = document.getElementById("reportsList");

  if (allReports.length === 0) {
    reportsList.innerHTML = `
      <div class="reports-empty">
        <div class="empty-icon">🌱</div>
        <p>No evolution reports yet</p>
      </div>
    `;
    return;
  }

  reportsList.innerHTML = "";

  allReports.forEach((report) => {
    const reportItem = createReportSidebarItem(report);
    reportsList.appendChild(reportItem);
  });
}

function createReportSidebarItem(report) {
  const item = document.createElement("div");
  item.className = "report-item";
  item.onclick = () => loadReport(report.id);

  const date = new Date(report.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const timeAgo = getTimeAgo(report.createdAt);

  item.innerHTML = `
    <div class="report-date">${date}</div>
    <div class="report-summary">
      Growth Score: ${report.growthScore} • ${report.reflectionCount} reflections
    </div>
    <div class="report-time">${timeAgo}</div>
  `;

  return item;
}

function updateSidebarSelection(reportId) {
  document.querySelectorAll(".report-item").forEach((item) => {
    item.classList.remove("active");
  });

  // Find and highlight current report
  const activeItem = Array.from(document.querySelectorAll(".report-item")).find(
    (item) => item.onclick.toString().includes(reportId)
  );

  if (activeItem) {
    activeItem.classList.add("active");
  }
}

// ╭─ INTERACTIONS & EVENTS ────────────────────────────────────╮
function setupInteractions() {
  // Sidebar toggle
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("reportsSidebar");

  sidebarToggle?.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    sidebarToggle.textContent = sidebar.classList.contains("collapsed")
      ? "←"
      : "→";
  });

  // Generate new report button
  const generateBtn = document.getElementById("generateNewReportBtn");
  generateBtn?.addEventListener("click", showGenerateModal);

  // Continue section buttons
  const shareBtn = document.getElementById("shareReportBtn");
  shareBtn?.addEventListener("click", shareReport);

  const downloadBtn = document.getElementById("downloadReportBtn");
  downloadBtn?.addEventListener("click", downloadReport);

  // Modal interactions
  setupModalInteractions();

  // Mobile sidebar auto-collapse
  if (window.innerWidth <= 1024) {
    const sidebar = document.getElementById("reportsSidebar");
    sidebar?.classList.add("collapsed");
  }

  // Keyboard shortcuts
  setupKeyboardShortcuts();
}

function setupModalInteractions() {
  const modal = document.getElementById("generateModal");
  const closeBtn = document.getElementById("closeGenerateModal");
  const cancelBtn = document.getElementById("cancelGenerate");
  const confirmBtn = document.getElementById("confirmGenerate");

  closeBtn?.addEventListener("click", hideGenerateModal);
  cancelBtn?.addEventListener("click", hideGenerateModal);
  confirmBtn?.addEventListener("click", handleConfirmGenerate);

  // Close modal on backdrop click
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) {
      hideGenerateModal();
    }
  });

  // Close modal on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal?.classList.contains("hidden")) {
      hideGenerateModal();
    }
  });
}

function showGenerateModal() {
  const modal = document.getElementById("generateModal");

  // Update modal content with current user data
  document.getElementById("availableReflections").textContent =
    evolutionEligibility?.currentReflections || "--";
  document.getElementById("modalReportType").textContent =
    currentUser?.tier?.charAt(0).toUpperCase() + currentUser?.tier?.slice(1) ||
    "Essential";

  modal.classList.remove("hidden");

  // Focus confirm button
  setTimeout(() => {
    document.getElementById("confirmGenerate")?.focus();
  }, 100);
}

function hideGenerateModal() {
  const modal = document.getElementById("generateModal");
  modal.classList.add("hidden");
}

async function handleConfirmGenerate() {
  hideGenerateModal();
  await generateNewReport();
}

// ╭─ UTILITY FUNCTIONS ────────────────────────────────────────╮
function setDisplayState(state) {
  const loadingSection = document.getElementById("loadingSection");
  const errorSection = document.getElementById("errorSection");
  const contentContainer = document.getElementById("evolutionContainer");

  // Hide all sections
  loadingSection.classList.add("hidden");
  errorSection.classList.add("hidden");
  contentContainer.classList.add("hidden");

  // Show appropriate section
  switch (state) {
    case DISPLAY_STATES.LOADING:
      loadingSection.classList.remove("hidden");
      break;
    case DISPLAY_STATES.ERROR:
      errorSection.classList.remove("hidden");
      break;
    case DISPLAY_STATES.CONTENT:
      contentContainer.classList.remove("hidden");
      break;
  }
}

function showErrorState(title, subtitle = null, actions = null) {
  setDisplayState(DISPLAY_STATES.ERROR);

  document.querySelector(".error-title").textContent = title;

  if (subtitle) {
    document.getElementById("errorMessage").textContent = subtitle;
  }

  if (actions) {
    const actionsContainer = document.querySelector(".error-actions");
    actionsContainer.innerHTML = "";

    actions.forEach((action) => {
      const button = document.createElement("a");
      button.href = action.href;
      button.className = `sacred-button ${
        action.primary ? "primary" : "secondary"
      }`;
      button.innerHTML = `<span>${action.text}</span>`;
      actionsContainer.appendChild(button);
    });
  }
}

function typeText(element, text, delay = 30) {
  element.textContent = "";
  let index = 0;

  const timer = setInterval(() => {
    element.textContent += text[index];
    index++;

    if (index >= text.length) {
      clearInterval(timer);
    }
  }, delay);
}

function calculatePeriodLength(timePeriod) {
  if (!timePeriod?.start || !timePeriod?.end) return "Unknown";

  const start = new Date(timePeriod.start);
  const end = new Date(timePeriod.end);
  const diffMs = end - start;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
  return `${Math.floor(diffDays / 365)} years`;
}

function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: diffDays > 365 ? "numeric" : undefined,
  });
}

// ╭─ URL & NAVIGATION ──────────────────────────────────────────╮
function handleUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  const reportId = urlParams.get("report");

  if (reportId && allReports.length > 0) {
    const report = allReports.find((r) => r.id === reportId);
    if (report) {
      loadReport(reportId);
      return;
    }
  }
}

function updateUrl(reportId) {
  const url = new URL(window.location);
  url.searchParams.set("report", reportId);
  window.history.replaceState({}, "", url);
}

// ╭─ ACTIONS ───────────────────────────────────────────────────╮
async function shareReport() {
  if (!currentReport) return;

  const shareData = {
    title: "My Evolution Report - Mirror of Truth",
    text: `I just generated an evolution report showing my consciousness growth! Growth Score: ${currentReport.growthScore}`,
    url: window.location.href,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (error) {
      console.log("Share cancelled");
    }
  } else {
    // Fallback to copying URL
    await navigator.clipboard.writeText(window.location.href);
    showToast("Report link copied to clipboard!", "success");
  }
}

function downloadReport() {
  if (!currentReport) return;

  showToast("Download feature coming soon!", "info");
  // TODO: Implement PDF generation of the evolution report
}

// ╭─ KEYBOARD SHORTCUTS ───────────────────────────────────────╮
function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    // Cmd/Ctrl + G for generate new report
    if ((e.metaKey || e.ctrlKey) && e.key === "g") {
      e.preventDefault();
      if (evolutionEligibility?.eligible) {
        showGenerateModal();
      }
    }

    // Cmd/Ctrl + S for share
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      if (currentReport) {
        shareReport();
      }
    }
  });
}

// ╭─ ERROR HANDLING ────────────────────────────────────────────╮
function handleAuthenticationError() {
  showToast("Authentication failed. Please sign in again.", "error");

  setTimeout(() => {
    localStorage.removeItem("mirror_auth_token");
    localStorage.removeItem("mirrorVerifiedUser");
    window.location.href = "/auth/signin";
  }, 2000);
}

// ╭─ TOAST NOTIFICATIONS ───────────────────────────────────────╮
function showToast(message, type = "info", duration = 5000) {
  const container =
    document.getElementById("toastContainer") || createToastContainer();

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // Remove toast after duration
  setTimeout(() => {
    toast.style.transform = "translateX(100%)";
    toast.style.opacity = "0";

    setTimeout(() => {
      if (container.contains(toast)) {
        container.removeChild(toast);
      }
    }, 300);
  }, duration);
}

function createToastContainer() {
  const container = document.createElement("div");
  container.id = "toastContainer";
  container.className = "toast-container";
  container.style.cssText = `
    position: fixed;
    top: 100px;
    right: 1rem;
    z-index: 1001;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-width: 400px;
  `;
  document.body.appendChild(container);
  return container;
}

// ╭─ DYNAMIC STYLES ────────────────────────────────────────────╮
function addSimpleChartStyles() {
  if (document.getElementById("simpleChartStyles")) return;

  const style = document.createElement("style");
  style.id = "simpleChartStyles";
  style.textContent = `
    .simple-growth-chart {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2rem;
      padding: 2rem;
    }
    
    .growth-score-display {
      display: flex;
      justify-content: center;
    }
    
    .score-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: conic-gradient(
        from 0deg,
        rgba(147, 51, 234, 0.8) 0%,
        rgba(147, 51, 234, 0.8) var(--score, 70%),
        rgba(255, 255, 255, 0.1) var(--score, 70%),
        rgba(255, 255, 255, 0.1) 100%
      );
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    
    .score-circle::before {
      content: '';
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(15, 15, 35, 0.95) 0%, rgba(26, 26, 46, 0.95) 100%);
      position: absolute;
    }
    
    .score-value {
      font-size: 1.8rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
      position: relative;
      z-index: 1;
    }
    
    .score-label {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.7);
      position: relative;
      z-index: 1;
    }
    
    .growth-indicators {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      width: 100%;
    }
    
    .indicator {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      border: 1px solid rgba(147, 51, 234, 0.15);
    }
    
    .indicator-icon {
      font-size: 1.5rem;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(147, 51, 234, 0.2);
      border-radius: 8px;
      flex-shrink: 0;
    }
    
    .indicator-text {
      flex: 1;
    }
    
    .indicator-title {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 0.2rem;
    }
    
    .indicator-value {
      font-size: 1rem;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.9);
    }
  `;
  document.head.appendChild(style);

  // Set the score percentage
  if (currentReport?.growthScore) {
    const scoreCircle = document.querySelector(".score-circle");
    scoreCircle?.style.setProperty("--score", `${currentReport.growthScore}%`);
  }
}

function addGenerationPromptStyles() {
  if (document.getElementById("generationPromptStyles")) return;

  const style = document.createElement("style");
  style.id = "generationPromptStyles";
  style.textContent = `
    .generation-prompt {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      padding: 2rem;
    }
    
    .prompt-content {
      text-align: center;
      max-width: 500px;
      color: rgba(255, 255, 255, 0.9);
    }
    
    .prompt-icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
      animation: evolutionPulse 3s ease-in-out infinite;
    }
    
    .prompt-title {
      font-size: clamp(1.8rem, 5vw, 2.5rem);
      font-weight: 300;
      margin: 0 0 1rem 0;
      background: linear-gradient(135deg, rgba(147, 51, 234, 0.9) 0%, rgba(99, 102, 241, 0.9) 100%);
      -webkit-background-clip: text;
      color: transparent;
    }
    
    .prompt-subtitle {
      font-size: clamp(1rem, 3vw, 1.2rem);
      color: rgba(255, 255, 255, 0.7);
      margin: 0 0 2rem 0;
      line-height: 1.6;
    }
    
    .prompt-info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin: 2rem 0;
    }
    
    .info-item {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.8rem;
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.8);
    }
    
    .info-icon {
      font-size: 1.2rem;
    }
    
    .generate-first-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.8rem;
      padding: 1.2rem 2rem;
      background: linear-gradient(135deg, #9333ea, #7c3aed);
      border: none;
      border-radius: 16px;
      color: white;
      font-size: 1.1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 6px 20px rgba(147, 51, 234, 0.3);
    }
    
    .generate-first-btn:hover {
      background: linear-gradient(135deg, #7c3aed, #6d28d9);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(147, 51, 234, 0.4);
    }
  `;
  document.head.appendChild(style);
}

// ╭─ DEBUG (Development Only) ─────────────────────────────────╮
if (window.location.hostname === "localhost") {
  console.log("🦋 Sacred Evolution Interface initialized");

  // Add debug utilities to window
  window.evolutionDebug = {
    currentUser: () => currentUser,
    currentReport: () => currentReport,
    allReports: () => allReports,
    eligibility: () => evolutionEligibility,
    generateReport: generateNewReport,
    loadReport: loadReport,
    testToast: (message, type) => showToast(message, type),
  };
}
