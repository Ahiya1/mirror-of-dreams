// Reflection History - Interactive Timeline Logic
// Complete sacred reflection history experience with search, filters, and stats

let authToken = null;
let currentUser = null;
let reflections = [];
let filteredReflections = [];
let currentPage = 1;
let totalPages = 1;
let currentFilter = "all";
let currentSearch = "";
let isLoading = false;

const ITEMS_PER_PAGE = 10;

/* ═══ INITIALIZATION ═══ */
window.addEventListener("load", async () => {
  await checkAuthentication();
  setupEventListeners();
  await loadReflections();
  animateEntrance();
});

/* ═══ AUTHENTICATION ═══ */
async function checkAuthentication() {
  // Check for stored auth token
  authToken = localStorage.getItem("mirror_auth_token");

  if (!authToken) {
    // Redirect to sign in
    window.location.href =
      "/auth/signin?redirect=" + encodeURIComponent(window.location.pathname);
    return;
  }

  try {
    // Verify token and get user data
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ action: "verify-token" }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      localStorage.removeItem("mirror_auth_token");
      window.location.href = "/auth/signin";
      return;
    }

    currentUser = data.user;
    console.log("🪞 Authenticated user:", currentUser.email);
  } catch (error) {
    console.error("Auth verification failed:", error);
    localStorage.removeItem("mirror_auth_token");
    window.location.href = "/auth/signin";
  }
}

/* ═══ EVENT LISTENERS ═══ */
function setupEventListeners() {
  // Search functionality
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");

  searchInput.addEventListener("input", debounce(handleSearch, 500));
  searchBtn.addEventListener("click", handleSearch);

  // Filter buttons
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleFilter(btn.dataset.filter));
  });

  // Pagination
  document
    .getElementById("prevBtn")
    .addEventListener("click", () => changePage(currentPage - 1));
  document
    .getElementById("nextBtn")
    .addEventListener("click", () => changePage(currentPage + 1));

  // Search on Enter key
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  });
}

/* ═══ DATA LOADING ═══ */
async function loadReflections() {
  if (isLoading) return;

  setLoading(true);

  try {
    const response = await fetch("/api/reflections", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        action: "get-history",
        page: 1,
        limit: 100, // Get all for client-side filtering
        sortBy: "created_at",
        sortOrder: "desc",
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to load reflections");
    }

    reflections = data.reflections || [];
    filteredReflections = [...reflections];

    displayStats();
    applyCurrentFilters();

    if (reflections.length === 0) {
      showEmptyState();
    } else {
      hideEmptyState();
      renderReflections();
    }
  } catch (error) {
    console.error("Failed to load reflections:", error);
    showError(
      "Unable to load your reflections. Please try refreshing the page."
    );
  } finally {
    setLoading(false);
  }
}

/* ═══ SEARCH & FILTERING ═══ */
function handleSearch() {
  const searchInput = document.getElementById("searchInput");
  currentSearch = searchInput.value.trim().toLowerCase();
  currentPage = 1;
  applyCurrentFilters();
}

function handleFilter(filter) {
  // Update active filter button
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  document.querySelector(`[data-filter="${filter}"]`).classList.add("active");

  currentFilter = filter;
  currentPage = 1;
  applyCurrentFilters();
}

function applyCurrentFilters() {
  let filtered = [...reflections];

  // Apply search filter
  if (currentSearch) {
    filtered = filtered.filter(
      (reflection) =>
        reflection.title?.toLowerCase().includes(currentSearch) ||
        reflection.dream?.toLowerCase().includes(currentSearch) ||
        reflection.ai_response?.toLowerCase().includes(currentSearch)
    );
  }

  // Apply category filter
  if (currentFilter !== "all") {
    if (currentFilter === "premium") {
      filtered = filtered.filter((reflection) => reflection.is_premium);
    } else {
      filtered = filtered.filter(
        (reflection) => reflection.tone === currentFilter
      );
    }
  }

  filteredReflections = filtered;
  totalPages = Math.ceil(filteredReflections.length / ITEMS_PER_PAGE);

  renderReflections();
  updatePagination();
}

