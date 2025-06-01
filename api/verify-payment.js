// Simple payment verification system for Bit payments
// In production, this would integrate with a proper payment processor

// In-memory storage for payment tracking
// In production, use a database
let payments = new Map();

function generatePaymentId() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `BIT${timestamp.slice(-6)}${random}`;
}

function generateBitPaymentUrl(amount, phone, description, business) {
  // This creates a Bit payment URL
  // Note: This is a simplified approach - in production you'd use proper Bit integration
  const params = new URLSearchParams({
    amount: amount,
    phone: phone,
    description: description,
    business: business,
  });

  return `https://bit.ly/pay?${params.toString()}`;
}

module.exports = async function handler(req, res) {
  // Handle CORS
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method === "POST") {
    return handleCreatePayment(req, res);
  } else if (req.method === "GET") {
    return handleVerifyPayment(req, res);
  } else {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }
};

async function handleCreatePayment(req, res) {
  try {
    const { email, name, amount = 20, language = "en", description } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: "Email and name are required",
      });
    }

    // Generate payment ID
    const paymentId = generatePaymentId();

    // Store payment information
    const paymentData = {
      id: paymentId,
      email,
      name,
      amount,
      language,
      description:
        description ||
        (language === "he"
          ? "מראה האמת - השתקפות"
          : "Mirror of Truth - Reflection"),
      status: "pending",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    };

    payments.set(paymentId, paymentData);

    // Generate Bit payment URL
    const bitUrl = generateBitPaymentUrl(
      amount,
      "+972587789019", // Ahiya's phone number
      paymentData.description,
      "325761682" // Business number
    );

    res.json({
      success: true,
      paymentId: paymentId,
      bitUrl: bitUrl,
      amount: amount,
      expiresAt: paymentData.expiresAt.toISOString(),
      message:
        language === "he"
          ? "קישור תשלום ביט נוצר בהצלחה"
          : "Bit payment link created successfully",
    });
  } catch (error) {
    console.error("Create Payment Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create payment",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

async function handleVerifyPayment(req, res) {
  try {
    const { paymentId, adminKey } = req.query;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: "Payment ID is required",
      });
    }

    const paymentData = payments.get(paymentId);

    if (!paymentData) {
      return res.status(404).json({
        success: false,
        error: "Payment not found",
      });
    }

    // Check if payment has expired
    if (new Date() > paymentData.expiresAt) {
      return res.status(400).json({
        success: false,
        error: "Payment expired",
      });
    }

    // For demo/testing purposes, allow admin to mark payment as completed
    if (adminKey === process.env.ADMIN_KEY && req.query.action === "complete") {
      paymentData.status = "completed";
      paymentData.completedAt = new Date();

      return res.json({
        success: true,
        message: "Payment marked as completed",
        paymentData: {
          id: paymentData.id,
          status: paymentData.status,
          amount: paymentData.amount,
          completedAt: paymentData.completedAt,
        },
      });
    }

    // Return payment status
    res.json({
      success: true,
      paymentData: {
        id: paymentData.id,
        status: paymentData.status,
        amount: paymentData.amount,
        createdAt: paymentData.createdAt,
        expiresAt: paymentData.expiresAt,
        ...(paymentData.completedAt && {
          completedAt: paymentData.completedAt,
        }),
      },
    });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify payment",
    });
  }
}

// Webhook endpoint for Bit payment notifications
// This would be called by Bit when payment is completed
async function handleBitWebhook(req, res) {
  try {
    // In production, verify the webhook signature here
    const { paymentId, status, amount, transactionId } = req.body;

    const paymentData = payments.get(paymentId);

    if (paymentData && status === "completed") {
      paymentData.status = "completed";
      paymentData.completedAt = new Date();
      paymentData.transactionId = transactionId;

      // Here you could trigger email notifications, etc.
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Bit Webhook Error:", error);
    res.status(500).json({ success: false });
  }
}

// Cleanup expired payments periodically
setInterval(() => {
  const now = new Date();
  for (const [id, payment] of payments.entries()) {
    if (now > payment.expiresAt && payment.status === "pending") {
      payments.delete(id);
    }
  }
}, 10 * 60 * 1000); // Clean up every 10 minutes
