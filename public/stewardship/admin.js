// Stewardship - Admin Management Logic (Updated with Gift Support)

let adminData = null;
let authKey = null;
let currentTab = "overview";
let filteredReceipts = [];
let filteredGifts = [];

// Initialize
window.addEventListener("load", checkExistingAuth);

// Authentication
async function authenticate() {
  const password = document.getElementById("authPassword").value.trim();
  const errorDiv = document.getElementById("authError");

  if (!password) {
    showAuthError("Sacred key required");
    return;
  }

  try {
    const response = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "authenticate", password }),
    });

    const result = await response.json();

    if (result.success) {
      authKey = password;
      sessionStorage.setItem("mirrorAuthKey", password);
      showAdminInterface();
      await loadAdminData();
      setInterval(loadAdminData, 10000);
    } else {
      showAuthError("Invalid sacred key");
    }
  } catch (error) {
    console.error("Auth error:", error);
    showAuthError("Sacred realm temporarily unavailable");
    updateConnectionStatus(false);
  }
}

function showAuthError(message) {
  const errorDiv = document.getElementById("authError");
  errorDiv.textContent = message;
  errorDiv.style.display = "block";
  document.getElementById("authPassword").value = "";
}

function showAdminInterface() {
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("adminInterface").classList.add("visible");
  updateConnectionStatus(true);
}

function updateConnectionStatus(connected) {
  const statusEl = document.getElementById("connectionStatus");
  if (connected) {
    statusEl.className = "connection-status connected";
    statusEl.textContent = "🔗 Connected";
  } else {
    statusEl.className = "connection-status disconnected";
    statusEl.textContent = "⚠️ Offline";
  }
}

async function checkExistingAuth() {
  const savedKey = sessionStorage.getItem("mirrorAuthKey");
  if (savedKey) {
    try {
      const response = await fetch(
        `/api/admin?action=auth&key=${encodeURIComponent(savedKey)}`
      );
      if (response.ok) {
        authKey = savedKey;
        showAdminInterface();
        loadAdminData();
        setInterval(loadAdminData, 10000);
      } else {
        sessionStorage.removeItem("mirrorAuthKey");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      sessionStorage.removeItem("mirrorAuthKey");
      updateConnectionStatus(false);
    }
  }

  // Auto-focus auth input
  setTimeout(() => {
    document.getElementById("authPassword")?.focus();
  }, 500);
}

// Data Management
async function loadAdminData() {
  if (!authKey) return;

  try {
    const response = await fetch(
      `/api/admin?key=${encodeURIComponent(authKey)}`
    );

    if (!response.ok) {
      if (response.status === 401) {
        sessionStorage.removeItem("mirrorAuthKey");
        location.reload();
        return;
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      adminData = result.data;
      updateStats();
      renderReceipts();
      renderGifts();
      renderRecentActivity();
      updateConnectionStatus(true);
    } else {
      throw new Error(result.error || "Failed to load admin data");
    }
  } catch (error) {
    console.error("Error loading admin data:", error);
    updateConnectionStatus(false);
    notify("Connection error - retrying...", true);
  }
}

function updateStats() {
  if (!adminData || !adminData.stats) return;

  const stats = adminData.stats;

  // Receipt stats
  document.getElementById("statTotalRevenue").textContent =
    stats.totalRevenue || 0;
  document.getElementById("statTodayRevenue").textContent =
    stats.todayRevenue || 0;
  document.getElementById("statTotalReceipts").textContent =
    stats.totalReceipts || 0;

  // Calculate today's receipts count
  const today = new Date().toDateString();
  const todayReceipts = (adminData.receipts || []).filter(
    (r) => new Date(r.timestamp).toDateString() === today
  ).length;
  document.getElementById("statTodayReceipts").textContent = todayReceipts;

  // Gift stats
  document.getElementById("statTotalGifts").textContent = stats.totalGifts || 0;
  document.getElementById("statRedeemedGifts").textContent =
    stats.redeemedGifts || 0;
  document.getElementById("statPendingGifts").textContent =
    stats.pendingGifts || 0;

  // Calculate today's gifts count
  const todayGifts = (adminData.gifts || []).filter(
    (g) => new Date(g.createdAt).toDateString() === today
  ).length;
  document.getElementById("statTodayGifts").textContent = todayGifts;

  // Update badges
  document.getElementById("receiptsBadge").textContent = `${
    stats.totalReceipts || 0
  } receipts`;
  document.getElementById("giftsBadge").textContent = `${
    stats.totalGifts || 0
  } gifts`;
}

// Tab Management
function switchTab(tabName) {
  currentTab = tabName;

  // Update tab buttons
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  event.target.classList.add("active");

  // Update tab content
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });
  document.getElementById(tabName + "Tab").classList.add("active");
}

