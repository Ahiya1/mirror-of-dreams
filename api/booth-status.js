/* =========================================================================
   FILE: api/booth-status.js
   Public API to get current booth status and location
   No authentication required - public information for visitors
   ========================================================================= */

const { loadBoothSettings } = require("../lib/redis-storage.js");

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    // Load booth settings from Redis
    const boothSettings = await loadBoothSettings();

    // Calculate if booth is currently "open" based on time and status
    const now = new Date();
    const currentHour = now.getHours();

    // Default booth hours: 10 AM - 10 PM (can be made configurable later)
    const isWithinHours = currentHour >= 10 && currentHour < 22;
    const isWeekend = now.getDay() === 0 || now.getDay() === 6; // Sunday or Saturday

    // Determine operational status
    let operationalStatus = "closed";
    let statusMessage = "";

    if (boothSettings.status === "active") {
      if (isWithinHours) {
        operationalStatus = "open";
        statusMessage = isWeekend
          ? "Open today until 10 PM"
          : "Open until 10 PM";
      } else if (currentHour < 10) {
        operationalStatus = "opening_later";
        statusMessage = "Opens at 10 AM";
      } else {
        operationalStatus = "closed_for_day";
        statusMessage = "Closed for today • Opens 10 AM tomorrow";
      }
    } else if (boothSettings.status === "maintenance") {
      operationalStatus = "maintenance";
      statusMessage = "Temporarily closed for maintenance";
    } else {
      operationalStatus = "inactive";
      statusMessage = "Currently inactive";
    }

    // Public booth information (safe to expose)
    const publicBoothInfo = {
      location: boothSettings.location || "Location TBA",
      status: operationalStatus,
      statusMessage: statusMessage,
      isOpen: operationalStatus === "open",
      lastUpdated: new Date().toISOString(),

      // Additional helpful info
      generalHours: "10 AM - 10 PM daily",
      paymentMethods: ["cash", "bit"],

      // Localized status messages
      statusMessages: {
        en: statusMessage,
        he: getHebrewStatusMessage(operationalStatus, currentHour, isWeekend),
      },
    };

    return res.json({
      success: true,
      booth: publicBoothInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Booth Status API Error:", error);

    // Return fallback information if database is unavailable
    return res.json({
      success: true,
      booth: {
        location: "Rothschild Boulevard, Tel Aviv",
        status: "unknown",
        statusMessage: "Status currently unavailable",
        isOpen: false,
        lastUpdated: new Date().toISOString(),
        generalHours: "10 AM - 10 PM daily",
        paymentMethods: ["cash", "bit"],
        statusMessages: {
          en: "Status currently unavailable",
          he: "סטטוס לא זמין כרגע",
        },
      },
      timestamp: new Date().toISOString(),
      fallback: true,
    });
  }
};

function getHebrewStatusMessage(operationalStatus, currentHour, isWeekend) {
  switch (operationalStatus) {
    case "open":
      return isWeekend ? "פתוח היום עד 22:00" : "פתוח עד 22:00";
    case "opening_later":
      return "נפתח ב-10:00";
    case "closed_for_day":
      return "סגור להיום • נפתח מחר ב-10:00";
    case "maintenance":
      return "סגור זמנית לתחזוקה";
    case "inactive":
      return "לא פעיל כרגע";
    default:
      return "סטטוס לא זמין";
  }
}
