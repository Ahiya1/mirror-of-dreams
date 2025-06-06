// API: Gift - Sacred Gift Management

const {
  addGift,
  getGiftByCode,
  redeemGift,
  getAllGifts,
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

  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  const { action } = req.method === "POST" ? req.body : req.query;

  try {
    if (action === "create") {
      return await handleCreateGift(req, res);
    } else if (action === "redeem") {
      return await handleRedeemGift(req, res);
    } else if (action === "validate") {
      return await handleValidateGift(req, res);
    } else {
      return res.status(400).json({
        success: false,
        error: "Invalid action",
      });
    }
  } catch (error) {
    console.error("Gift API Error:", error);
    return res.status(500).json({
      success: false,
      error: "Gift service error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Create a gift
async function handleCreateGift(req, res) {
  const {
    giverName,
    giverEmail,
    recipientName,
    recipientEmail,
    personalMessage,
    amount = 2.99,
    paymentMethod = "paypal",
    paymentId,
    language = "en",
  } = req.body;

  // Validation
  if (!giverName || !giverEmail || !recipientName || !recipientEmail) {
    return res.status(400).json({
      success: false,
      error: "Missing required gift information",
    });
  }

  if (!giverEmail.includes("@") || !recipientEmail.includes("@")) {
    return res.status(400).json({
      success: false,
      error: "Invalid email addresses",
    });
  }

  try {
    // Create the gift
    const gift = await addGift({
      giverName,
      giverEmail,
      recipientName,
      recipientEmail,
      personalMessage: personalMessage || "",
      amount,
      paymentMethod,
      paymentId,
      language,
    });

    console.log(
      `🎁 Gift created: ${gift.giftCode} from ${giverName} to ${recipientName}`
    );

    // Send gift invitation email
    await sendGiftInvitation(gift);

    // Generate receipt for giver
    await generateGiftReceipt(gift);

    return res.json({
      success: true,
      message: "Gift created and invitation sent",
      giftId: gift.id,
      giftCode: gift.giftCode,
    });
  } catch (error) {
    console.error("Error creating gift:", error);
    throw error;
  }
}

// Validate a gift code
async function handleValidateGift(req, res) {
  const { giftCode } = req.query;

  if (!giftCode) {
    return res.status(400).json({
      success: false,
      error: "Gift code required",
    });
  }

  try {
    const gift = await getGiftByCode(giftCode);

    if (!gift) {
      return res.json({
        success: false,
        valid: false,
        error: "Invalid gift code",
      });
    }

    if (gift.isRedeemed) {
      return res.json({
        success: false,
        valid: false,
        error: "Gift has already been redeemed",
      });
    }

    return res.json({
      success: true,
      valid: true,
      gift: {
        recipientName: gift.recipientName,
        giverName: gift.giverName,
        personalMessage: gift.personalMessage,
        createdAt: gift.createdAt,
      },
    });
  } catch (error) {
    console.error("Error validating gift:", error);
    throw error;
  }
}

// Redeem a gift
async function handleRedeemGift(req, res) {
  const { giftCode } = req.body;

  if (!giftCode) {
    return res.status(400).json({
      success: false,
      error: "Gift code required",
    });
  }

  try {
    const gift = await getGiftByCode(giftCode);

    if (!gift) {
      return res.status(404).json({
        success: false,
        error: "Invalid gift code",
      });
    }

    if (gift.isRedeemed) {
      return res.status(400).json({
        success: false,
        error: "Gift has already been redeemed",
      });
    }

    // Mark as redeemed
    const redeemedGift = await redeemGift(giftCode);

    console.log(`🎁 Gift redeemed: ${giftCode} by ${gift.recipientName}`);

    // Store recipient info for reflection session
    const userData = {
      name: gift.recipientName,
      email: gift.recipientEmail,
      language: gift.language || "en",
      isGiftRecipient: true,
      giftedBy: gift.giverName,
      giftMessage: gift.personalMessage,
    };

    return res.json({
      success: true,
      message: "Gift redeemed successfully",
      userData,
      gift: {
        recipientName: gift.recipientName,
        giverName: gift.giverName,
        personalMessage: gift.personalMessage,
      },
    });
  } catch (error) {
    console.error("Error redeeming gift:", error);
    throw error;
  }
}

// Send gift invitation email
async function sendGiftInvitation(gift) {
  try {
    const response = await fetch(`${getBaseUrl()}/api/communication`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send-gift-invitation",
        gift,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send gift invitation: ${response.status}`);
    }

    console.log(`📧 Gift invitation sent to ${gift.recipientEmail}`);
  } catch (error) {
    console.error("Error sending gift invitation:", error);
    // Don't throw - gift creation should succeed even if email fails
  }
}

// Generate receipt for gift purchaser
async function generateGiftReceipt(gift) {
  try {
    const response = await fetch(`${getBaseUrl()}/api/communication`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generate-gift-receipt",
        gift,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate gift receipt: ${response.status}`);
    }

    console.log(`🧾 Gift receipt sent to ${gift.giverEmail}`);
  } catch (error) {
    console.error("Error generating gift receipt:", error);
    // Don't throw - gift creation should succeed even if receipt fails
  }
}

// Helper to get base URL for internal API calls
function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.DOMAIN) {
    return process.env.DOMAIN;
  }
  return "http://localhost:3000";
}