// Receipt Management
function renderReceipts() {
  if (!adminData || !adminData.receipts) return;

  const container = document.getElementById("receiptsList");
  let receipts = adminData.receipts;

  // Apply filters
  const searchTerm =
    document.getElementById("receiptSearch")?.value.toLowerCase() || "";
  const paymentFilter =
    document.getElementById("receiptPaymentFilter")?.value || "all";
  const startDate = document.getElementById("receiptStartDate")?.value;
  const endDate = document.getElementById("receiptEndDate")?.value;

  if (searchTerm) {
    receipts = receipts.filter(
      (receipt) =>
        receipt.receiptNumber.toLowerCase().includes(searchTerm) ||
        receipt.customerName.toLowerCase().includes(searchTerm) ||
        receipt.customerEmail.toLowerCase().includes(searchTerm)
    );
  }

  if (paymentFilter !== "all") {
    receipts = receipts.filter(
      (receipt) => receipt.paymentMethod === paymentFilter
    );
  }

  if (startDate) {
    receipts = receipts.filter(
      (receipt) => new Date(receipt.timestamp) >= new Date(startDate)
    );
  }

  if (endDate) {
    receipts = receipts.filter(
      (receipt) =>
        new Date(receipt.timestamp) <= new Date(endDate + "T23:59:59")
    );
  }

  filteredReceipts = receipts;

  if (receipts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🧾</div>
        <div class="empty-title">No receipts found</div>
        <div class="empty-subtitle">Receipts will appear as payments are processed</div>
      </div>
    `;
    return;
  }

  container.innerHTML = receipts
    .map(
      (receipt) => `
      <div class="item-card" data-id="${receipt.id}">
        <div class="item-header">
          <div class="item-info">
            <h3>Receipt #${receipt.receiptNumber}</h3>
            <p>${receipt.customerName} • ${receipt.customerEmail}</p>
            <p>
              <span class="badge ${receipt.paymentMethod}">$${
        receipt.amount
      } • ${receipt.paymentMethod}</span> • 
              ${receipt.language === "he" ? "עברית" : "English"}
            </p>
          </div>
          <div class="item-meta">
            <div>${receipt.timeAgo || "Now"}</div>
          </div>
        </div>
        <div class="item-actions">
          <button class="action-btn secondary-btn" onclick="resendReceipt('${
            receipt.id
          }')">
            📧 Resend
          </button>
          <button class="action-btn danger-btn" onclick="removeReceipt('${
            receipt.id
          }')">
            🗑️ Delete
          </button>
        </div>
      </div>
    `
    )
    .join("");
}

// Gift Management
function renderGifts() {
  if (!adminData || !adminData.gifts) return;

  const container = document.getElementById("giftsList");
  let gifts = adminData.gifts;

  // Apply filters
  const searchTerm =
    document.getElementById("giftSearch")?.value.toLowerCase() || "";
  const statusFilter =
    document.getElementById("giftStatusFilter")?.value || "all";
  const paymentFilter =
    document.getElementById("giftPaymentFilter")?.value || "all";
  const startDate = document.getElementById("giftStartDate")?.value;
  const endDate = document.getElementById("giftEndDate")?.value;

  if (searchTerm) {
    gifts = gifts.filter(
      (gift) =>
        gift.giftCode.toLowerCase().includes(searchTerm) ||
        gift.giverName.toLowerCase().includes(searchTerm) ||
        gift.giverEmail.toLowerCase().includes(searchTerm) ||
        gift.recipientName.toLowerCase().includes(searchTerm) ||
        gift.recipientEmail.toLowerCase().includes(searchTerm)
    );
  }

  if (statusFilter !== "all") {
    gifts = gifts.filter((gift) =>
      statusFilter === "redeemed" ? gift.isRedeemed : !gift.isRedeemed
    );
  }

  if (paymentFilter !== "all") {
    gifts = gifts.filter((gift) => gift.paymentMethod === paymentFilter);
  }

  if (startDate) {
    gifts = gifts.filter(
      (gift) => new Date(gift.createdAt) >= new Date(startDate)
    );
  }

  if (endDate) {
    gifts = gifts.filter(
      (gift) => new Date(gift.createdAt) <= new Date(endDate + "T23:59:59")
    );
  }

  filteredGifts = gifts;

  if (gifts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎁</div>
        <div class="empty-title">No gifts found</div>
        <div class="empty-subtitle">Gifts will appear as they are purchased</div>
      </div>
    `;
    return;
  }

  container.innerHTML = gifts
    .map(
      (gift) => `
      <div class="item-card" data-id="${gift.id}">
        <div class="item-header">
          <div class="item-info">
            <h3>Gift #${gift.giftCode}</h3>
            <p><strong>From:</strong> ${gift.giverName} (${gift.giverEmail})</p>
            <p><strong>To:</strong> ${gift.recipientName} (${
        gift.recipientEmail
      })</p>
            <p>
              <span class="badge ${gift.paymentMethod}">$${gift.amount} • ${
        gift.paymentMethod
      }</span>
              <span class="badge ${gift.isRedeemed ? "redeemed" : "pending"}">${
        gift.isRedeemed ? "Redeemed" : "Pending"
      }</span>
            </p>
            ${
              gift.personalMessage
                ? `<p class="gift-message">"${gift.personalMessage}"</p>`
                : ""
            }
          </div>
          <div class="item-meta">
            <div>${gift.timeAgo || "Now"}</div>
            ${
              gift.isRedeemed && gift.redeemedAt
                ? `<div class="redeemed-time">Redeemed: ${new Date(
                    gift.redeemedAt
                  ).toLocaleDateString()}</div>`
                : ""
            }
          </div>
        </div>
        <div class="item-actions">
          <button class="action-btn secondary-btn" onclick="viewGiftDetails('${
            gift.id
          }')">
            👁️ Details
          </button>
          ${
            !gift.isRedeemed
              ? `
            <button class="action-btn primary-btn" onclick="resendGiftInvitation('${gift.id}')">
              📧 Resend Invitation
            </button>
          `
              : ""
          }
          <button class="action-btn danger-btn" onclick="removeGift('${
            gift.id
          }')">
            🗑️ Delete
          </button>
        </div>
      </div>
    `
    )
    .join("");
}

