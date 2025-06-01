const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function getEmailContent(language, userName, content) {
  const isHebrew = language === "he";
  const direction = isHebrew ? "rtl" : "ltr";

  const texts = {
    en: {
      subject: `${userName} - Your Mirror of Truth Reflection`,
      greeting: `${userName},`,
      intro:
        "Here is your reflection from The Mirror of Truth. This isn't just words on a screen — it's a reminder of who you are when you stop hiding from your own power.",
      howToUse: "How to work with this reflection:",
      instructions:
        "Return to these words when doubt creeps in. When others question your path. When you forget that your desire arose for a reason. This reflection sees the truth of who you are — not who you think you should be, but who you already are when you stop apologizing for wanting what you want.",
      saveNote:
        "💾 Save this reflection: Copy the text above or print this email. Keep it somewhere you can find it when you need to remember your truth.",
      personalNote:
        "This work of creating mirrors for people's truth — helping them see their wholeness instead of their brokenness — it's what I'm here to do. If this reflection landed for you, if it helped you see something you hadn't seen before, I'd love to hear about it.",
      replyNote: "Just reply to this email. I read every response personally.",
      shareNote:
        "And if you know someone who could use their own mirror — someone who's been waiting for permission to trust their dreams — send them to The Mirror of Truth. The deepest gift we can give is helping others remember their own power.",
      signature: "With quiet certainty,",
      name: "Ahiya",
      title: "Creator, The Mirror of Truth",
      postScript:
        "This isn't a business email or a marketing funnel. It's one human being offering another human being a chance to see themselves clearly. If that's what you received, then the mirror worked exactly as intended.",
      websiteText: "Experience another reflection at The Mirror of Truth",
    },
    he: {
      subject: `${userName} - השתקפות מראה האמת שלך`,
      greeting: `${userName} היקר,`,
      intro:
        "הנה ההשתקפות שלך ממראה האמת. זה לא רק מילים על מסך — זה תזכורת למי שאתה כשאתה מפסיק להתחבא מהכוח שלך.",
      howToUse: "איך לעבוד עם ההשתקפות הזו:",
      instructions:
        "חזור למילים האלה כשהספק נכנס. כשאחרים מטילים ספק בדרך שלך. כשאתה שוכח שהרצון שלך קם מסיבה. ההשתקפות הזו רואה את האמת של מי שאתה — לא מי שאתה חושב שאתה צריך להיות, אלא מי שאתה כבר כשאתה מפסיק להתנצל על זה שאתה רוצה את מה שאתה רוצה.",
      saveNote:
        "💾 שמור את ההשתקפות הזו: העתק את הטקסט למעלה או הדפס את המייל הזה. שמור אותו במקום שתוכל למצוא כשתצטרך להיזכר באמת שלך.",
      personalNote:
        "העבודה הזו של יצירת מראות לאמת של אנשים — לעזור להם לראות את השלמות שלהם במקום השבריריות — זה מה שאני כאן לעשות. אם ההשתקפות הזו נגעה בך, אם היא עזרה לך לראות משהו שלא ראית בעבר, אני אשמח לשמוע על זה.",
      replyNote: "פשוט הגב למייל הזה. אני קורא כל תגובה באופן אישי.",
      shareNote:
        "ואם אתה מכיר מישהו שיכול להשתמש במראה שלו — מישהו שחיכה לאישור לבטוח בחלומות שלו — שלח אותו למראה האמת. המתנה הכי עמוקה שאנחנו יכולים לתת היא לעזור לאחרים להיזכר בכוח שלהם.",
      signature: "בוודאות שקטה,",
      name: "אחיה",
      title: "יוצר, מראה האמת",
      postScript:
        "זה לא מייל עסקי או משפך שיווקי. זה אדם אחד שמציע לאדם אחר הזדמנות לראות את עצמו בבהירות. אם זה מה שקיבלת, אז המראה עבדה בדיוק כמו שהתכוונה.",
      websiteText: "חווה השתקפות נוספת במראה האמת",
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
    direction: ${direction};
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
                ${isHebrew ? "right" : "left"}: 0;
                ${isHebrew ? "left" : "right"}: 0;
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
                ">
                    ${isHebrew ? "מראה האמת שלך" : "Your Mirror of Truth"}
                </h1>
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
                ">${
                  isHebrew
                    ? "השתקפות לחזור אליה כשאתה צריך להיזכר בכוח שלך"
                    : "A reflection to return to when you need to remember your power"
                }</p>
            </div>

            <!-- Greeting -->
            <div style="margin-bottom: 35px; text-align: ${
              isHebrew ? "right" : "left"
            };">
                <p style="
                    font-size: 1.1rem;
                    color: #374151;
                    margin: 0 0 20px 0;
                    font-weight: 500;
                ">${t.greeting}</p>
                
                <p style="
                    font-size: 1rem;
                    color: #6b7280;
                    margin: 0;
                    line-height: 1.7;
                ">${t.intro}</p>
            </div>

            <!-- Reflection Content -->
            <div style="
                border: 2px solid #e5e7eb;
                padding: 40px;
                border-radius: 16px;
                margin-bottom: 40px;
                background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
                position: relative;
                text-align: ${isHebrew ? "right" : "left"};
            ">
                <div style="
                    position: absolute;
                    top: 15px;
                    ${isHebrew ? "right" : "left"}: 15px;
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
                border-${isHebrew ? "right" : "left"}: 4px solid #f59e0b;
                padding: 30px;
                border-radius: 12px;
                margin-bottom: 40px;
                text-align: ${isHebrew ? "right" : "left"};
            ">
                <p style="
                    margin: 0 0 15px 0;
                    font-size: 1rem;
                    color: #92400e;
                    font-weight: 600;
                ">${t.howToUse}</p>
                <p style="
                    margin: 0;
                    font-size: 1rem;
                    color: #92400e;
                    line-height: 1.7;
                ">${t.instructions}</p>
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
                ">${t.saveNote}</p>
            </div>

            <!-- Personal Note from Ahiya -->
            <div style="
                border-top: 2px solid #e5e7eb;
                padding-top: 35px;
                margin-bottom: 35px;
                text-align: ${isHebrew ? "right" : "left"};
            ">
                <p style="
                    font-size: 1rem;
                    color: #374151;
                    margin: 0 0 20px 0;
                    line-height: 1.7;
                ">${t.personalNote}</p>
                
                <p style="
                    font-size: 0.95rem;
                    color: #6b7280;
                    margin: 0 0 20px 0;
                    font-style: italic;
                ">${t.replyNote}</p>

                <p style="
                    font-size: 0.95rem;
                    color: #6b7280;
                    margin: 0;
                    line-height: 1.6;
                ">${t.shareNote}</p>
            </div>

            <!-- Signature -->
            <div style="
                text-align: ${isHebrew ? "left" : "right"};
                margin-bottom: 30px;
            ">
                <p style="
                    margin: 0 0 8px 0;
                    font-size: 1rem;
                    color: #374151;
                ">${t.signature}</p>
                <p style="
                    margin: 0;
                    font-size: 1.2rem;
                    color: #1f2937;
                    font-weight: 600;
                ">${t.name}</p>
                <p style="
                    margin: 8px 0 0 0;
                    font-size: 0.85rem;
                    color: #9ca3af;
                    font-style: italic;
                ">${t.title}</p>
            </div>

            <!-- Footer -->
            <div style="
                background: #f9fafb;
                border-${isHebrew ? "right" : "left"}: 3px solid #d1d5db;
                padding: 25px;
                border-radius: 8px;
                text-align: ${isHebrew ? "right" : "left"};
            ">
                <p style="
                    margin: 0;
                    font-size: 0.9rem;
                    color: #6b7280;
                    line-height: 1.6;
                ">
                    <strong>P.S.</strong> ${t.postScript}
                </p>
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
    const { email, content, userName = "Friend", language = "en" } = req.body;

    if (!email || !content) {
      return res.status(400).json({
        success: false,
        error: "Email and content are required",
      });
    }

    const isHebrew = language === "he";
    const subject = isHebrew
      ? `${userName} - השתקפות מראה האמת שלך`
      : `${userName} - Your Mirror of Truth Reflection`;

    const htmlContent = getEmailContent(language, userName, content);

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
      message: "Reflection sent successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Mirror Email API Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send reflection",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
