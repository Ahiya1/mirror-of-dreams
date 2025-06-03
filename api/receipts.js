/* =========================================================================
   FILE: api/receipts.js
   Dedicated Receipt Management API for Mirror of Truth
   ========================================================================= */

const {
  addReceipt,
  updateReceipt,
  removeReceipt,
  getReceiptByNumber,
  getReceiptsByEmail,
  getReceiptsByDateRange,
  loadReceipts,
} = require("../lib/redis-storage.js");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Auth check for all receipt operations
  const authKey = req.headers.authorization || req.query.key;
  if (authKey !== process.env.CREATOR_SECRET_KEY) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized access to receipt data",
    });
  }

  try {
    console.log(`🧾 Receipt API: ${req.method} ${req.url}`);

    if (req.method === "GET") {
      return await handleGetReceipts(req, res);
    }

    if (req.method === "POST") {
      return await handleCreateReceipt(req, res);
    }

    if (req.method === "PUT") {
      return await handleUpdateReceipt(req, res);
    }

    if (req.method === "DELETE") {
      return await handleDeleteReceipt(req, res);
    }

    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("Receipt API Error:", error);
    res.status(500).json({
      success: false,
      error: "Receipt service error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

async function handleGetReceipts(req, res) {
  const {
    receiptNumber,
    email,
    startDate,
    endDate,
    paymentMethod,
    limit = 100,
    offset = 0,
    export: exportFormat,
  } = req.query;

  let receipts = [];

  try {
    if (receiptNumber) {
      // Get specific receipt by number
      const receipt = await getReceiptByNumber(receiptNumber);
      receipts = receipt ? [receipt] : [];
    } else if (email) {
      // Get receipts by email
      receipts = await getReceiptsByEmail(email);
    } else if (startDate && endDate) {
      // Get receipts by date range
      receipts = await getReceiptsByDateRange(startDate, endDate);
    } else {
      // Get all receipts
      receipts = await loadReceipts();
    }

    // Apply payment method filter
    if (paymentMethod && paymentMethod !== "all") {
      receipts = receipts.filter((r) => r.paymentMethod === paymentMethod);
    }

    // Sort by timestamp (newest first)
    receipts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination
    const total = receipts.length;
    const paginatedReceipts = receipts.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    );

    // Handle export request
    if (exportFormat === "csv") {
      return handleExportCSV(res, receipts);
    }

    if (exportFormat === "json") {
      return handleExportJSON(res, receipts);
    }

    // Calculate summary statistics
    const stats = calculateReceiptStats(receipts);

    return res.json({
      success: true,
      receipts: paginatedReceipts.map(addTimeAgo),
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total,
      },
      stats,
      filters: {
        receiptNumber,
        email,
        startDate,
        endDate,
        paymentMethod,
      },
    });
  } catch (error) {
    console.error("Error fetching receipts:", error);
    throw error;
  }
}

async function handleCreateReceipt(req, res) {
  const {
    customerName,
    customerEmail,
    amount,
    paymentMethod,
    language = "en",
    registrationId = null,
  } = req.body;

  if (!customerName || !customerEmail || amount === undefined) {
    return res.status(400).json({
      success: false,
      error: "Customer name, email, and amount are required",
    });
  }

  try {
    const newReceipt = await addReceipt({
      customerName,
      customerEmail,
      amount: parseFloat(amount),
      paymentMethod: paymentMethod || "cash",
      language,
      registrationId,
    });

    console.log(`✅ Receipt created via API: ${newReceipt.receiptNumber}`);

    return res.json({
      success: true,
      receipt: addTimeAgo(newReceipt),
      message: "Receipt created successfully",
    });
  } catch (error) {
    console.error("Error creating receipt:", error);
    throw error;
  }
}

async function handleUpdateReceipt(req, res) {
  const { id } = req.query;
  const updates = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: "Receipt ID is required",
    });
  }

  try {
    const updatedReceipt = await updateReceipt(id, updates);

    return res.json({
      success: true,
      receipt: addTimeAgo(updatedReceipt),
      message: "Receipt updated successfully",
    });
  } catch (error) {
    if (error.message === "Receipt not found") {
      return res.status(404).json({
        success: false,
        error: "Receipt not found",
      });
    }
    throw error;
  }
}

