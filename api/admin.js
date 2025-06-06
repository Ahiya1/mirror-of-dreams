// API: Admin - Sacred Administration (Updated with Gift Support)

const {
  getAllData,
  addReceipt,
  updateReceipt,
  removeReceipt,
  getReceiptByNumber,
  getReceiptsByEmail,
  getReceiptsByDateRange,
  removeGift,
  getGiftByCode,
} = require("../lib/storage.js");

// Main handler
module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    if (req.method === "GET") {
      if (action === "auth" || action === "check-auth") {
        return await handleAuthCheck(req, res);
      } else {
        return await handleGetData(req, res);
      }
    }

    if (req.method === "POST") {
      const { action } = req.body;

      if (action === "auth" || action === "authenticate") {
        return await handleAuthenticate(req, res);
      } else {
        return await handlePostData(req, res);
      }
    }

    if (req.method === "PUT") {
      return await handleUpdateData(req, res);
    }

    if (req.method === "DELETE") {
      return await handleDeleteData(req, res);
    }

    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("Admin API Error:", error);
    return res.status(500).json({
      success: false,
      error: "Admin service error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Authentication check
async function handleAuthCheck(req, res) {
  const { key } = req.query;

  if (key === process.env.CREATOR_SECRET_KEY) {
    return res.json({
      success: true,
      authenticated: true,
    });
  }

  return res.status(401).json({
    success: false,
    authenticated: false,
  });
}

// Authentication
async function handleAuthenticate(req, res) {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      error: "Password required",
    });
  }

  // Use the same creator secret key for admin access
  if (password === process.env.CREATOR_SECRET_KEY) {
    console.log(`🔐 Admin authenticated at ${new Date().toISOString()}`);
    return res.json({
      success: true,
      message: "Welcome to the sacred admin space",
      timestamp: new Date().toISOString(),
    });
  }

  console.log(`❌ Failed admin auth attempt at ${new Date().toISOString()}`);
  return res.status(401).json({
    success: false,
    error: "Invalid admin credentials",
  });
}

// Get admin data
async function handleGetData(req, res) {
  if (!process.env.CREATOR_SECRET_KEY) {
    console.error("🚨 CREATOR_SECRET_KEY not found in environment");
    return res.status(500).json({
      success: false,
      error: "Server configuration error - missing secret key",
    });
  }

  const authKey = req.headers.authorization || req.query.key;
  console.log("🔐 Auth check for admin data:", {
    hasAuthKey: !!authKey,
    hasEnvKey: !!process.env.CREATOR_SECRET_KEY,
    keysMatch: authKey === process.env.CREATOR_SECRET_KEY,
  });

  if (authKey !== process.env.CREATOR_SECRET_KEY) {
    console.log("❌ Auth failed for admin data");
    return res.status(401).json({
      success: false,
      error: "Unauthorized access to sacred admin data",
    });
  }

  try {
    console.log(`📡 Admin request: ${req.method} to admin data`);

    const data = await getAllData();

    // Return complete data including both receipts and gifts
    return res.json({
      success: true,
      data: {
        receipts: data.receipts,
        gifts: data.gifts,
        stats: data.stats,
        lastUpdated: data.lastUpdated,
      },
    });
  } catch (error) {
    console.error("Error loading admin data:", error);
    throw error;
  }
}

// Post admin data
async function handlePostData(req, res) {
  const authKey = req.headers.authorization || req.query.key;

  if (authKey !== process.env.CREATOR_SECRET_KEY) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized access to sacred admin data",
    });
  }

  const { action, ...data } = req.body;

  try {
    switch (action) {
      case "addReceipt":
        const newReceipt = await addReceipt(data);
        const receiptData = await getAllData();
        return res.json({
          success: true,
          data: receiptData,
          message: "Receipt added successfully",
          receipt: newReceipt,
        });

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
  } catch (error) {
    console.error("Error in admin post data:", error);
    throw error;
  }
}

// Update admin data
async function handleUpdateData(req, res) {
  const authKey = req.headers.authorization || req.query.key;

  if (authKey !== process.env.CREATOR_SECRET_KEY) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized access to sacred admin data",
    });
  }

  const { type, id, updates } = req.body;

  try {
    if (type === "receipt") {
      await updateReceipt(id, updates);
    } else {
      return res.status(400).json({
        success: false,
        error: "Only receipt updates supported currently",
      });
    }

    const data = await getAllData();
    return res.json({
      success: true,
      data: data,
      message: "Receipt updated successfully",
    });
  } catch (error) {
    if (error.message === "Receipt not found") {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    throw error;
  }
}

// Delete admin data
async function handleDeleteData(req, res) {
  const authKey = req.headers.authorization || req.query.key;

  if (authKey !== process.env.CREATOR_SECRET_KEY) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized access to sacred admin data",
    });
  }

  const { id, type } = req.query;

  try {
    if (type === "receipt" || !type) {
      // Default to receipt for backward compatibility
      await removeReceipt(id);
      console.log(`🗑️ Receipt deleted: ${id}`);
    } else if (type === "gift") {
      await removeGift(id);
      console.log(`🗑️ Gift deleted: ${id}`);
    } else {
      return res.status(400).json({
        success: false,
        error: "Invalid type. Supported types: receipt, gift",
      });
    }

    const data = await getAllData();
    return res.json({
      success: true,
      data: data,
      message: `${type || "receipt"} removed successfully`,
    });
  } catch (error) {
    if (
      error.message === "Receipt not found" ||
      error.message === "Gift not found"
    ) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    throw error;
  }
}