/* ═══ RENDERING ═══ */
function renderReflections() {
  const container = document.getElementById("reflectionsList");

  if (filteredReflections.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <div class="empty-icon">🔍</div>
        <h3>No reflections found</h3>
        <p>Try adjusting your search or filters</p>
      </div>
    `;
    return;
  }

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pageReflections = filteredReflections.slice(startIndex, endIndex);

  container.innerHTML = pageReflections
    .map(
      (reflection) => `
    <div class="reflection-item ${
      reflection.is_premium ? "reflection-premium" : ""
    } fade-in" 
         onclick="viewReflection('${reflection.id}')"
         data-reflection-id="${reflection.id}">
      
      <div class="reflection-header">
        <h3 class="reflection-title">${escapeHtml(
          reflection.title || "Untitled Reflection"
        )}</h3>
        <div class="reflection-meta">
          <div class="reflection-date">${reflection.timeAgo}</div>
          <div class="reflection-tone ${reflection.tone}">${
        reflection.tone
      }</div>
          ${
            reflection.is_premium
              ? '<div class="premium-badge">✨ Premium</div>'
              : ""
          }
        </div>
      </div>

      <div class="reflection-preview">
        ${truncateText(stripHtml(reflection.dream), 120)}
      </div>

      <div class="reflection-stats">
        <span>${reflection.word_count || 0} words</span>
        <span>•</span>
        <span>${reflection.estimated_read_time || 1} min read</span>
        ${
          reflection.view_count
            ? `<span>•</span><span>${reflection.view_count} views</span>`
            : ""
        }
      </div>
    </div>
  `
    )
    .join("");

  // Animate items in
  setTimeout(() => {
    container.querySelectorAll(".reflection-item").forEach((item, index) => {
      setTimeout(() => {
        item.style.opacity = "0";
        item.style.transform = "translateY(20px)";
        item.style.transition = "all 0.6s ease";

        requestAnimationFrame(() => {
          item.style.opacity = "1";
          item.style.transform = "translateY(0)";
        });
      }, index * 100);
    });
  }, 100);
}

function displayStats() {
  const totalElement = document.getElementById("totalReflections");
  const monthElement = document.getElementById("thisMonthCount");
  const wordsElement = document.getElementById("totalWords");
  const depthElement = document.getElementById("averageDepth");

  if (!totalElement) return;

  // Calculate stats
  const total = reflections.length;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonth = reflections.filter(
    (r) => r.created_at && r.created_at.startsWith(currentMonth)
  ).length;

  const totalWords = reflections.reduce(
    (sum, r) => sum + (r.word_count || 0),
    0
  );
  const averageWords = total > 0 ? Math.round(totalWords / total) : 0;

  // Animate stats
  animateNumber(totalElement, total);
  animateNumber(monthElement, thisMonth);
  animateNumber(wordsElement, totalWords, true);

  if (averageWords > 0) {
    depthElement.textContent = `${averageWords}w`;
  } else {
    depthElement.textContent = "—";
  }
}

function updatePagination() {
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const paginationInfo = document.getElementById("paginationInfo");

  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;

  if (totalPages <= 1) {
    paginationInfo.textContent = `${filteredReflections.length} reflection${
      filteredReflections.length === 1 ? "" : "s"
    }`;
  } else {
    paginationInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  }
}

function changePage(page) {
  if (page < 1 || page > totalPages || page === currentPage) return;

  currentPage = page;
  renderReflections();
  updatePagination();

  // Scroll to top of timeline
  document.getElementById("timelineSection").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

/* ═══ NAVIGATION ═══ */
function viewReflection(reflectionId) {
  if (!reflectionId) return;

  // Navigate to individual reflection view
  window.location.href = `/reflections/view?id=${reflectionId}`;
}

/* ═══ UI STATES ═══ */
function setLoading(loading) {
  isLoading = loading;
  const loadingSection = document.getElementById("loadingSection");
  const timelineSection = document.getElementById("timelineSection");
  const statsSection = document.getElementById("statsSection");

  if (loading) {
    loadingSection?.classList.remove("hidden");
    timelineSection?.classList.add("hidden");
    statsSection?.classList.add("loading");
  } else {
    loadingSection?.classList.add("hidden");
    timelineSection?.classList.remove("hidden");
    statsSection?.classList.remove("loading");
  }
}

function showEmptyState() {
  const emptySection = document.getElementById("emptySection");
  const timelineSection = document.getElementById("timelineSection");
  const statsSection = document.getElementById("statsSection");

  emptySection?.classList.remove("hidden");
  timelineSection?.classList.add("hidden");
  statsSection?.classList.add("hidden");
}

function hideEmptyState() {
  const emptySection = document.getElementById("emptySection");
  const timelineSection = document.getElementById("timelineSection");
  const statsSection = document.getElementById("statsSection");

  emptySection?.classList.add("hidden");
  timelineSection?.classList.remove("hidden");
  statsSection?.classList.remove("hidden");
}

function showError(message) {
  // Simple error display - could be enhanced with a proper modal
  const container = document.getElementById("reflectionsList");
  if (container) {
    container.innerHTML = `
      <div class="error-state">
        <div class="empty-icon">⚡</div>
        <h3>Something went wrong</h3>
        <p>${escapeHtml(message)}</p>
        <button class="sacred-button" onclick="window.location.reload()">
          Try Again
        </button>
      </div>
    `;
  }
}

/* ═══ ANIMATIONS ═══ */
function animateEntrance() {
  // Animate the main sections in
  const sections = [
    document.querySelector(".search-section"),
    document.querySelector(".stats-section"),
    document.querySelector(".timeline-section"),
  ].filter(Boolean);

  sections.forEach((section, index) => {
    section.style.opacity = "0";
    section.style.transform = "translateY(20px)";

    setTimeout(() => {
      section.style.transition = "all 0.8s ease";
      section.style.opacity = "1";
      section.style.transform = "translateY(0)";
    }, index * 200);
  });
}

function animateNumber(element, target, useK = false) {
  const duration = 1500;
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * easeOut);

    if (useK && current >= 1000) {
      element.textContent = `${(current / 1000).toFixed(1)}k`;
    } else {
      element.textContent = current.toLocaleString();
    }

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/* ═══ UTILITY FUNCTIONS ═══ */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function stripHtml(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

function truncateText(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ═══ KEYBOARD SHORTCUTS ═══ */
document.addEventListener("keydown", (e) => {
  // Only if not in an input field
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

  switch (e.key) {
    case "/":
      e.preventDefault();
      document.getElementById("searchInput").focus();
      break;
    case "r":
      if (e.ctrlKey || e.metaKey) return; // Don't override refresh
      e.preventDefault();
      window.location.href = "/mirror/reflection";
      break;
    case "ArrowLeft":
      if (currentPage > 1) {
        e.preventDefault();
        changePage(currentPage - 1);
      }
      break;
    case "ArrowRight":
      if (currentPage < totalPages) {
        e.preventDefault();
        changePage(currentPage + 1);
      }
      break;
  }
});

/* ═══ ERROR HANDLING ═══ */
window.addEventListener("error", (e) => {
  console.error("JavaScript error:", e.error);
});

window.addEventListener("unhandledrejection", (e) => {
  console.error("Unhandled promise rejection:", e.reason);
});

// Add CSS for no-results and error states
const style = document.createElement("style");
style.textContent = `
  .no-results, .error-state {
    text-align: center;
    padding: 3rem 2rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .no-results .empty-icon, .error-state .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.6;
  }

  .no-results h3, .error-state h3 {
    font-size: 1.2rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: rgba(255, 255, 255, 0.9);
  }

  .no-results p, .error-state p {
    opacity: 0.7;
    margin-bottom: 1.5rem;
  }

  .loading .stat-number {
    opacity: 0.5;
    pointer-events: none;
  }
`;
document.head.appendChild(style);
