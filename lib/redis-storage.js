/* =========================================================================
   FILE: lib/redis-storage.js (ENHANCED)
   Upstash Redis storage for Mirror of Truth with Receipt Management
   ========================================================================= */

const { Redis } = require("@upstash/redis");

// Initialize Redis connection
const redis = Redis.fromEnv();

const REGISTRATIONS_KEY = "mirror:registrations";
const BOOTH_SETTINGS_KEY = "mirror:booth-settings";
const RECEIPTS_KEY = "mirror:receipts"; // NEW: Receipt storage

// Helper functions
function generateId() {
  return Date.now() + Math.random().toString(36).substr(2, 9);
}

function generateReceiptNumber() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `MR${timestamp.slice(-6)}${random}`;
}

function timeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000 / 60);

  if (diff < 1) return "now";
  if (diff === 1) return "1 min ago";
  if (diff < 60) return `${diff} mins ago`;
  if (diff < 120) return "1 hour ago";
  const hours = Math.floor(diff / 60);
  return `${hours} hours ago`;
}

function calculateStats(registrations, receipts) {
  const now = new Date();
  const today = now.toDateString();

  const todayRegistrations = registrations.filter(
    (r) => new Date(r.timestamp).toDateString() === today
  );

  const todayReceipts = receipts.filter(
    (r) => new Date(r.timestamp).toDateString() === today
  );

  const pending = registrations.filter((r) => r.status === "pending");
  const completed = registrations.filter((r) => r.status === "completed");

  const totalRevenue = receipts.reduce(
    (sum, receipt) => sum + (receipt.amount || 0),
    0
  );
  const todayRevenue = todayReceipts.reduce(
    (sum, receipt) => sum + (receipt.amount || 0),
    0
  );

  return {
    pending: pending.length,
    today: todayRegistrations.length,
    revenue: completed.length * 20, // Legacy calculation
    totalRevenue: totalRevenue, // NEW: Actual revenue from receipts
    todayRevenue: todayRevenue, // NEW: Today's revenue
    total: registrations.length,
    totalReceipts: receipts.length, // NEW: Total receipts count
    completionRate:
      registrations.length > 0
        ? Math.round((completed.length / registrations.length) * 100)
        : 0,
  };
}

// Storage functions
async function loadRegistrations() {
  try {
    const registrations = await redis.get(REGISTRATIONS_KEY);
    console.log(
      `📖 Loaded ${
        registrations ? registrations.length : 0
      } registrations from Redis`
    );
    return registrations || [];
  } catch (error) {
    console.error("Error loading registrations from Redis:", error);
    return [];
  }
}

async function saveRegistrations(registrations) {
  try {
    await redis.set(REGISTRATIONS_KEY, registrations);
    console.log(`💾 Saved ${registrations.length} registrations to Redis`);
  } catch (error) {
    console.error("Error saving registrations to Redis:", error);
    throw error;
  }
}

// NEW: Receipt storage functions
async function loadReceipts() {
  try {
    const receipts = await redis.get(RECEIPTS_KEY);
    console.log(
      `📋 Loaded ${receipts ? receipts.length : 0} receipts from Redis`
    );
    return receipts || [];
  } catch (error) {
    console.error("Error loading receipts from Redis:", error);
    return [];
  }
}

async function saveReceipts(receipts) {
  try {
    await redis.set(RECEIPTS_KEY, receipts);
    console.log(`💾 Saved ${receipts.length} receipts to Redis`);
  } catch (error) {
    console.error("Error saving receipts to Redis:", error);
    throw error;
  }
}

async function loadBoothSettings() {
  try {
    const settings = await redis.get(BOOTH_SETTINGS_KEY);
    return (
      settings || {
        location: "Rothschild Boulevard",
        status: "active",
        openTime: new Date().toISOString(),
        dailyGoal: 100,
      }
    );
  } catch (error) {
    console.error("Error loading booth settings from Redis:", error);
    return {
      location: "Rothschild Boulevard",
      status: "active",
      openTime: new Date().toISOString(),
      dailyGoal: 100,
    };
  }
}

async function saveBoothSettings(settings) {
  try {
    await redis.set(BOOTH_SETTINGS_KEY, settings);
    console.log("💾 Saved booth settings to Redis");
  } catch (error) {
    console.error("Error saving booth settings to Redis:", error);
    throw error;
  }
}

// API functions
async function addRegistration(data) {
  const registrations = await loadRegistrations();
  const newRegistration = {
    id: generateId(),
    name: data.name,
    email: data.email,
    language: data.language || "en",
    timestamp: data.timestamp || new Date().toISOString(),
    status: "pending",
    source: data.source || "manual",
  };

  registrations.unshift(newRegistration);
  await saveRegistrations(registrations);

  console.log(
    `📝 New registration: ${data.name} (${data.email}) - ID: ${newRegistration.id}`
  );
  return newRegistration;
}

