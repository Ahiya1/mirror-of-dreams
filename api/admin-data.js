const {
  addRegistration,
  getAllData,
  updateRegistration,
  removeRegistration,
  updateBoothSettings,
} = require("../lib/redis-storage.js");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (!process.env.CREATOR_SECRET_KEY) {
    console.error("🚨 CREATOR_SECRET_KEY not found in environment");
    return res.status(500).json({
      success: false,
      error: "Server configuration error - missing secret key",
    });
  }

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
    console.log(`📡 Admin request: ${req.method} to /api/admin-data`);

    // GET - Fetch all admin data (FIXED: properly await)
    if (req.method === "GET") {
      const data = await getAllData(); // Added await!
      console.log(
        `📊 Returning ${data.registrations.length} registrations to admin`
      );
      return res.json({
        success: true,
        data,
      });
    }

    // POST - Add new registration or update settings (FIXED: properly await)
    if (req.method === "POST") {
      const { action, ...data } = req.body;

      switch (action) {
        case "addRegistration":
          const newRegistration = await addRegistration(data); // Added await!
          const allData = await getAllData(); // Added await!
          return res.json({
            success: true,
            data: allData,
            message: "Registration added successfully",
          });

        case "updateBoothSettings":
          await updateBoothSettings(data.settings); // Added await!
          const updatedData = await getAllData(); // Added await!
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

    // PUT - Update existing registration (FIXED: properly await)
    if (req.method === "PUT") {
      const { id, updates } = req.body;

      try {
        await updateRegistration(id, updates); // Added await!
        const data = await getAllData(); // Added await!
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

    // DELETE - Remove registration (FIXED: properly await)
    if (req.method === "DELETE") {
      const { id } = req.query;

      try {
        await removeRegistration(id); // Added await!
        const data = await getAllData(); // Added await!
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
};
