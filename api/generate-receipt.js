const nodemailer = require("nodemailer");
const { addReceipt } = require("../lib/redis-storage.js"); // NEW: Import receipt storage

const transporter = nodemailer.createTransporter({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function generateReceiptNumber() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `MR${timestamp.slice(-6)}${random}`;
}

function getReceiptContent(language, receiptData) {
  const isHebrew = language === "he";
  const direction = isHebrew ? "rtl" : "ltr";

  const texts = {
    en: {
      subject: `Receipt - Mirror of Truth Service`,
      receiptTitle: "Payment Receipt",
      businessName: "AhIya",
      businessNumber: "Business #325761682",
      receiptNumber: "Receipt #",
      paymentReceived: "Payment Received",
      serviceDescription: "Mirror of Truth - Personal Reflection Session",
      customerInfo: "Customer Information:",
      paymentInfo: "Payment Information:",
      amount: "Amount:",
      method: "Payment Method:",
      date: "Date:",
      thankYou: "Thank you for choosing The Mirror of Truth",
      footerNote:
        "This receipt serves as proof of payment for the Mirror of Truth reflection experience.",
      contactInfo:
        "For questions about this receipt, please reply to this email.",
      vatNote: "This service is provided by a registered business in Israel.",
      cashMethod: "Cash",
      bitMethod: "Bit Payment",
    },
    he: {
      subject: `קבלה - שירות מראת האמת`,
      receiptTitle: "קבלת תשלום",
      businessName: "אחיה",
      businessNumber: "עוסק מורשה #325761682",
      receiptNumber: "קבלה מס׳",
      paymentReceived: "תשלום התקבל",
      serviceDescription: "מראת האמת - סשן השתקפות אישי",
      customerInfo: "פרטי לקוח:",
      paymentInfo: "פרטי תשלום:",
      amount: "סכום:",
      method: "אמצעי תשלום:",
      date: "תאריך:",
      thankYou: "תודה שבחרת במראת האמת",
      footerNote: "קבלה זו משמשת כהוכחת תשלום עבור חוויית ההשתקפות מראת האמת.",
      contactInfo: "לשאלות לגבי קבלה זו, אנא הגב למייל זה.",
      vatNote: "השירות ניתן על ידי עוסק מורשה בישראל.",
      cashMethod: "מזומן",
      bitMethod: "תשלום בביט",
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
    background: #f8fafc;
    line-height: 1.6;
    direction: ${direction};
">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        
        <!-- Receipt Card -->
        <div style="
            background: white;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        ">
            <!-- Header -->
            <div style="
                text-align: center;
                padding-bottom: 30px;
                border-bottom: 2px solid #e2e8f0;
                margin-bottom: 30px;
            ">
                <h1 style="
                    font-size: 1.8rem;
                    color: #1f2937;
                    margin: 0 0 10px 0;
                    font-weight: 700;
                ">${t.receiptTitle}</h1>
                <p style="
                    color: #6b7280;
                    margin: 0;
                    font-size: 1rem;
                ">${t.paymentReceived}</p>
            </div>

            <!-- Business Info -->
            <div style="
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 1px solid #e2e8f0;
            ">
                <div>
                    <h3 style="
                        color: #374151;
                        margin: 0 0 10px 0;
                        font-size: 1.1rem;
                    ">${t.businessName}</h3>
                    <p style="
                        color: #6b7280;
                        margin: 0;
                        font-size: 0.9rem;
                    ">${t.businessNumber}</p>
                </div>
                <div style="text-align: ${isHebrew ? "left" : "right"};">
                    <p style="
                        color: #6b7280;
                        margin: 0;
                        font-size: 0.9rem;
                    ">${t.receiptNumber}</p>
                    <p style="
                        color: #374151;
                        margin: 5px 0 0 0;
                        font-size: 1rem;
                        font-weight: 600;
                    ">${receiptData.receiptNumber}</p>
                </div>
            </div>

            <!-- Service Description -->
            <div style="
                background: #f8fafc;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
                border: 1px solid #e2e8f0;
            ">
                <h4 style="
                    color: #374151;
                    margin: 0 0 10px 0;
                    font-size: 1rem;
                ">${t.serviceDescription}</h4>
                <p style="
                    color: #6b7280;
                    margin: 0;
                    font-size: 0.9rem;
                    line-height: 1.5;
                ">${
                  isHebrew
                    ? "סשן השתקפות אישי המיועד לעזור לך לראות את עצמך בבהירות ולהתחבר לכוח הפנימי שלך."
                    : "Personal reflection session designed to help you see yourself clearly and connect with your inner power."
                }</p>
            </div>

            <!-- Customer Info -->
            <div style="margin-bottom: 30px;">
                <h4 style="
                    color: #374151;
                    margin: 0 0 15px 0;
                    font-size: 1rem;
                ">${t.customerInfo}</h4>
                <div style="
                    background: #f9fafb;
                    padding: 15px;
                    border-radius: 8px;
                    border: 1px solid #e5e7eb;
                ">
                    <p style="
                        color: #374151;
                        margin: 0 0 5px 0;
                        font-size: 0.95rem;
                    "><strong>${isHebrew ? "שם:" : "Name:"}</strong> ${
    receiptData.customerName
  }</p>
                    <p style="
                        color: #374151;
                        margin: 0;
                        font-size: 0.95rem;
                    "><strong>${isHebrew ? "מייל:" : "Email:"}</strong> ${
    receiptData.customerEmail
  }</p>
                </div>
            </div>

            <!-- Payment Info -->
            <div style="margin-bottom: 30px;">
                <h4 style="
                    color: #374151;
                    margin: 0 0 15px 0;
                    font-size: 1rem;
                ">${t.paymentInfo}</h4>
                <div style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                ">
                    <div style="
                        background: #f0f9ff;
                        padding: 15px;
                        border-radius: 8px;
                        border: 1px solid #bae6fd;
                    ">
                        <p style="
                            color: #0c4a6e;
                            margin: 0 0 5px 0;
                            font-size: 0.9rem;
                            font-weight: 600;
                        ">${t.amount}</p>
                        <p style="
                            color: #0369a1;
                            margin: 0;
                            font-size: 1.2rem;
                            font-weight: 700;
                        ">₪${receiptData.amount}</p>
                    </div>
                    <div style="
                        background: #f0fdf4;
                        padding: 15px;
                        border-radius: 8px;
                        border: 1px solid #bbf7d0;
                    ">
                        <p style="
                            color: #14532d;
                            margin: 0 0 5px 0;
                            font-size: 0.9rem;
                            font-weight: 600;
                        ">${t.method}</p>
                        <p style="
                            color: #166534;
                            margin: 0;
                            font-size: 1rem;
                            font-weight: 600;
                        ">${
                          receiptData.paymentMethod === "cash"
                            ? t.cashMethod
                            : t.bitMethod
                        }</p>
                    </div>
                </div>
                <div style="
                    margin-top: 15px;
                    background: #fefce8;
                    padding: 15px;
                    border-radius: 8px;
                    border: 1px solid #fde047;
                ">
                    <p style="
                        color: #854d0e;
                        margin: 0 0 5px 0;
                        font-size: 0.9rem;
                        font-weight: 600;
                    ">${t.date}</p>
                    <p style="
                        color: #a16207;
                        margin: 0;
                        font-size: 1rem;
                        font-weight: 600;
                    ">${receiptData.date}</p>
                </div>
            </div>

            <!-- Thank You -->
            <div style="
                text-align: center;
                padding: 30px 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 12px;
                margin-bottom: 30px;
            ">
                <h3 style="
                    margin: 0 0 10px 0;
                    font-size: 1.2rem;
                ">${t.thankYou}</h3>
                <p style="
                    margin: 0;
                    font-size: 0.9rem;
                    opacity: 0.9;
                ">${
                  isHebrew
                    ? "אנו מודים לך על הבחירה להשקיע בשיחה עם האמת שלך."
                    : "We appreciate you choosing to invest in a conversation with your truth."
                }</p>
            </div>

            <!-- Footer -->
            <div style="
                border-top: 1px solid #e2e8f0;
                padding-top: 20px;
                text-align: center;
            ">
                <p style="
                    color: #6b7280;
                    margin: 0 0 10px 0;
                    font-size: 0.85rem;
                    line-height: 1.5;
                ">${t.footerNote}</p>
                <p style="
                    color: #6b7280;
                    margin: 0 0 10px 0;
                    font-size: 0.85rem;
                ">${t.contactInfo}</p>
                <p style="
                    color: #9ca3af;
                    margin: 0;
                    font-size: 0.8rem;
                    font-style: italic;
                ">${t.vatNote}</p>
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

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    const {
      email,
      name,
      amount = 20,
      paymentMethod = "cash",
      language = "en",
      registrationId = null, // NEW: Optional link to registration
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
      date: new Date().toLocaleDateString(
        language === "he" ? "he-IL" : "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      ),
      timestamp: new Date().toISOString(),
    };

    const isHebrew = language === "he";
    const subject = isHebrew
      ? `קבלה - שירות מראת האמת`
      : `Receipt - Mirror of Truth Service`;

    const htmlContent = getReceiptContent(language, receiptData);

    // Send email
    await transporter.sendMail({
      from: `"${
        isHebrew ? "אחיה - מראת האמת" : "Ahiya - The Mirror of Truth"
      }" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    });

    // NEW: Store receipt in Redis
    try {
      const storedReceipt = await addReceipt({
        receiptNumber: receiptData.receiptNumber,
        customerName: name,
        customerEmail: email,
        amount: amount,
        paymentMethod: paymentMethod,
        language: language,
        registrationId: registrationId,
        date: receiptData.date,
      });

      console.log(`✅ Receipt stored in Redis: ${storedReceipt.receiptNumber}`);
    } catch (storageError) {
      console.error("Error storing receipt in Redis:", storageError);
      // Don't fail the request if storage fails, just log it
    }

    res.json({
      success: true,
      message: "Receipt sent successfully",
      receiptData: receiptData,
    });
  } catch (error) {
    console.error("Receipt Generation Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send receipt",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
