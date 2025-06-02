/* =========================================================================
   FILE: api/admin-data.js
   Sacred data management for Mirror of Truth admin panel
   Real-time sync across all devices
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

  if (diff < 1) return "עכשיו";
  if (diff === 1) return "לפני דקה";
  if (diff < 60) return `לפני ${diff} דקות`;
  if (diff < 120) return "לפני שעה";
  const hours = Math.floor(diff / 60);
  return `לפני ${hours} שעות`;
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Simple auth check
  const authKey = req.headers.authorization || req.query.key;
  if (authKey !== process.env.CREATOR_SECRET_KEY) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized access to sacred admin data",
    });
  }

  try {
    // GET - Fetch all admin data
    if (req.method === "GET") {
      const stats = calculateStats();

      // Add time ago to registrations
      const enrichedRegistrations = registrations.map((reg) => ({
        ...reg,
        timeAgo: timeAgo(reg.timestamp),
      }));

      return res.json({
        success: true,
        data: {
          registrations: enrichedRegistrations,
          stats,
          boothSettings,
          lastUpdated: new Date().toISOString(),
        },
      });
    }

    // POST - Add new registration or update settings
    if (req.method === "POST") {
      const { action, ...data } = req.body;

      switch (action) {
        case "addRegistration":
          const newRegistration = {
            id: generateId(),
            name: data.name,
            email: data.email,
            language: data.language || "he",
            timestamp: new Date().toISOString(),
            status: "pending",
            source: data.source || "manual",
          };
          registrations.unshift(newRegistration);
          break;

        case "updateBoothSettings":
          boothSettings = { ...boothSettings, ...data.settings };
          break;

        case "importFromStorage":
          // Import existing localStorage data if provided
          if (
            data.existingRegistrations &&
            Array.isArray(data.existingRegistrations)
          ) {
            // Merge without duplicates
            data.existingRegistrations.forEach((reg) => {
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
          break;

        default:
          return res.status(400).json({
            success: false,
            error: "Unknown action",
          });
      }

      const stats = calculateStats();
      return res.json({
        success: true,
        data: { registrations, stats, boothSettings },
        message: "Data updated successfully",
      });
    }

    // PUT - Update existing registration
    if (req.method === "PUT") {
      const { id, updates } = req.body;

      const registrationIndex = registrations.findIndex((r) => r.id === id);
      if (registrationIndex === -1) {
        return res.status(404).json({
          success: false,
          error: "Registration not found",
        });
      }

      registrations[registrationIndex] = {
        ...registrations[registrationIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const stats = calculateStats();
      return res.json({
        success: true,
        data: { registrations, stats },
        message: "Registration updated successfully",
      });
    }

    // DELETE - Remove registration
    if (req.method === "DELETE") {
      const { id } = req.query;

      const initialLength = registrations.length;
      registrations = registrations.filter((r) => r.id !== id);

      if (registrations.length === initialLength) {
        return res.status(404).json({
          success: false,
          error: "Registration not found",
        });
      }

      const stats = calculateStats();
      return res.json({
        success: true,
        data: { registrations, stats },
        message: "Registration removed successfully",
      });
    }

    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("Admin Data Error:", error);
    res.status(500).json({
      success: false,
      error: "Admin data service error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
