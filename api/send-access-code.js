const nodemailer = require("nodemailer");

// Simple in-memory storage for access codes
// In production, use a database like MongoDB, Supabase, or PostgreSQL
let accessCodes = new Map();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function generateAccessCode() {
  // Generate a 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getEmailContent(language, userName, accessCode) {
  const isHebrew = language === "he";
  const direction = isHebrew ? "rtl" : "ltr";

  const texts = {
    en: {
      subject: `${userName} - Your Mirror of Truth Access Code`,
      greeting: `${userName},`,
      thankYou: "Thank you for your cash payment at The Mirror of Truth",
      codeLabel: "Your Access Code:",
      validFor: "Valid for 24 hours",
      howToUseTitle: "How to use your code:",
      instructions: [
        "Return to The Mirror of Truth website",
        'Click "Reflect Me" and enter your details',
        'Select "Cash" as payment method',
        "Enter this access code when prompted",
        "Begin your sacred reflection experience",
      ],
      personalNote:
        "Thank you for investing in a conversation with your own truth. The experience you're about to have isn't just another self-help exercise — it's a mirror that will show you the power you already possess.",
      takeTime:
        "Take your time with the questions. Your honest answers will create the most authentic reflection.",
      signature: "With quiet certainty,",
      name: "Ahiya",
    },
    he: {
      subject: `${userName} - קוד הגישה שלך למראה האמת`,
      greeting: `${userName} היקר,`,
      thankYou: "תודה על התשלום במזומן במראה האמת",
      codeLabel: "קוד הגישה שלך:",
      validFor: "תקף ל-24 שעות",
      howToUseTitle: "איך להשתמש בקוד:",
      instructions: [
        "חזור לאתר מראה האמת",
        'לחץ על "תראה לי" והכנס את הפרטים שלך',
        'בחר "מזומן" כאמצעי תשלום',
        "הכנס את קוד הגישה כשתתבקש",
        "התחל את חוויית ההשתקפות הקדושה",
      ],
      personalNote:
        "תודה שהשקעת בשיחה עם האמת שלך. החוויה שאתה עומד לחוות אינה עוד תרגיל של עזרה עצמית — זה מראה שיראה לך את הכוח שכבר יש לך.",
      takeTime:
        "קח את הזמן שלך עם השאלות. התשובות הכנות שלך ייצרו את ההשתקפות האותנטית ביותר.",
      signature: "בוודאות שקטה,",
      name: "אחיה",
    },
  };

  const t = texts[language];

  return `
<!DOCTYPE html>
<html lang="${language}" dir="${direction}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t.subject}</title>
</head>
<body style="
    margin: 0; 
    padding: 0; 
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
    background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f0f23 100%);
    min-height: 100vh;
    line-height: 1.6;
    direction: ${direction};
">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        
        <!-- Main Card -->
        <div style="
            background: rgba(255, 255, 255, 0.98);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
            text-align: center;
        ">
            <!-- Header -->
            <h1 style="
                font-family: 'Crimson Text', serif;
                font-size: 2rem;
                margin: 0 0 20px 0;
                color: #1f2937;
            ">${isHebrew ? "קוד הגישה שלך" : "Your Access Code"}</h1>
            
            <p style="
                margin: 0 0 30px 0;
                color: #6b7280;
                font-size: 1rem;
            ">${t.thankYou}</p>

            <!-- Access Code -->
            <div style="
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                border: 2px solid #0ea5e9;
                border-radius: 16px;
                padding: 30px;
                margin: 30px 0;
            ">
                <p style="
                    margin: 0 0 10px 0;
                    color: #0c4a6e;
                    font-size: 1rem;
                    font-weight: 600;
                ">${t.codeLabel}</p>
                <div style="
                    font-size: 3rem;
                    font-weight: 700;
                    color: #0369a1;
                    font-family: 'Courier New', monospace;
                    letter-spacing: 0.2em;
                    margin: 10px 0;
                ">${accessCode}</div>
                <p style="
                    margin: 10px 0 0 0;
                    color: #0c4a6e;
                    font-size: 0.9rem;
                ">${t.validFor}</p>
            </div>

            <!-- Instructions -->
            <div style="
                background: #fffbeb;
                border-${isHebrew ? "right" : "left"}: 4px solid #f59e0b;
                padding: 20px;
                border-radius: 8px;
                margin: 30px 0;
                text-align: ${isHebrew ? "right" : "left"};
            ">
                <h3 style="
                    margin: 0 0 15px 0;
                    color: #92400e;
                    font-size: 1.1rem;
                ">${t.howToUseTitle}</h3>
                <ol style="
                    margin: 0;
                    padding-${isHebrew ? "right" : "left"}: 20px;
                    color: #92400e;
                    line-height: 1.6;
                ">
                    ${t.instructions
                      .map((instruction) => `<li>${instruction}</li>`)
                      .join("")}
                </ol>
            </div>

            <!-- Personal Note -->
            <div style="
                border-top: 2px solid #e5e7eb;
                padding-top: 25px;
                margin-top: 30px;
                text-align: ${isHebrew ? "right" : "left"};
            ">
                <p style="
                    margin: 0 0 15px 0;
                    color: #374151;
                    line-height: 1.6;
                ">${t.personalNote}</p>
                
                <p style="
                    margin: 0;
                    color: #6b7280;
                    font-style: italic;
                    line-height: 1.6;
                ">${t.takeTime}</p>
            </div>

            <!-- Signature -->
            <div style="
                text-align: ${isHebrew ? "left" : "right"};
                margin-top: 25px;
            ">
                <p style="
                    margin: 0 0 5px 0;
                    color: #374151;
                ">${t.signature}</p>
                <p style="
                    margin: 0;
                    font-size: 1.1rem;
                    color: #1f2937;
                    font-weight: 600;
                ">${t.name}</p>
            </div>
        </div>
    </div>
</body>
</html>`;
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
    return handleSendCode(req, res);
  } else if (req.method === "GET") {
    return handleVerifyCode(req, res);
  } else {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }
};

