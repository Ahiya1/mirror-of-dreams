// API: Communication - TRANSFORMED: Administrative Emails Only (No Reflection Delivery)
// MAJOR CHANGE: Reflections are stored in database, not emailed

const nodemailer = require("nodemailer");

// Email transporter
const transporter = nodemailer.createTransporter({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Generate receipt number
function generateReceiptNumber() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `MR${timestamp.slice(-6)}${random}`;
}

// Main handler
module.exports = async function handler(req, res) {
  // CORS
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
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  const { action } = req.body;

  try {
    switch (action) {
      case "send-subscription-confirmation":
        return await handleSubscriptionConfirmation(req, res);
      case "send-subscription-gift-invitation":
        return await handleSubscriptionGiftInvitation(req, res);
      case "generate-subscription-gift-receipt":
        return await handleSubscriptionGiftReceipt(req, res);
      case "send-welcome-email":
        return await handleWelcomeEmail(req, res);
      case "send-password-reset":
        return await handlePasswordReset(req, res);
      case "send-account-notification":
        return await handleAccountNotification(req, res);

      // REMOVED: send-reflection action - reflections stay in database

      // Legacy support for existing gift system (one-time payments)
      case "send-gift-invitation":
        return await handleLegacyGiftInvitation(req, res);
      case "generate-gift-receipt":
        return await handleLegacyGiftReceipt(req, res);
      case "generate-receipt":
        return await handleGenerateReceipt(req, res);

      default:
        return res.status(400).json({
          success: false,
          error: "Invalid action",
        });
    }
  } catch (error) {
    console.error("Communication API Error:", error);
    return res.status(500).json({
      success: false,
      error: "Communication service error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// NEW: Subscription confirmation email
async function handleSubscriptionConfirmation(req, res) {
  const { email, name, tier, period, language = "en" } = req.body;

  if (!email || !name || !tier) {
    return res.status(400).json({
      success: false,
      error: "Email, name, and tier are required",
    });
  }

  const tierDisplayName = tier === "essential" ? "Essential" : "Premium";
  const periodDisplay = period === "yearly" ? "Annual" : "Monthly";

  const subject = `Welcome to Mirror of Truth ${tierDisplayName}`;
  const htmlContent = getSubscriptionConfirmationTemplate({
    name,
    tier: tierDisplayName,
    period: periodDisplay,
    email,
  });

  await transporter.sendMail({
    from: `"Ahiya - The Mirror of Truth" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: subject,
    html: htmlContent,
  });

  console.log(`📧 Subscription confirmation sent to ${email} (${tier})`);

  return res.json({
    success: true,
    message: "Subscription confirmation sent successfully",
    timestamp: new Date().toISOString(),
  });
}

// NEW: Subscription gift invitation
async function handleSubscriptionGiftInvitation(req, res) {
  const { gift } = req.body;

  if (!gift || !gift.recipient_email || !gift.gift_code) {
    return res.status(400).json({
      success: false,
      error: "Gift information required",
    });
  }

  const tierName =
    gift.subscription_tier === "essential" ? "Essential" : "Premium";
  const duration =
    gift.subscription_duration === 1
      ? "1 month"
      : gift.subscription_duration === 3
      ? "3 months"
      : "1 year";

  const subject = `🎁 A sacred ${tierName.toLowerCase()} gift awaits you from ${
    gift.giver_name
  }`;
  const htmlContent = getSubscriptionGiftInvitationTemplate(gift);

  await transporter.sendMail({
    from: `"Ahiya - The Mirror of Truth" <${process.env.GMAIL_USER}>`,
    to: gift.recipient_email,
    subject: subject,
    html: htmlContent,
  });

  console.log(
    `🎁 Subscription gift invitation sent to ${gift.recipient_email}`
  );

  return res.json({
    success: true,
    message: "Subscription gift invitation sent successfully",
    timestamp: new Date().toISOString(),
  });
}

// NEW: Subscription gift receipt
async function handleSubscriptionGiftReceipt(req, res) {
  const { gift } = req.body;

  if (!gift || !gift.giver_email || !gift.gift_code) {
    return res.status(400).json({
      success: false,
      error: "Gift information required",
    });
  }

  const tierName =
    gift.subscription_tier === "essential" ? "Essential" : "Premium";
  const subject = `${tierName} Subscription Gift Receipt - Mirror of Truth`;
  const htmlContent = getSubscriptionGiftReceiptTemplate(gift);

  await transporter.sendMail({
    from: `"Ahiya - The Mirror of Truth" <${process.env.GMAIL_USER}>`,
    to: gift.giver_email,
    subject: subject,
    html: htmlContent,
  });

  console.log(`🧾 Subscription gift receipt sent to ${gift.giver_email}`);

  return res.json({
    success: true,
    message: "Subscription gift receipt sent successfully",
    timestamp: new Date().toISOString(),
  });
}

// NEW: Welcome email for new users
async function handleWelcomeEmail(req, res) {
  const { email, name, tier = "free" } = req.body;

  if (!email || !name) {
    return res.status(400).json({
      success: false,
      error: "Email and name are required",
    });
  }

  const subject = "Welcome to The Mirror of Truth";
  const htmlContent = getWelcomeEmailTemplate({ name, tier, email });

  await transporter.sendMail({
    from: `"Ahiya - The Mirror of Truth" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: subject,
    html: htmlContent,
  });

  console.log(`👋 Welcome email sent to ${email}`);

  return res.json({
    success: true,
    message: "Welcome email sent successfully",
    timestamp: new Date().toISOString(),
  });
}

// NEW: Password reset email
async function handlePasswordReset(req, res) {
  const { email, resetToken, name } = req.body;

  if (!email || !resetToken) {
    return res.status(400).json({
      success: false,
      error: "Email and reset token are required",
    });
  }

  const resetUrl = `${getBaseUrl()}/auth/reset-password?token=${resetToken}`;
  const subject = "Reset Your Mirror of Truth Password";
  const htmlContent = getPasswordResetTemplate({ name, resetUrl, email });

  await transporter.sendMail({
    from: `"Ahiya - The Mirror of Truth" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: subject,
    html: htmlContent,
  });

  console.log(`🔑 Password reset email sent to ${email}`);

  return res.json({
    success: true,
    message: "Password reset email sent successfully",
    timestamp: new Date().toISOString(),
  });
}

// NEW: Account notification emails
async function handleAccountNotification(req, res) {
  const { email, name, type, data } = req.body;

  if (!email || !name || !type) {
    return res.status(400).json({
      success: false,
      error: "Email, name, and type are required",
    });
  }

  let subject, htmlContent;

  switch (type) {
    case "subscription_cancelled":
      subject = "Subscription Cancelled - Mirror of Truth";
      htmlContent = getSubscriptionCancelledTemplate({ name, email, data });
      break;
    case "subscription_expired":
      subject = "Subscription Expired - Mirror of Truth";
      htmlContent = getSubscriptionExpiredTemplate({ name, email, data });
      break;
    case "payment_failed":
      subject = "Payment Issue - Mirror of Truth";
      htmlContent = getPaymentFailedTemplate({ name, email, data });
      break;
    default:
      return res.status(400).json({
        success: false,
        error: "Invalid notification type",
      });
  }

  await transporter.sendMail({
    from: `"Ahiya - The Mirror of Truth" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: subject,
    html: htmlContent,
  });

  console.log(`📬 ${type} notification sent to ${email}`);

  return res.json({
    success: true,
    message: "Account notification sent successfully",
    timestamp: new Date().toISOString(),
  });
}

// LEGACY: Support for existing one-time gift system
async function handleLegacyGiftInvitation(req, res) {
  const { gift } = req.body;

  if (!gift || !gift.recipientEmail || !gift.giftCode) {
    return res.status(400).json({
      success: false,
      error: "Gift information required",
    });
  }

  const giftType = gift.isPremium ? "Premium" : "Essential";
  const subject = `🎁 A sacred ${giftType.toLowerCase()} gift awaits you from ${
    gift.giverName
  }`;
  const htmlContent = getLegacyGiftInvitationTemplate(gift);

  await transporter.sendMail({
    from: `"Ahiya - The Mirror of Truth" <${process.env.GMAIL_USER}>`,
    to: gift.recipientEmail,
    subject: subject,
    html: htmlContent,
  });

  return res.json({
    success: true,
    message: "Legacy gift invitation sent successfully",
    timestamp: new Date().toISOString(),
  });
}

// LEGACY: Support for existing receipt system
async function handleLegacyGiftReceipt(req, res) {
  const { gift } = req.body;

  if (!gift || !gift.giverEmail || !gift.giftCode) {
    return res.status(400).json({
      success: false,
      error: "Gift information required",
    });
  }

  const giftType = gift.isPremium ? "Premium" : "Essential";
  const subject = `${giftType} Gift Receipt - Mirror of Truth Reflection`;
  const htmlContent = getLegacyGiftReceiptTemplate(gift);

  await transporter.sendMail({
    from: `"Ahiya - The Mirror of Truth" <${process.env.GMAIL_USER}>`,
    to: gift.giverEmail,
    subject: subject,
    html: htmlContent,
  });

  return res.json({
    success: true,
    message: "Legacy gift receipt sent successfully",
    timestamp: new Date().toISOString(),
  });
}

// LEGACY: Generate receipt (kept for backward compatibility)
async function handleGenerateReceipt(req, res) {
  const {
    email,
    name,
    amount = 2.99,
    paymentMethod = "paypal",
    language = "en",
    registrationId = null,
    isPremium = false,
  } = req.body;

  if (!email || !name) {
    return res.status(400).json({
      success: false,
      error: "Email and name are required",
    });
  }

  // Generate receipt data
  const receiptData = {
    receiptNumber: generateReceiptNumber(),
    customerName: name,
    customerEmail: email,
    amount: amount,
    paymentMethod: paymentMethod,
    isPremium: isPremium,
    date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    timestamp: new Date().toISOString(),
  };

  const serviceType = isPremium ? "Premium" : "Essential";
  const subject = `Receipt - Mirror of Truth ${serviceType} Service`;
  const htmlContent = getLegacyReceiptTemplate(receiptData);

  // Send email
  await transporter.sendMail({
    from: `"Ahiya - The Mirror of Truth" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: subject,
    html: htmlContent,
  });

  console.log(`📄 Legacy receipt sent: ${receiptData.receiptNumber}`);

  return res.json({
    success: true,
    message: "Receipt sent successfully",
    receiptData: receiptData,
  });
}

// EMAIL TEMPLATES

// NEW: Subscription confirmation template
function getSubscriptionConfirmationTemplate({ name, tier, period, email }) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to Mirror of Truth ${tier}</title>
</head>
<body style="margin: 0; padding: 40px 20px; font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #0f0f23 100%); color: white; min-height: 100vh;">
    <div style="max-width: 600px; margin: 0 auto; background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(30px); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 24px; padding: 40px; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);">
        
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 2rem; font-weight: 300; margin: 0 0 10px 0; color: #fff;">Welcome to Mirror of Truth</h1>
            <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 0.5rem 1rem; border-radius: 16px; font-size: 0.9rem; font-weight: 600; display: inline-block;">${tier} ${period}</div>
        </div>

        <div style="margin-bottom: 30px;">
            <h2 style="color: #fff; font-size: 1.4rem; margin-bottom: 15px;">Dear ${name},</h2>
            <p style="margin-bottom: 20px; opacity: 0.9; line-height: 1.6;">Your ${tier} subscription is now active. You're ready to begin your journey of deeper self-reflection and truth.</p>
        </div>

        <div style="background: rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 25px; margin: 25px 0;">
            <h3 style="color: #10b981; margin-bottom: 15px;">Your ${tier} Journey Includes:</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
                ${
                  tier === "Essential"
                    ? `
                <li style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                    <span style="color: #10b981;">✨</span> 5 reflections per month
                </li>
                <li style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                    <span style="color: #10b981;">📚</span> Complete reflection history
                </li>
                <li style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                    <span style="color: #10b981;">🌱</span> Evolution reports every 4 reflections
                </li>
                `
                    : `
                <li style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                    <span style="color: #10b981;">🔥</span> 10 reflections per month
                </li>
                <li style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                    <span style="color: #10b981;">🧠</span> Enhanced AI thinking
                </li>
                <li style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                    <span style="color: #10b981;">🦋</span> Advanced evolution reports
                </li>
                <li style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                    <span style="color: #10b981;">🎯</span> Pattern recognition insights
                </li>
                `
                }
            </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${getBaseUrl()}/dashboard" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration: none; border-radius: 16px; font-weight: 500;">
                Begin Your First Reflection
            </a>
        </div>

        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 20px; text-align: center; font-size: 0.9rem; opacity: 0.7;">
            <p>You can manage your subscription anytime in your dashboard.</p>
            <p>With quiet certainty, Ahiya</p>
        </div>
    </div>
</body>
</html>`;
}

// NEW: Welcome email template
function getWelcomeEmailTemplate({ name, tier, email }) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to The Mirror of Truth</title>
</head>
<body style="margin: 0; padding: 40px 20px; font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #0f0f23 100%); color: white; min-height: 100vh;">
    <div style="max-width: 600px; margin: 0 auto; background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(30px); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 24px; padding: 40px;">
        
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 2rem; font-weight: 300; margin: 0 0 10px 0;">Welcome to The Mirror of Truth</h1>
            <p style="opacity: 0.8; font-size: 1.1rem;">Your sacred space for truth and reflection</p>
        </div>

        <div style="margin-bottom: 30px;">
            <h2 style="color: #fff; font-size: 1.4rem; margin-bottom: 15px;">Dear ${name},</h2>
            <p style="margin-bottom: 20px; opacity: 0.9; line-height: 1.6;">
                Your account has been created successfully. You're now ready to begin your journey of self-reflection and discovery.
            </p>
            ${
              tier === "free"
                ? `
            <p style="margin-bottom: 20px; opacity: 0.9; line-height: 1.6;">
                You're starting with our free tier, which includes 1 reflection per month. You can upgrade anytime to unlock more reflections and features.
            </p>
            `
                : ""
            }
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${getBaseUrl()}/reflection" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 16px; font-weight: 500;">
                Begin Your First Reflection
            </a>
        </div>

        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 20px; text-align: center; font-size: 0.9rem; opacity: 0.7;">
            <p>Welcome to your journey of truth.</p>
            <p>With quiet certainty, Ahiya</p>
        </div>
    </div>
</body>
</html>`;
}

// Subscription gift invitation template
function getSubscriptionGiftInvitationTemplate(gift) {
  const tierName =
    gift.subscription_tier === "essential" ? "Essential" : "Premium";
  const duration =
    gift.subscription_duration === 1
      ? "1 month"
      : gift.subscription_duration === 3
      ? "3 months"
      : "1 year";
  const giftUrl = `${getBaseUrl()}/breathing?gift=${gift.gift_code}`;

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>A Sacred Gift Awaits You</title>
</head>
<body style="margin: 0; padding: 40px 20px; font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #0f0f23 100%); color: white; min-height: 100vh;">
    <div style="max-width: 600px; margin: 0 auto; background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(30px); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 24px; padding: 40px;">
        
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 4rem; margin-bottom: 20px;">🎁</div>
            <h1 style="font-size: 2rem; font-weight: 300; margin: 0 0 10px 0;">A Sacred ${tierName} Gift Awaits</h1>
            <p style="opacity: 0.8; font-size: 1.1rem;">From ${
              gift.giver_name
            }</p>
        </div>

        <div style="background: rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 30px; margin: 30px 0; text-align: center;">
            <h2 style="font-size: 1.5rem; margin: 0 0 20px 0;">${tierName} Subscription for ${duration}</h2>
            
            ${
              gift.personal_message
                ? `
            <div style="background: rgba(251, 191, 36, 0.1); border-left: 3px solid rgba(251, 191, 36, 0.5); padding: 20px; border-radius: 8px; margin: 20px 0; font-style: italic;">
                "${gift.personal_message}"
            </div>
            `
                : ""
            }
            
            <p style="margin: 20px 0; font-size: 1.1rem; line-height: 1.7;">
                ${
                  gift.giver_name
                } has gifted you a ${tierName} subscription to The Mirror of Truth — your sacred space for reflection and truth.
            </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${giftUrl}" style="display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 16px; font-size: 1.1rem; font-weight: 500;">
                ✨ Claim Your ${tierName} Gift ✨
            </a>
        </div>

        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 20px; text-align: center; font-size: 0.9rem; opacity: 0.7;">
            <p>This gift can only be redeemed once and is yours alone.</p>
            <p>With quiet certainty, Ahiya</p>
        </div>
    </div>
</body>
</html>`;
}

// Helper function to get base URL
function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.DOMAIN) {
    return process.env.DOMAIN;
  }
  return "http://localhost:3000";
}

// Additional template functions would be included here for:
// - getSubscriptionGiftReceiptTemplate
// - getPasswordResetTemplate
// - getSubscriptionCancelledTemplate
// - getSubscriptionExpiredTemplate
// - getPaymentFailedTemplate
// - getLegacyGiftInvitationTemplate
// - getLegacyGiftReceiptTemplate
// - getLegacyReceiptTemplate

// [Templates would continue but truncated for length...]