// NEW: Receipt management functions
async function addReceipt(data) {
  const receipts = await loadReceipts();
  const newReceipt = {
    id: generateId(),
    receiptNumber: data.receiptNumber || generateReceiptNumber(),
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    amount: data.amount || 20,
    paymentMethod: data.paymentMethod || "cash",
    language: data.language || "en",
    timestamp: new Date().toISOString(),
    date: data.date || new Date().toLocaleDateString(),
    registrationId: data.registrationId || null, // Link to registration if applicable
  };

  receipts.unshift(newReceipt);
  await saveReceipts(receipts);

  console.log(
    `🧾 New receipt: ${newReceipt.receiptNumber} for ${data.customerName} - ₪${data.amount}`
  );
  return newReceipt;
}

async function updateReceipt(id, updates) {
  const receipts = await loadReceipts();
  const receiptIndex = receipts.findIndex((r) => r.id === id);

  if (receiptIndex === -1) {
    throw new Error("Receipt not found");
  }

  receipts[receiptIndex] = {
    ...receipts[receiptIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await saveReceipts(receipts);

  console.log(`✅ Receipt updated: ${receipts[receiptIndex].receiptNumber}`);

  return receipts[receiptIndex];
}

async function removeReceipt(id) {
  const receipts = await loadReceipts();
  const initialLength = receipts.length;
  const removedReceipt = receipts.find((r) => r.id === id);
  const filteredReceipts = receipts.filter((r) => r.id !== id);

  if (filteredReceipts.length === initialLength) {
    throw new Error("Receipt not found");
  }

  await saveReceipts(filteredReceipts);

  console.log(`🗑️ Receipt removed: ${removedReceipt?.receiptNumber}`);

  return removedReceipt;
}

async function getReceiptByNumber(receiptNumber) {
  const receipts = await loadReceipts();
  return receipts.find((r) => r.receiptNumber === receiptNumber);
}

async function getReceiptsByEmail(email) {
  const receipts = await loadReceipts();
  return receipts.filter(
    (r) => r.customerEmail.toLowerCase() === email.toLowerCase()
  );
}

async function getReceiptsByDateRange(startDate, endDate) {
  const receipts = await loadReceipts();
  const start = new Date(startDate);
  const end = new Date(endDate);

  return receipts.filter((r) => {
    const receiptDate = new Date(r.timestamp);
    return receiptDate >= start && receiptDate <= end;
  });
}

async function getAllData() {
  const registrations = await loadRegistrations();
  const receipts = await loadReceipts(); // NEW: Load receipts
  const boothSettings = await loadBoothSettings();
  const stats = calculateStats(registrations, receipts); // NEW: Include receipts in stats

  const enrichedRegistrations = registrations.map((reg) => ({
    ...reg,
    timeAgo: timeAgo(reg.timestamp),
  }));

  const enrichedReceipts = receipts.map((receipt) => ({
    ...receipt,
    timeAgo: timeAgo(receipt.timestamp),
  }));

  console.log(
    `📊 Returning data: ${registrations.length} registrations, ${receipts.length} receipts, ${stats.pending} pending`
  );

  return {
    registrations: enrichedRegistrations,
    receipts: enrichedReceipts, // NEW: Include receipts
    stats,
    boothSettings,
    lastUpdated: new Date().toISOString(),
  };
}

async function updateRegistration(id, updates) {
  const registrations = await loadRegistrations();
  const registrationIndex = registrations.findIndex((r) => r.id === id);

  if (registrationIndex === -1) {
    throw new Error("Registration not found");
  }

  registrations[registrationIndex] = {
    ...registrations[registrationIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await saveRegistrations(registrations);

  console.log(
    `✅ Registration updated: ${registrations[registrationIndex].name} -> ${updates.status}`
  );

  return registrations[registrationIndex];
}

async function removeRegistration(id) {
  const registrations = await loadRegistrations();
  const initialLength = registrations.length;
  const removedReg = registrations.find((r) => r.id === id);
  const filteredRegistrations = registrations.filter((r) => r.id !== id);

  if (filteredRegistrations.length === initialLength) {
    throw new Error("Registration not found");
  }

  await saveRegistrations(filteredRegistrations);

  console.log(
    `🗑️ Registration removed: ${removedReg?.name} (${removedReg?.email})`
  );

  return removedReg;
}

async function updateBoothSettings(settings) {
  const currentSettings = await loadBoothSettings();
  const newSettings = { ...currentSettings, ...settings };
  await saveBoothSettings(newSettings);
  return newSettings;
}

module.exports = {
  // Existing functions
  addRegistration,
  getAllData,
  updateRegistration,
  removeRegistration,
  updateBoothSettings,

  // NEW: Receipt functions
  addReceipt,
  updateReceipt,
  removeReceipt,
  getReceiptByNumber,
  getReceiptsByEmail,
  getReceiptsByDateRange,
};