function renderRecentActivity() {
  if (!adminData) return;

  const container = document.getElementById("recentActivity");

  // Combine receipts and gifts, sort by date
  const allActivity = [];

  if (adminData.receipts) {
    adminData.receipts.forEach((receipt) => {
      allActivity.push({
        type: "receipt",
        id: receipt.receiptNumber,
        amount: receipt.amount,
        paymentMethod: receipt.paymentMethod,
        customer: receipt.customerName,
        email: receipt.customerEmail,
        timestamp: receipt.timestamp,
        timeAgo: receipt.timeAgo,
      });
    });
  }

  if (adminData.gifts) {
    adminData.gifts.forEach((gift) => {
      allActivity.push({
        type: "gift",
        id: gift.giftCode,
        amount: gift.amount,
        paymentMethod: gift.paymentMethod,
        customer: `${gift.giverName} → ${gift.recipientName}`,
        email: gift.giverEmail,
        timestamp: gift.createdAt,
        timeAgo: gift.timeAgo,
        isRedeemed: gift.isRedeemed,
      });
    });
  }

  // Sort by timestamp, most recent first
  allActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const recentActivity = allActivity.slice(0, 15);

  if (recentActivity.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <div class="empty-title">No recent activity</div>
      </div>
    `;
    return;
  }

  container.innerHTML = recentActivity
    .map(
      (activity) => `
      <div class="item-card">
        <div class="item-header">
          <div class="item-info">
            <p>${activity.type === "receipt" ? "Receipt" : "Gift"} #${
        activity.id
      } - $${activity.amount} (${activity.paymentMethod})</p>
            <p>${activity.customer} • ${activity.email}</p>
          </div>
          <div class="item-meta">
            <span class="badge ${
              activity.type === "receipt"
                ? activity.paymentMethod
                : activity.isRedeemed
                ? "redeemed"
                : "pending"
            }">${activity.type}${
        activity.type === "gift" && activity.isRedeemed ? " (redeemed)" : ""
      }</span>
            <div>${activity.timeAgo || "Now"}</div>
          </div>
        </div>
      </div>
    `
    )
    .join("");
}

// Receipt Actions
async function addReceipt() {
  document.getElementById("receiptModalTitle").textContent = "Create Receipt";
  document.getElementById("receiptForm").reset();
  document.getElementById("receiptAmount").value = "2.99";
  showModal("receiptModal");
}

async function removeReceipt(id) {
  if (!confirm("Are you sure you want to delete this receipt?")) return;

  try {
    const response = await fetch(`/api/admin?id=${id}&type=receipt`, {
      method: "DELETE",
      headers: {
        Authorization: authKey,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to remove receipt");
    }

    notify("Receipt deleted");
    await loadAdminData();
  } catch (error) {
    console.error("Error removing receipt:", error);
    notify("Failed to delete receipt", true);
  }
}

async function resendReceipt(id) {
  const receipt = adminData.receipts.find((r) => r.id === id);
  if (!receipt) return;

  try {
    const response = await fetch("/api/communication", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generate-receipt",
        email: receipt.customerEmail,
        name: receipt.customerName,
        amount: receipt.amount,
        paymentMethod: receipt.paymentMethod,
        language: receipt.language,
      }),
    });

    const result = await response.json();

    if (result.success) {
      notify("Receipt resent successfully");
    } else {
      throw new Error("Failed to resend receipt");
    }
  } catch (error) {
    console.error("Error resending receipt:", error);
    notify("Failed to resend receipt", true);
  }
}

// Gift Actions
function viewGiftDetails(id) {
  const gift = adminData.gifts.find((g) => g.id === id);
  if (!gift) return;

  const modal = document.getElementById("giftModal");
  const detailsContainer = document.getElementById("giftDetails");

  detailsContainer.innerHTML = `
    <div class="gift-details">
      <div class="detail-section">
        <h3>Gift Information</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Gift Code:</label>
            <span>${gift.giftCode}</span>
          </div>
          <div class="detail-item">
            <label>Amount:</label>
            <span>$${gift.amount}</span>
          </div>
          <div class="detail-item">
            <label>Payment Method:</label>
            <span>${gift.paymentMethod}</span>
          </div>
          <div class="detail-item">
            <label>Status:</label>
            <span class="badge ${gift.isRedeemed ? "redeemed" : "pending"}">${
    gift.isRedeemed ? "Redeemed" : "Pending"
  }</span>
          </div>
        </div>
      </div>
      
      <div class="detail-section">
        <h3>Giver Information</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Name:</label>
            <span>${gift.giverName}</span>
          </div>
          <div class="detail-item">
            <label>Email:</label>
            <span>${gift.giverEmail}</span>
          </div>
        </div>
      </div>
      
      <div class="detail-section">
        <h3>Recipient Information</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Name:</label>
            <span>${gift.recipientName}</span>
          </div>
          <div class="detail-item">
            <label>Email:</label>
            <span>${gift.recipientEmail}</span>
          </div>
        </div>
      </div>
      
      ${
        gift.personalMessage
          ? `
        <div class="detail-section">
          <h3>Personal Message</h3>
          <div class="personal-message">
            "${gift.personalMessage}"
          </div>
        </div>
      `
          : ""
      }
      
      <div class="detail-section">
        <h3>Timeline</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Created:</label>
            <span>${new Date(gift.createdAt).toLocaleString()}</span>
          </div>
          ${
            gift.isRedeemed && gift.redeemedAt
              ? `
            <div class="detail-item">
              <label>Redeemed:</label>
              <span>${new Date(gift.redeemedAt).toLocaleString()}</span>
            </div>
          `
              : ""
          }
        </div>
      </div>
      
      <div class="detail-actions">
        ${
          !gift.isRedeemed
            ? `
          <button class="action-btn primary-btn" onclick="resendGiftInvitation('${gift.id}'); closeModal('giftModal');">
            📧 Resend Invitation
          </button>
        `
            : ""
        }
        <button class="action-btn danger-btn" onclick="removeGift('${
          gift.id
        }'); closeModal('giftModal');">
          🗑️ Delete Gift
        </button>
      </div>
    </div>
  `;

  showModal("giftModal");
}

async function resendGiftInvitation(id) {
  const gift = adminData.gifts.find((g) => g.id === id);
  if (!gift || gift.isRedeemed) return;

  try {
    const response = await fetch("/api/communication", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send-gift-invitation",
        gift: gift,
      }),
    });

    const result = await response.json();

    if (result.success) {
      notify("Gift invitation resent successfully");
    } else {
      throw new Error("Failed to resend gift invitation");
    }
  } catch (error) {
    console.error("Error resending gift invitation:", error);
    notify("Failed to resend gift invitation", true);
  }
}

async function removeGift(id) {
  if (!confirm("Are you sure you want to delete this gift?")) return;

  try {
    // Note: You'll need to add a delete endpoint for gifts in your API
    const response = await fetch(`/api/admin?id=${id}&type=gift`, {
      method: "DELETE",
      headers: {
        Authorization: authKey,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to remove gift");
    }

    notify("Gift deleted");
    await loadAdminData();
  } catch (error) {
    console.error("Error removing gift:", error);
    notify("Failed to delete gift", true);
  }
}

// Export Functions
function exportReceipts() {
  if (!filteredReceipts.length) {
    notify("No receipts to export", true);
    return;
  }

  const csvContent =
    "data:text/csv;charset=utf-8," +
    "Receipt Number,Customer Name,Customer Email,Amount,Payment Method,Language,Date,Timestamp\n" +
    filteredReceipts
      .map(
        (receipt) =>
          `${receipt.receiptNumber},"${receipt.customerName}","${receipt.customerEmail}",${receipt.amount},${receipt.paymentMethod},${receipt.language},"${receipt.date}","${receipt.timestamp}"`
      )
      .join("\n");

  downloadCSV(
    csvContent,
    `receipts_${new Date().toISOString().split("T")[0]}.csv`
  );
  notify("Receipts exported successfully");
}

function exportGifts() {
  if (!filteredGifts.length) {
    notify("No gifts to export", true);
    return;
  }

  const csvContent =
    "data:text/csv;charset=utf-8," +
    "Gift Code,Giver Name,Giver Email,Recipient Name,Recipient Email,Amount,Payment Method,Status,Personal Message,Created Date,Redeemed Date\n" +
    filteredGifts
      .map(
        (gift) =>
          `${gift.giftCode},"${gift.giverName}","${gift.giverEmail}","${
            gift.recipientName
          }","${gift.recipientEmail}",${gift.amount},${gift.paymentMethod},${
            gift.isRedeemed ? "Redeemed" : "Pending"
          },"${gift.personalMessage || ""}","${gift.createdAt}","${
            gift.redeemedAt || ""
          }"`
      )
      .join("\n");

  downloadCSV(
    csvContent,
    `gifts_${new Date().toISOString().split("T")[0]}.csv`
  );
  notify("Gifts exported successfully");
}