async function handleDeleteReceipt(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: "Receipt ID is required",
    });
  }

  try {
    const deletedReceipt = await removeReceipt(id);

    return res.json({
      success: true,
      receipt: deletedReceipt,
      message: "Receipt deleted successfully",
    });
  } catch (error) {
    if (error.message === "Receipt not found") {
      return res.status(404).json({
        success: false,
        error: "Receipt not found",
      });
    }
    throw error;
  }
}

function handleExportCSV(res, receipts) {
  const csvHeaders = [
    "Receipt Number",
    "Customer Name",
    "Customer Email",
    "Amount",
    "Payment Method",
    "Language",
    "Date",
    "Timestamp",
    "Registration ID",
  ];

  const csvRows = receipts.map((receipt) => [
    receipt.receiptNumber,
    `"${receipt.customerName}"`,
    `"${receipt.customerEmail}"`,
    receipt.amount,
    receipt.paymentMethod,
    receipt.language,
    `"${receipt.date}"`,
    `"${receipt.timestamp}"`,
    receipt.registrationId || "",
  ]);

  const csvContent = [
    csvHeaders.join(","),
    ...csvRows.map((row) => row.join(",")),
  ].join("\n");

  const filename = `mirror-receipts-${
    new Date().toISOString().split("T")[0]
  }.csv`;

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csvContent);
}

function handleExportJSON(res, receipts) {
  const filename = `mirror-receipts-${
    new Date().toISOString().split("T")[0]
  }.json`;

  const exportData = {
    exportDate: new Date().toISOString(),
    totalReceipts: receipts.length,
    receipts: receipts,
    summary: calculateReceiptStats(receipts),
  };

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.json(exportData);
}

function calculateReceiptStats(receipts) {
  const totalAmount = receipts.reduce(
    (sum, receipt) => sum + (receipt.amount || 0),
    0
  );
  const totalCount = receipts.length;

  const byPaymentMethod = receipts.reduce((acc, receipt) => {
    const method = receipt.paymentMethod || "unknown";
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {});

  const byLanguage = receipts.reduce((acc, receipt) => {
    const lang = receipt.language || "unknown";
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {});

  // Calculate date-based stats
  const today = new Date().toDateString();
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  const todayReceipts = receipts.filter(
    (r) => new Date(r.timestamp).toDateString() === today
  );
  const thisMonthReceipts = receipts.filter(
    (r) =>
      new Date(r.timestamp).getMonth() === thisMonth &&
      new Date(r.timestamp).getFullYear() === thisYear
  );
  const thisYearReceipts = receipts.filter(
    (r) => new Date(r.timestamp).getFullYear() === thisYear
  );

  return {
    total: {
      count: totalCount,
      amount: totalAmount,
    },
    today: {
      count: todayReceipts.length,
      amount: todayReceipts.reduce((sum, r) => sum + (r.amount || 0), 0),
    },
    thisMonth: {
      count: thisMonthReceipts.length,
      amount: thisMonthReceipts.reduce((sum, r) => sum + (r.amount || 0), 0),
    },
    thisYear: {
      count: thisYearReceipts.length,
      amount: thisYearReceipts.reduce((sum, r) => sum + (r.amount || 0), 0),
    },
    byPaymentMethod,
    byLanguage,
    averageAmount: totalCount > 0 ? totalAmount / totalCount : 0,
  };
}

function addTimeAgo(receipt) {
  const now = new Date();
  const receiptDate = new Date(receipt.timestamp);
  const diffMs = now - receiptDate;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let timeAgo;
  if (diffMins < 1) {
    timeAgo = "just now";
  } else if (diffMins < 60) {
    timeAgo = `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
  } else if (diffHours < 24) {
    timeAgo = `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  } else if (diffDays < 7) {
    timeAgo = `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  } else {
    timeAgo = receiptDate.toLocaleDateString();
  }

  return {
    ...receipt,
    timeAgo,
  };
}
