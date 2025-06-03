const {
  getAllData,
  // NEW: Receipt functions only
  addReceipt,
  updateReceipt,
  removeReceipt,
  getReceiptByNumber,
  getReceiptsByEmail,
  getReceiptsByDateRange,
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

    // GET - Fetch receipt data only
    if (req.method === "GET") {
      const { filter } = req.query;

      const data = await getAllData();

      // Always return receipts-focused data for online version
      return res.json({
        success: true,
        data: {
          receipts: data.receipts,
          stats: data.stats,
          lastUpdated: data.lastUpdated,
        },
      });
    }

    // POST - Add receipt or search receipts
    if (req.method === "POST") {
      const { action, ...data } = req.body;

      switch (action) {
        // NEW: Add receipt
        case "addReceipt":
          const newReceipt = await addReceipt(data);
          const receiptData = await getAllData();
          return res.json({
            success: true,
            data: receiptData,
            message: "Receipt added successfully",
            receipt: newReceipt,
          });

        // NEW: Search receipts
        case "searchReceipts":
          let searchResults = [];
          if (data.receiptNumber) {
            const receipt = await getReceiptByNumber(data.receiptNumber);
            searchResults = receipt ? [receipt] : [];
          } else if (data.email) {
            searchResults = await getReceiptsByEmail(data.email);
          } else if (data.startDate && data.endDate) {
            searchResults = await getReceiptsByDateRange(
              data.startDate,
              data.endDate
            );
          }

          return res.json({
            success: true,
            receipts: searchResults,
            message: `Found ${searchResults.length} receipts`,
          });

        default:
          return res.status(400).json({
            success: false,
            error: "Unknown action",
          });
      }
    }

    // PUT - Update existing receipt
    if (req.method === "PUT") {
      const { type, id, updates } = req.body;

      try {
        if (type === "receipt") {
          await updateReceipt(id, updates);
        } else {
          return res.status(400).json({
            success: false,
            error: "Only receipt updates supported in online version",
          });
        }

        const data = await getAllData();
        return res.json({
          success: true,
          data: data,
          message: "Receipt updated successfully",
        });
      } catch (error) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
    }

    // DELETE - Remove receipt
    if (req.method === "DELETE") {
      const { id, type } = req.query;

      try {
        if (type === "receipt" || !type) {
          // Default to receipt for online version
          await removeReceipt(id);
        } else {
          return res.status(400).json({
            success: false,
            error: "Only receipt deletion supported in online version",
          });
        }

        const data = await getAllData();
        return res.json({
          success: true,
          data: data,
          message: "Receipt removed successfully",
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