function downloadCSV(csvContent, filename) {
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Modal Management
function showModal(modalId) {
  document.getElementById(modalId).classList.add("show");
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("show");
}

// Form Handlers
document.addEventListener("DOMContentLoaded", () => {
  // Receipt form submission
  document
    .getElementById("receiptForm")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = {
        customerName: document.getElementById("receiptCustomerName").value,
        customerEmail: document.getElementById("receiptCustomerEmail").value,
        amount: parseFloat(document.getElementById("receiptAmount").value),
        paymentMethod: document.getElementById("receiptPaymentMethod").value,
        language: document.getElementById("receiptLanguage").value,
      };

      try {
        const response = await fetch("/api/communication", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "generate-receipt",
            ...formData,
          }),
        });

        const result = await response.json();

        if (result.success) {
          notify("Receipt created and sent successfully");
          closeModal("receiptModal");
          await loadAdminData();
        } else {
          throw new Error(result.error || "Failed to create receipt");
        }
      } catch (error) {
        console.error("Error creating receipt:", error);
        notify("Failed to create receipt", true);
      }
    });

  // Filter event listeners
  const receiptSearch = document.getElementById("receiptSearch");
  const receiptPaymentFilter = document.getElementById("receiptPaymentFilter");
  const receiptStartDate = document.getElementById("receiptStartDate");
  const receiptEndDate = document.getElementById("receiptEndDate");

  const giftSearch = document.getElementById("giftSearch");
  const giftStatusFilter = document.getElementById("giftStatusFilter");
  const giftPaymentFilter = document.getElementById("giftPaymentFilter");
  const giftStartDate = document.getElementById("giftStartDate");
  const giftEndDate = document.getElementById("giftEndDate");

  if (receiptSearch) receiptSearch.addEventListener("input", renderReceipts);
  if (receiptPaymentFilter)
    receiptPaymentFilter.addEventListener("change", renderReceipts);
  if (receiptStartDate)
    receiptStartDate.addEventListener("change", renderReceipts);
  if (receiptEndDate) receiptEndDate.addEventListener("change", renderReceipts);

  if (giftSearch) giftSearch.addEventListener("input", renderGifts);
  if (giftStatusFilter)
    giftStatusFilter.addEventListener("change", renderGifts);
  if (giftPaymentFilter)
    giftPaymentFilter.addEventListener("change", renderGifts);
  if (giftStartDate) giftStartDate.addEventListener("change", renderGifts);
  if (giftEndDate) giftEndDate.addEventListener("change", renderGifts);
});

// Utility Functions
function notify(message, isError = false) {
  const notification = document.getElementById("notification");

  // Clear any existing classes and states
  notification.classList.remove("show", "error");
  notification.style.opacity = "";
  notification.style.visibility = "";
  notification.style.transform = "";

  // Set new content and type
  notification.textContent = message;
  if (isError) {
    notification.classList.add("error");
  }

  // Show notification
  requestAnimationFrame(() => {
    notification.classList.add("show");
  });

  // Hide after 3 seconds
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.visibility = "hidden";
      notification.style.transform = "translateX(-50%) translateY(-120%)";
    }, 400);
  }, 3000);
}

// Event Listeners
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal.show").forEach((modal) => {
      modal.classList.remove("show");
    });
  }
});

document.addEventListener("keypress", (e) => {
  if (e.target.id === "authPassword" && e.key === "Enter") {
    authenticate();
  }
});

// Close modals on backdrop click
document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("show");
    }
  });
});
