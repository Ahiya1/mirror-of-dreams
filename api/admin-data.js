/* =========================================================================
   FILE: api/admin-data.js
   Sacred data management for Mirror of Truth admin panel
   =========================== */

import {
  addRegistration,
  getAllData,
  updateRegistration,
  removeRegistration,
  updateBoothSettings,
} from "../lib/storage.js";

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Debug environment variable
  if (!process.env.CREATOR_SECRET_KEY) {
    console.error("🚨 CREATOR_SECRET_KEY not found in environment");
    return res.status(500).json({
      success: false,
      error: "Server configuration error - missing secret key",
    });
  }

  // Simple auth check
  const authKey = req.headers.authorization || req.query.key;
  console.log("🔐 Auth check for admin-data:", {
    hasAuthKey: !!authKey,
    hasEnvKey: !!process.env.CREATOR_SECRET_KEY,
    keysMatch: authKey === process.env.CREATOR_SECRET_KEY,
  });

  if (authKey !== process.env.CREATOR_SECRET_KEY) {
    console.log("❌ Auth failed for admin-data");
    return res.status(401).json({
      success: false,
      error: "Unauthorized access to sacred admin data",
    });
  }

  try {
    // GET - Fetch all admin data
    if (req.method === "GET") {
      const data = getAllData();
      console.log(
        `📊 Returning ${data.registrations.length} registrations to admin`
      );
      return res.json({
        success: true,
        data,
      });
    }

    // POST - Add new registration or update settings
    if (req.method === "POST") {
      const { action, ...data } = req.body;

      switch (action) {
        case "addRegistration":
          const newRegistration = addRegistration(data);
          const allData = getAllData();
          return res.json({
            success: true,
            data: allData,
            message: "Registration added successfully",
          });

        case "updateBoothSettings":
          updateBoothSettings(data.settings);
          const updatedData = getAllData();
          return res.json({
            success: true,
            data: updatedData,
            message: "Booth settings updated successfully",
          });

        default:
          return res.status(400).json({
            success: false,
            error: "Unknown action",
          });
      }
    }

    // PUT - Update existing registration
    if (req.method === "PUT") {
      const { id, updates } = req.body;

      try {
        updateRegistration(id, updates);
        const data = getAllData();
        return res.json({
          success: true,
          data: { registrations: data.registrations, stats: data.stats },
          message: "Registration updated successfully",
        });
      } catch (error) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
    }

    // DELETE - Remove registration
    if (req.method === "DELETE") {
      const { id } = req.query;

      try {
        removeRegistration(id);
        const data = getAllData();
        return res.json({
          success: true,
          data: { registrations: data.registrations, stats: data.stats },
          message: "Registration removed successfully",
        });
      } catch (error) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
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
}
