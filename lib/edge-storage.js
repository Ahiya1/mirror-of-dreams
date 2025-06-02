/* =========================================================================
   FILE: lib/edge-storage.js
   Vercel Edge Config storage for Mirror of Truth
   ========================================================================= */

const { get, set } = require("@vercel/edge-config");

const REGISTRATIONS_KEY = "registrations";
const BOOTH_SETTINGS_KEY = "booth-settings";

// Helper functions
function generateId() {
  return Date.now() + Math.random().toString(36).substr(2, 9);
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

function calculateStats(registrations) {
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
    revenue: completed.length * 20,
    total: registrations.length,
    completionRate:
      registrations.length > 0
        ? Math.round((completed.length / registrations.length) * 100)
        : 0,
  };
}

// Storage functions
async function loadRegistrations() {
  try {
    const registrations = await get(REGISTRATIONS_KEY);
    console.log(
      `📖 Loaded ${
        registrations ? registrations.length : 0
      } registrations from Edge Config`
    );
    return registrations || [];
  } catch (error) {
    console.error("Error loading registrations from Edge Config:", error);
    return [];
  }
}

async function saveRegistrations(registrations) {
  try {
    // Edge Config updates via API
    const response = await fetch(
      `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              operation: "upsert",
              key: REGISTRATIONS_KEY,
              value: registrations,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Edge Config update failed: ${response.status}`);
    }

    console.log(
      `💾 Saved ${registrations.length} registrations to Edge Config`
    );
  } catch (error) {
    console.error("Error saving registrations to Edge Config:", error);
    throw error;
  }
}

async function loadBoothSettings() {
  try {
    const settings = await get(BOOTH_SETTINGS_KEY);
    return (
      settings || {
        location: "Rothschild Boulevard",
        status: "active",
        openTime: new Date().toISOString(),
        dailyGoal: 100,
      }
    );
  } catch (error) {
    console.error("Error loading booth settings from Edge Config:", error);
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
    const response = await fetch(
      `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              operation: "upsert",
              key: BOOTH_SETTINGS_KEY,
              value: settings,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Edge Config update failed: ${response.status}`);
    }

    console.log("💾 Saved booth settings to Edge Config");
  } catch (error) {
    console.error("Error saving booth settings to Edge Config:", error);
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

async function getAllData() {
  const registrations = await loadRegistrations();
  const boothSettings = await loadBoothSettings();
  const stats = calculateStats(registrations);

  const enrichedRegistrations = registrations.map((reg) => ({
    ...reg,
    timeAgo: timeAgo(reg.timestamp),
  }));

  console.log(
    `📊 Returning data: ${registrations.length} registrations, ${stats.pending} pending`
  );

  return {
    registrations: enrichedRegistrations,
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
  addRegistration,
  getAllData,
  updateRegistration,
  removeRegistration,
  updateBoothSettings,
};
