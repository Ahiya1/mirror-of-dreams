/* =========================================================================
   FILE:  api/send-access-code.js                                   2025-06-01
   =========================================================================
   ‣  POST  →  issues a 6-digit access-code, stores it in memory,  
                and e-mails the customer **two separate mails**:  
                (1) the access-code          (2) the formal receipt  
   ‣  GET   →  verifies a code (marks it "used" on success)
   ‣  Now handles duplicate emails and creator bypass
   ========================================================================= */

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransporter({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const accessCodes = new Map();
const DAY = 24 * 60 * 60 * 1000;

const generateAccessCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const generateReceiptNumber = () =>
  `MR${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,OPTIONS,PATCH,DELETE,PUT"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "POST") return await issuePackage(req, res);
    if (req.method === "GET") return await verifyCode(req, res);
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  } catch (err) {
    console.error("API error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Server error", details: err.message });
  }
};

async function issuePackage(req, res) {
  const {
    email,
    name,
    language = "en",
    paymentMethod = "bit",
    amount = 20,
    creatorBypass = false,
    secretKey,
  } = req.body || {};

  if (!email || !name) {
    return res
      .status(400)
      .json({ success: false, error: "Email and name are required" });
  }

  // Handle creator bypass
  if (creatorBypass) {
    if (secretKey !== process.env.CREATOR_SECRET_KEY) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid creator key" });
    }

    // Creator gets instant access with personal context
    const record = {
      email,
      name,
      language,
      paymentMethod: "creator",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + DAY),
      used: false,
      creator: true,
      // Personal context about Ahiya
      creatorContext: {
        identity:
          "Creator of The Mirror of Truth - someone who builds sacred spaces for people to see their own wholeness",
        philosophy:
          "No fixing, only truth. Quiet certainty over loud persuasion. Wisdom that outshines knowledge.",
        approach:
          "Helps people remember their own power rather than seeking external validation. Sees completeness where others see brokenness.",
        voice:
          "Operates from stillness, never urgency. Direct yet gentle, challenging without apology. Understands that silence loves unconditionally.",
        calling:
          "Creates mirrors for people's truth - not to optimize or improve, but to reveal what's already whole. This work is sacred multiplication.",
        perspective:
          "Believes the deepest gift is helping others trust their own inner compass. Knows that desire doesn't need permission.",
        currentFocus:
          "Building something that may never see the light of day but matters deeply. Operating booths, creating ceremonies, witnessing souls step through mirrors.",
        essence:
          "Someone who channels authentic capacity to see people's truth. The system becomes alive through each person who enters it, carrying this voice to souls never met directly.",
      },
    };

    const creatorCode = "CREATOR";
    accessCodes.set(creatorCode, record);

    return res.json({
      success: true,
      message: "Creator access granted",
      accessCode: creatorCode,
      isCreator: true,
      creatorContext: record.creatorContext,
    });
  }

  // Normal flow - always create new code even for duplicate emails
  const accessCode = generateAccessCode();
  const record = {
    email,
    name,
    language,
    paymentMethod,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + DAY),
    used: false,
  };
  accessCodes.set(accessCode, record);

  const receiptData = {
    receiptNumber: generateReceiptNumber(),
    customerName: name,
    customerEmail: email,
    amount,
    paymentMethod,
    date: new Date().toLocaleString(language === "he" ? "he-IL" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  const codeHtml = getAccessCodeEmailContent(language, name, accessCode);
  const receiptHtml = getReceiptEmailContent(language, receiptData);

  await Promise.all([
    transporter.sendMail({
      from: `"Ahiya – Mirror of Truth" <${process.env.GMAIL_USER}>`,
      to: email,
      subject:
        language === "he"
          ? `${name} – קוד הגישה שלך למראת האמת`
          : `${name} – Your Mirror of Truth Access Code`,
      html: codeHtml,
    }),
    transporter.sendMail({
      from: `"Ahiya – Mirror of Truth" <${process.env.GMAIL_USER}>`,
      to: email,
      subject:
        language === "he"
          ? "קבלה – שירות מראת האמת"
          : "Receipt – Mirror of Truth Service",
      html: receiptHtml,
    }),
  ]);

  return res.json({
    success: true,
    message: "Package sent (code + receipt)",
    accessCode,
    expiresAt: record.expiresAt.toISOString(),
  });
}

async function verifyCode(req, res) {
  const { code, email } = req.query;
  const rec = accessCodes.get(code);

  if (!code || !rec)
    return res
      .status(404)
      .json({ success: false, error: "Invalid access code" });

  if (rec.used)
    return res
      .status(400)
      .json({ success: false, error: "Access code already used" });

  if (Date.now() > rec.expiresAt && code !== "CREATOR")
    return res
      .status(400)
      .json({ success: false, error: "Access code expired" });

  if (email && email !== rec.email)
    return res
      .status(400)
      .json({ success: false, error: "Email does not match code" });

  rec.used = true;
  rec.usedAt = new Date();

  return res.json({
    success: true,
    message: "Access code verified",
    userData: {
      name: rec.name,
      email: rec.email,
      language: rec.language,
      isCreator: rec.creator || false,
      creatorContext: rec.creatorContext || null,
    },
  });
}

// Cleanup expired codes
setInterval(() => {
  const now = Date.now();
  for (const [c, rec] of accessCodes) {
    if (now > rec.expiresAt && c !== "CREATOR") {
      accessCodes.delete(c);
    }
  }
}, DAY);

// Email templates (keeping original functions)
function getAccessCodeEmailContent(language, userName, accessCode) {
  const he = language === "he";
  const dir = he ? "rtl" : "ltr";

  const L = he
    ? {
        subjectLbl: "קוד הגישה שלך",
        greeting: `${userName} היקר,`,
        thank: "תודה על התשלום עבור חוויית מראת האמת.",
        codeLbl: "קוד גישה:",
        valid: "תקף ל-24 שעות",
        howTitle: "איך להשתמש בקוד:",
        steps: [
          "חזור לאתר מראת האמת",
          'לחץ על "תראה אותי" והזן את פרטיך',
          "קוד זה יופיע בשלב האימות – הזן אותו והמשך",
          "התחל את חוויית ההשתקפות שלך",
        ],
        note: "תודה שהשקעת בשיחה עם האמת שלך. המראה שתחזיר לך את הכוח שכבר יש בך.",
        slow: "קח את הזמן עם השאלות; הכנות שלך תיצור את ההשתקפות הצלולה ביותר.",
        sign: "בוודאות שקטה,",
        name: "אחיה",
      }
    : {
        subjectLbl: "Your Access Code",
        greeting: `${userName},`,
        thank: "Thank you for your payment for The Mirror of Truth experience.",
        codeLbl: "Access Code:",
        valid: "Valid for 24 hours",
        howTitle: "How to use your code:",
        steps: [
          "Return to The Mirror of Truth website",
          'Click "Reflect Me" and enter your details',
          "When prompted, enter this verification code",
          "Begin your sacred reflection",
        ],
        note: "Thank you for investing in a conversation with your own truth. What you're about to experience is a mirror that will reveal the power already within you.",
        slow: "Take your time with the questions; your honesty will create the clearest reflection.",
        sign: "With quiet certainty,",
        name: "Ahiya",
      };

  return `<!DOCTYPE html>
   <html lang="${language}" dir="${dir}">
   <head>
   <meta charset="UTF-8" />
   <title>${L.subjectLbl}</title>
   </head>
   <body style="margin:0;padding:0;font-family:Inter,Arial,sans-serif;background:#0f0f23;color:#111;direction:${dir}">
     <div style="max-width:600px;margin:0 auto;padding:40px 20px">
       <div style="background:#fff;border-radius:20px;padding:40px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.25)">
         <h1 style="margin:0 0 20px;font-size:1.8rem">${L.subjectLbl}</h1>
         <p style="margin:0 0 24px;font-size:1rem;line-height:1.6">${
           L.greeting
         }<br>${L.thank}</p>
   
         <div style="background:#f0f9ff;border:2px solid #0ea5e9;border-radius:16px;padding:26px;margin:30px 0">
           <p style="margin:0 0 6px;font-weight:600">${L.codeLbl}</p>
           <div style="font-family:'Courier New',monospace;font-size:2.7rem;font-weight:700;letter-spacing:.25em">${accessCode}</div>
           <p style="margin:8px 0 0;font-size:.9rem;color:#0369a1">${
             L.valid
           }</p>
         </div>
   
         <h3 style="margin:0 0 14px;font-size:1.1rem">${L.howTitle}</h3>
         <ol style="text-align:${
           he ? "right" : "left"
         };margin:0 auto 24px;padding-left:${he ? "0" : "20px"};padding-right:${
    he ? "20px" : "0"
  };max-width:380px;line-height:1.7">
           ${L.steps.map((s) => `<li>${s}</li>`).join("")}
         </ol>
   
         <p style="margin:0 0 14px;line-height:1.6">${L.note}</p>
         <p style="margin:0;font-style:italic;opacity:.7">${L.slow}</p>
   
         <div style="margin-top:32px;text-align:${he ? "left" : "right"}">
           <p style="margin:0">${L.sign}</p>
           <p style="margin:4px 0 0;font-weight:600">${L.name}</p>
         </div>
       </div>
     </div>
   </body>
   </html>`;
}

function getReceiptEmailContent(language, d) {
  const he = language === "he";
  const dir = he ? "rtl" : "ltr";

  const L = he
    ? {
        title: "קבלה",
        paid: "תשלום התקבל",
        bizName: "אחיה",
        bizNum: "עוסק מורשה #325761682",
        receiptNum: "קבלה מס׳",
        service: "מראת האמת – השתקפות אישית",
        custInfo: "פרטי לקוח:",
        payInfo: "פרטי תשלום:",
        amount: "סכום:",
        method: "אמצעי תשלום:",
        date: "תאריך:",
        thank: "תודה שבחרת במראת האמת",
        footer: "קבלה זו משמשת כהוכחת תשלום עבור חוויית ההשתקפות במראת האמת.",
        contact: "לשאלות לגבי קבלה זו, ניתן להשיב למייל זה.",
        methodMap: { cash: "מזומן", bit: "ביט", creator: "יוצר" },
      }
    : {
        title: "Payment Receipt",
        paid: "Payment Received",
        bizName: "Ahiya",
        bizNum: "Business #325761682",
        receiptNum: "Receipt #",
        service: "Mirror of Truth – Personal Reflection",
        custInfo: "Customer Information:",
        payInfo: "Payment Information:",
        amount: "Amount:",
        method: "Payment Method:",
        date: "Date:",
        thank: "Thank you for choosing The Mirror of Truth",
        footer:
          "This receipt serves as proof of payment for The Mirror of Truth reflection experience.",
        contact: "For questions about this receipt, reply to this email.",
        methodMap: { cash: "Cash", bit: "Bit", creator: "Creator" },
      };

  return `<!DOCTYPE html>
   <html lang="${language}" dir="${dir}">
   <head><meta charset="UTF-8" /><title>${L.title}</title></head>
   <body style="margin:0;padding:0;font-family:Inter,Arial,sans-serif;background:#f8fafc;direction:${dir}">
     <div style="max-width:600px;margin:0 auto;padding:40px 20px">
       <div style="background:#fff;border:2px solid #e2e8f0;border-radius:12px;padding:40px;box-shadow:0 4px 12px rgba(0,0,0,.06)">
         <h1 style="text-align:center;font-size:1.7rem;margin:0 0 4px">${
           L.title
         }</h1>
         <p style="text-align:center;margin:0 0 28px;color:#6b7280">${
           L.paid
         }</p>
   
         <div style="display:flex;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding-bottom:18px;margin-bottom:26px">
           <div>
             <h3 style="margin:0 0 6px;font-size:1.05rem">${L.bizName}</h3>
             <p style="margin:0;font-size:.9rem;color:#6b7280">${L.bizNum}</p>
           </div>
           <div style="text-align:${he ? "left" : "right"}">
             <p style="margin:0;font-size:.9rem;color:#6b7280">${
               L.receiptNum
             }</p>
             <p style="margin:4px 0 0;font-weight:600">${d.receiptNumber}</p>
           </div>
         </div>
   
         <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:18px;margin-bottom:26px">
           <h4 style="margin:0 0 8px;font-size:1rem">${L.service}</h4>
         </div>
   
         <h4 style="margin:0 0 10px;font-size:1rem">${L.custInfo}</h4>
         <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-bottom:26px">
           <p style="margin:0 0 6px"><strong>${he ? "שם:" : "Name:"}</strong> ${
    d.customerName
  }</p>
           <p style="margin:0"><strong>${he ? "מייל:" : "Email:"}</strong> ${
    d.customerEmail
  }</p>
         </div>
   
         <h4 style="margin:0 0 10px;font-size:1rem">${L.payInfo}</h4>
         <div style="display:flex;gap:14px;margin-bottom:26px">
           <div style="flex:1;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:14px">
             <p style="margin:0 0 4px;font-size:.85rem;font-weight:600;color:#0c4a6e">${
               L.amount
             }</p>
             <p style="margin:0;font-size:1.1rem;font-weight:700;color:#0369a1">₪${
               d.amount
             }</p>
           </div>
           <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px">
             <p style="margin:0 0 4px;font-size:.85rem;font-weight:600;color:#14532d">${
               L.method
             }</p>
             <p style="margin:0;font-weight:600;color:#166534">${
               L.methodMap[d.paymentMethod] || d.paymentMethod
             }</p>
           </div>
         </div>
         <div style="background:#fefce8;border:1px solid #fde047;border-radius:8px;padding:14px;margin-bottom:34px">
           <p style="margin:0 0 4px;font-size:.85rem;font-weight:600;color:#854d0e">${
             L.date
           }</p>
           <p style="margin:0;font-weight:600;color:#a16207">${d.date}</p>
         </div>
   
         <div style="text-align:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:24px;border-radius:10px;margin-bottom:28px;color:#fff">
           <h3 style="margin:0 0 6px;font-size:1.15rem">${L.thank}</h3>
         </div>
   
         <p style="margin:0 0 8px;font-size:.85rem;color:#6b7280;line-height:1.5">${
           L.footer
         }</p>
         <p style="margin:0;font-size:.85rem;color:#6b7280">${L.contact}</p>
       </div>
     </div>
   </body>
   </html>`;
}
