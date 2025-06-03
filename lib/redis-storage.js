/* =========================================================================
   FILE: lib/redis-storage.js (ONLINE VERSION)
   Upstash Redis storage for Mirror of Truth - Receipt Management Only
   ========================================================================= */

const { Redis } = require("@upstash/redis");

// Initialize Redis connection
const redis = Redis.fromEnv();

const RECEIPTS_KEY = "mirror:receipts";

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

function calculateStats(receipts) {
  const now = new Date();
  const today = now.toDateString();

  const todayReceipts = receipts.filter(
    (r) => new Date(r.timestamp).toDateString() === today
  );

  const totalRevenue = receipts.reduce(
    (sum, receipt) => sum + (receipt.amount || 0),
    0
  );
  const todayRevenue = todayReceipts.reduce(
    (sum, receipt) => sum + (receipt.amount || 0),
    0
  );

  return {
    totalRevenue: totalRevenue,
    todayRevenue: todayRevenue,
    totalReceipts: receipts.length,
    todayReceipts: todayReceipts.length,
  };
}

// Receipt storage functions
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

// Receipt management functions
async function addReceipt(data) {
  const receipts = await loadReceipts();
  const newReceipt = {
    id: generateId(),
    receiptNumber: data.receiptNumber || generateReceiptNumber(),
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    amount: data.amount || 20,
    paymentMethod: data.paymentMethod || "paypal",
    language: data.language || "en",
    timestamp: new Date().toISOString(),
    date: data.date || new Date().toLocaleDateString(),
    registrationId: data.registrationId || null, // For future linking if needed
  };

  receipts.unshift(newReceipt);
  await saveReceipts(receipts);

  console.log(
    `🧾 New receipt: ${newReceipt.receiptNumber} for ${data.customerName} - $${data.amount}`
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
  const receipts = await loadReceipts();
  const stats = calculateStats(receipts);

  const enrichedReceipts = receipts.map((receipt) => ({
    ...receipt,
    timeAgo: timeAgo(receipt.timestamp),
  }));

  console.log(
    `📊 Returning data: ${receipts.length} receipts, $${stats.totalRevenue} total revenue`
  );

  return {
    receipts: enrichedReceipts,
    stats,
    lastUpdated: new Date().toISOString(),
  };
}

module.exports = {
  // Receipt functions
  addReceipt,
  updateReceipt,
  removeReceipt,
  getReceiptByNumber,
  getReceiptsByEmail,
  getReceiptsByDateRange,
  loadReceipts,
  getAllData,
};
