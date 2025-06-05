// API: Communication - Sacred Email & Receipts

const nodemailer = require("nodemailer");
const { addReceipt } = require("../lib/storage.js");

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

// Receipt email template
function getReceiptTemplate(receiptData) {
  return `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - Mirror of Truth Service</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    </style>
</head>
<body style="
    margin: 0; 
    padding: 0; 
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
    background: #f8fafc;
    line-height: 1.6;
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
                ">Payment Receipt</h1>
                <p style="
                    color: #6b7280;
                    margin: 0;
                    font-size: 1rem;
                ">Payment Received</p>
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
                    ">${process.env.BUSINESS_NAME || "AhIya"}</h3>
                    <p style="
                        color: #6b7280;
                        margin: 0;
                        font-size: 0.9rem;
                    ">Business #${
                      process.env.BUSINESS_NUMBER || "325761682"
                    }</p>
                </div>
                <div style="text-align: right;">
                    <p style="
                        color: #6b7280;
                        margin: 0;
                        font-size: 0.9rem;
                    ">Receipt #</p>
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
                ">Mirror of Truth - Personal Reflection Session</h4>
                <p style="
                    color: #6b7280;
                    margin: 0;
                    font-size: 0.9rem;
                    line-height: 1.5;
                ">Personal reflection session designed to help you see yourself clearly and connect with your inner power.</p>
            </div>

            <!-- Customer Info -->
            <div style="margin-bottom: 30px;">
                <h4 style="
                    color: #374151;
                    margin: 0 0 15px 0;
                    font-size: 1rem;
                ">Customer Information:</h4>
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
                    "><strong>Name:</strong> ${receiptData.customerName}</p>
                    <p style="
                        color: #374151;
                        margin: 0;
                        font-size: 0.95rem;
                    "><strong>Email:</strong> ${receiptData.customerEmail}</p>
                </div>
            </div>

            <!-- Payment Info -->
            <div style="margin-bottom: 30px;">
                <h4 style="
                    color: #374151;
                    margin: 0 0 15px 0;
                    font-size: 1rem;
                ">Payment Information:</h4>
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
                        ">Amount:</p>
                        <p style="
                            color: #0369a1;
                            margin: 0;
                            font-size: 1.2rem;
                            font-weight: 700;
                        ">$${receiptData.amount}</p>
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
                        ">Payment Method:</p>
                        <p style="
                            color: #166534;
                            margin: 0;
                            font-size: 1rem;
                            font-weight: 600;
                        ">${
                          receiptData.paymentMethod === "cash"
                            ? "Cash"
                            : "PayPal"
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
                    ">Date:</p>
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
                ">Thank you for choosing The Mirror of Truth</h3>
                <p style="
                    margin: 0;
                    font-size: 0.9rem;
                    opacity: 0.9;
                ">We appreciate you choosing to invest in a conversation with your truth.</p>
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
                ">This receipt serves as proof of payment for the Mirror of Truth reflection experience.</p>
                <p style="
                    color: #6b7280;
                    margin: 0 0 10px 0;
                    font-size: 0.85rem;
                ">For questions about this receipt, please reply to this email.</p>
                <p style="
                    color: #9ca3af;
                    margin: 0;
                    font-size: 0.8rem;
                    font-style: italic;
                ">This service is provided by a registered business.</p>
            </div>
        </div>
    </div>
</body>
</html>`;
}

