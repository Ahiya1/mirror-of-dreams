/* =========================================================================
   FILE: lib/admin-data.js
   Shared admin data logic
   ========================================================================= */

// In-memory storage for registrations (synced across all admin sessions)
let registrations = [];
let boothSettings = {
  location: "Rothschild Boulevard",
  status: "active",
  openTime: new Date().toISOString(),
  dailyGoal: 100,
};

// Helper functions
function generateId() {
  return Date.now() + Math.random().toString(36).substr(2, 9);
}

function calculateStats() {
  const now = new Date();
  const today = now.toDateString();

  const todayRegistrations = registrations.filter(
    (r) => new Date(r.timestamp).toDateString() === today
  );

  const pending = registrations.filter((r) => r.status === "pending");
  const completed = registrations.filter((r) => r.status === "completed");

  return {
    pending: pending.length,
    today: todayRegistrations.length,
    revenue: completed.length * 20, // 20 NIS per reflection
    total: registrations.length,
    completionRate:
      registrations.length > 0
        ? Math.round((completed.length / registrations.length) * 100)
        : 0,
  };
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

export function addRegistration(data) {
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
  console.log(`📝 New registration: ${data.name} (${data.email})`);
  return newRegistration;
}

export function getAllData() {
  const stats = calculateStats();
  const enrichedRegistrations = registrations.map((reg) => ({
    ...reg,
    timeAgo: timeAgo(reg.timestamp),
  }));

  return {
    registrations: enrichedRegistrations,
    stats,
    boothSettings,
    lastUpdated: new Date().toISOString(),
  };
}

export function updateRegistration(id, updates) {
  const registrationIndex = registrations.findIndex((r) => r.id === id);
  if (registrationIndex === -1) {
    throw new Error("Registration not found");
  }

  registrations[registrationIndex] = {
    ...registrations[registrationIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  console.log(
    `✅ Registration updated: ${registrations[registrationIndex].name} -> ${updates.status}`
  );

  return registrations[registrationIndex];
}

export function removeRegistration(id) {
  const initialLength = registrations.length;
  const removedReg = registrations.find((r) => r.id === id);
  registrations = registrations.filter((r) => r.id !== id);

  if (registrations.length === initialLength) {
    throw new Error("Registration not found");
  }

  console.log(
    `🗑️ Registration removed: ${removedReg?.name} (${removedReg?.email})`
  );

  return removedReg;
}

export function updateBoothSettings(settings) {
  boothSettings = { ...boothSettings, ...settings };
  return boothSettings;
}

export function importFromStorage(existingRegistrations) {
  if (existingRegistrations && Array.isArray(existingRegistrations)) {
    existingRegistrations.forEach((reg) => {
      if (
        !registrations.find(
          (r) => r.email === reg.email && r.timestamp === reg.timestamp
        )
      ) {
        registrations.push({
          ...reg,
          id: reg.id || generateId(),
        });
      }
    });
  }
}