async function handleSendCode(req, res) {
  try {
    const { email, name, language = "en" } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: "Email and name are required",
      });
    }

    // Generate access code
    const accessCode = generateAccessCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store the code
    accessCodes.set(accessCode, {
      email,
      name,
      language,
      createdAt: new Date(),
      expiresAt,
      used: false,
    });

    // Send email with access code
    const isHebrew = language === "he";
    const subject = isHebrew
      ? `${name} - קוד הגישה שלך למראה האמת`
      : `${name} - Your Mirror of Truth Access Code`;

    const htmlContent = getEmailContent(language, name, accessCode);

    await transporter.sendMail({
      from: `"${
        isHebrew ? "אחיה - מראה האמת" : "Ahiya - The Mirror of Truth"
      }" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    });

    res.json({
      success: true,
      message: "Access code sent successfully",
      accessCode: accessCode, // Return for admin reference
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Send Access Code Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send access code",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

async function handleVerifyCode(req, res) {
  try {
    const { code, email } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: "Access code is required",
      });
    }

    const codeData = accessCodes.get(code);

    if (!codeData) {
      return res.status(404).json({
        success: false,
        error: "Invalid access code",
      });
    }

    if (codeData.used) {
      return res.status(400).json({
        success: false,
        error: "Access code already used",
      });
    }

    if (new Date() > codeData.expiresAt) {
      return res.status(400).json({
        success: false,
        error: "Access code expired",
      });
    }

    // Optional: Verify email matches
    if (email && codeData.email !== email) {
      return res.status(400).json({
        success: false,
        error: "Email does not match code",
      });
    }

    // Mark as used
    codeData.used = true;
    codeData.usedAt = new Date();

    res.json({
      success: true,
      message: "Access code verified",
      userData: {
        name: codeData.name,
        email: codeData.email,
        language: codeData.language,
      },
    });
  } catch (error) {
    console.error("Verify Access Code Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify access code",
    });
  }
}

// Cleanup expired codes periodically (in production, use a proper job scheduler)
setInterval(() => {
  const now = new Date();
  for (const [code, data] of accessCodes.entries()) {
    if (now > data.expiresAt) {
      accessCodes.delete(code);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour
