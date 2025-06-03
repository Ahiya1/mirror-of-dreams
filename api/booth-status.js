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

    // Use configurable booth hours (with fallbacks)
    const openHour = boothSettings.openHour || 10;
    const closeHour = boothSettings.closeHour || 22;
    const isWithinHours = currentHour >= openHour && currentHour < closeHour;
    const isWeekend = now.getDay() === 0 || now.getDay() === 6; // Sunday or Saturday

    // Format hours for display (12-hour format for English, 24-hour for Hebrew)
    const formatHour = (hour, lang) => {
      if (lang === "he") {
        return `${hour.toString().padStart(2, "0")}:00`;
      } else {
        const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const ampm = hour >= 12 ? "PM" : "AM";
        return `${hour12} ${ampm}`;
      }
    };

    const openTime = {
      en: formatHour(openHour, "en"),
      he: formatHour(openHour, "he"),
    };

    const closeTime = {
      en: formatHour(closeHour, "en"),
      he: formatHour(closeHour, "he"),
    };

    // Determine operational status
    let operationalStatus = "closed";
    let statusMessage = "";

    if (boothSettings.status === "active") {
      if (isWithinHours) {
        operationalStatus = "open";
        statusMessage = isWeekend
          ? `Open today until ${closeTime.en}`
          : `Open until ${closeTime.en}`;
      } else if (currentHour < openHour) {
        operationalStatus = "opening_later";
        statusMessage = `Opens at ${openTime.en}`;
      } else {
        operationalStatus = "closed_for_day";
        statusMessage = `Closed for today • Opens ${openTime.en} tomorrow`;
      }
    } else if (boothSettings.status === "maintenance") {
      operationalStatus = "maintenance";
      statusMessage = "Temporarily closed for maintenance";
    } else {
      operationalStatus = "inactive";
      statusMessage = "Currently inactive";
    }

    // Handle bilingual location
    let location;
    if (typeof boothSettings.location === "object") {
      // New bilingual format
      location = {
        en: boothSettings.location.en || "Location TBA",
        he: boothSettings.location.he || "מיקום יעודכן",
      };
    } else {
      // Legacy single-language format - convert to bilingual
      location = {
        en: boothSettings.location || "Location TBA",
        he: boothSettings.location || "מיקום יעודכן",
      };
    }

    // Public booth information (safe to expose)
    const publicBoothInfo = {
      location: location,
      status: operationalStatus,
      statusMessage: statusMessage,
      isOpen: operationalStatus === "open",
      lastUpdated: new Date().toISOString(),

      // Additional helpful info
      generalHours: `${openTime.en} - ${closeTime.en} daily`,
      paymentMethods: ["cash", "bit"],

      // Localized status messages
      statusMessages: {
        en: statusMessage,
        he: getHebrewStatusMessage(
          operationalStatus,
          currentHour,
          isWeekend,
          openTime.he,
          closeTime.he
        ),
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
        location: {
          en: "Rothschild Boulevard, Tel Aviv",
          he: "שדרות רוטשילד, תל אביב",
        },
        status: "unknown",
        statusMessage: "Status currently unavailable",
        isOpen: false,
        lastUpdated: new Date().toISOString(),
        generalHours: "10 AM - 10 PM daily", // Fallback hours
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

function getHebrewStatusMessage(
  operationalStatus,
  currentHour,
  isWeekend,
  openTime,
  closeTime
) {
  switch (operationalStatus) {
    case "open":
      return isWeekend ? `פתוח היום עד ${closeTime}` : `פתוח עד ${closeTime}`;
    case "opening_later":
      return `נפתח ב-${openTime}`;
    case "closed_for_day":
      return `סגור להיום • נפתח מחר ב-${openTime}`;
    case "maintenance":
      return "סגור זמנית לתחזוקה";
    case "inactive":
      return "לא פעיל כרגע";
    default:
      return "סטטוס לא זמין";
  }
}