// Reflection email template
function getReflectionTemplate(userName, content) {
  return `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${userName} - Your Mirror of Truth Reflection</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    </style>
</head>
<body style="
    margin: 0; 
    padding: 0; 
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
    background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f0f23 100%);
    min-height: 100vh;
    line-height: 1.6;
">
    <div style="max-width: 700px; margin: 0 auto; padding: 40px 20px;">
        
        <!-- Main Card -->
        <div style="
            background: rgba(255, 255, 255, 0.98);
            border-radius: 24px;
            padding: 50px 40px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
            position: relative;
            overflow: hidden;
        ">
            <!-- Top accent -->
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            "></div>

            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="
                    font-family: 'Crimson Text', serif;
                    font-size: 2.2rem;
                    font-weight: 600;
                    margin: 0 0 20px 0;
                    color: #1f2937;
                    line-height: 1.2;
                ">Your Mirror of Truth</h1>
                <div style="
                    width: 80px;
                    height: 3px;
                    background: linear-gradient(135deg, #f59e0b, #ec4899);
                    margin: 0 auto;
                    border-radius: 2px;
                "></div>
                <p style="
                    margin: 20px 0 0 0;
                    color: #6b7280;
                    font-style: italic;
                    font-size: 1rem;
                ">A reflection to return to when you need to remember your power</p>
            </div>

            <!-- Greeting -->
            <div style="margin-bottom: 35px;">
                <p style="
                    font-size: 1.1rem;
                    color: #374151;
                    margin: 0 0 20px 0;
                    font-weight: 500;
                ">${userName},</p>
                
                <p style="
                    font-size: 1rem;
                    color: #6b7280;
                    margin: 0;
                    line-height: 1.7;
                ">Here is your reflection from The Mirror of Truth. This isn't just words on a screen — it's a reminder of who you are when you stop hiding from your own power.</p>
            </div>

            <!-- Reflection Content -->
            <div style="
                border: 2px solid #e5e7eb;
                padding: 40px;
                border-radius: 16px;
                margin-bottom: 40px;
                background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
                position: relative;
            ">
                <div style="
                    position: absolute;
                    top: 15px;
                    left: 15px;
                    width: 40px;
                    height: 40px;
                    background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
                    border-radius: 50%;
                "></div>
                <div style="
                    font-size: 1.1rem;
                    line-height: 1.8;
                    color: #374151;
                ">
                    ${content}
                </div>
            </div>

            <!-- Sacred Instructions -->
            <div style="
                background: linear-gradient(135deg, #fffbeb 0%, #fef7cd 100%);
                border-left: 4px solid #f59e0b;
                padding: 30px;
                border-radius: 12px;
                margin-bottom: 40px;
            ">
                <p style="
                    margin: 0 0 15px 0;
                    font-size: 1rem;
                    color: #92400e;
                    font-weight: 600;
                ">How to work with this reflection:</p>
                <p style="
                    margin: 0;
                    font-size: 1rem;
                    color: #92400e;
                    line-height: 1.7;
                ">Return to these words when doubt creeps in. When others question your path. When you forget that your desire arose for a reason. This reflection sees the truth of who you are — not who you think you should be, but who you already are when you stop apologizing for wanting what you want.</p>
            </div>

            <!-- Copy Instructions -->
            <div style="
                text-align: center;
                margin-bottom: 40px;
                padding: 25px;
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                border-radius: 12px;
                border: 2px solid #0ea5e9;
            ">
                <p style="
                    margin: 0;
                    color: #0c4a6e;
                    font-size: 0.95rem;
                    font-weight: 500;
                ">💾 Save this reflection: Copy the text above or print this email. Keep it somewhere you can find it when you need to remember your truth.</p>
            </div>

            <!-- Personal Note from Ahiya -->
            <div style="
                border-top: 2px solid #e5e7eb;
                padding-top: 35px;
                margin-bottom: 35px;
            ">
                <p style="
                    font-size: 1rem;
                    color: #374151;
                    margin: 0 0 20px 0;
                    line-height: 1.7;
                ">This work of creating mirrors for people's truth — helping them see their wholeness instead of their brokenness — it's what I'm here to do. If this reflection landed for you, if it helped you see something you hadn't seen before, I'd love to hear about it.</p>
                
                <p style="
                    font-size: 0.95rem;
                    color: #6b7280;
                    margin: 0 0 20px 0;
                    font-style: italic;
                ">Just reply to this email. I read every response personally.</p>

                <p style="
                    font-size: 0.95rem;
                    color: #6b7280;
                    margin: 0;
                    line-height: 1.6;
                ">And if you know someone who could use their own mirror — someone who's been waiting for permission to trust their dreams — send them to The Mirror of Truth. The deepest gift we can give is helping others remember their own power.</p>
            </div>

            <!-- Signature -->
            <div style="text-align: right; margin-bottom: 30px;">
                <p style="
                    margin: 0 0 8px 0;
                    font-size: 1rem;
                    color: #374151;
                ">With quiet certainty,</p>
                <p style="
                    margin: 0;
                    font-size: 1.2rem;
                    color: #1f2937;
                    font-weight: 600;
                ">Ahiya</p>
                <p style="
                    margin: 8px 0 0 0;
                    font-size: 0.85rem;
                    color: #9ca3af;
                    font-style: italic;
                ">Creator, The Mirror of Truth</p>
            </div>

            <!-- Footer -->
            <div style="
                background: #f9fafb;
                border-left: 3px solid #d1d5db;
                padding: 25px;
                border-radius: 8px;
            ">
                <p style="
                    margin: 0;
                    font-size: 0.9rem;
                    color: #6b7280;
                    line-height: 1.6;
                ">
                    <strong>P.S.</strong> This isn't a business email or a marketing funnel. It's one human being offering another human being a chance to see themselves clearly. If that's what you received, then the mirror worked exactly as intended.
                </p>
            </div>
        </div>
    </div>
</body>
</html>`;
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
    if (action === "send-reflection") {
      return await handleSendReflection(req, res);
    } else if (action === "generate-receipt") {
      return await handleGenerateReceipt(req, res);
    } else {
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

// Send reflection email
async function handleSendReflection(req, res) {
  const { email, content, userName = "Friend", language = "en" } = req.body;

  if (!email || !content) {
    return res.status(400).json({
      success: false,
      error: "Email and content are required",
    });
  }

  const subject = `${userName} - Your Mirror of Truth Reflection`;
  const htmlContent = getReflectionTemplate(userName, content);

  await transporter.sendMail({
    from: `"Ahiya - The Mirror of Truth" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: subject,
    html: htmlContent,
  });

  return res.json({
    success: true,
    message: "Reflection sent successfully",
    timestamp: new Date().toISOString(),
  });
}

// Generate and send receipt
async function handleGenerateReceipt(req, res) {
  const {
    email,
    name,
    amount = 2.99,
    paymentMethod = "paypal",
    language = "en",
    registrationId = null,
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
    date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    timestamp: new Date().toISOString(),
  };

  const subject = `Receipt - Mirror of Truth Service`;
  const htmlContent = getReceiptTemplate(receiptData);

  // Send email
  await transporter.sendMail({
    from: `"Ahiya - The Mirror of Truth" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: subject,
    html: htmlContent,
  });

  // Store receipt
  try {
    const storedReceipt = await addReceipt({
      receiptNumber: receiptData.receiptNumber,
      customerName: name,
      customerEmail: email,
      amount: amount,
      paymentMethod: paymentMethod,
      language: "en",
      registrationId: registrationId,
      date: receiptData.date,
    });

    console.log(`✅ Receipt stored: ${storedReceipt.receiptNumber}`);
  } catch (storageError) {
    console.error("Error storing receipt:", storageError);
    // Don't fail the request if storage fails
  }

  return res.json({
    success: true,
    message: "Receipt sent successfully",
    receiptData: receiptData,
  });
}
