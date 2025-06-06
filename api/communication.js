// API: Communication - Sacred Email & Receipts with Fixed Templates

const nodemailer = require("nodemailer");
const { addReceipt } = require("../lib/storage.js");

// Email transporter
const transporter = nodemailer.createTransport({
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

// FIXED: Enhanced reflection email template - clean, single content block
function getReflectionTemplate(userName, content, isPremium = false) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const premiumBadge = isPremium
    ? `
    <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 0.4rem 1rem; border-radius: 0 0 16px 16px; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 1rem; display: inline-block;">
      ✨ Premium Reflection
    </div>
  `
    : "";

  return `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="format-detection" content="telephone=no">
    <title>Your Mirror of Truth Reflection</title>
    <style>
        /* Email client reset */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }
        
        /* Mobile optimization */
        @media screen and (max-width: 600px) {
            .mobile-center { text-align: center !important; }
            .mobile-padding { padding: 20px !important; }
            .mobile-font { font-size: 16px !important; line-height: 1.6 !important; }
            .mobile-title { font-size: 24px !important; }
            .mobile-button { 
                display: block !important; 
                width: 100% !important; 
                padding: 16px !important;
                font-size: 16px !important;
            }
            .mobile-spacer { height: 20px !important; }
            .reflection-content { padding: 24px 20px !important; }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            .force-light { background-color: #ffffff !important; color: #1a1a2e !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; width: 100% !important; min-width: 100%; background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #0f0f23 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    
    <!-- Main container -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #0f0f23 100%); min-height: 100vh;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                
                <!-- Email card -->
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; background: rgba(255, 255, 255, 0.98); border-radius: 24px; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3); overflow: hidden;" class="force-light">
                    
                    <!-- Cosmic header -->
                    <tr>
                        <td style="height: 4px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></td>
                    </tr>
                    
                    <!-- Header content -->
                    <tr>
                        <td style="padding: 40px 40px 30px 40px; text-align: center;" class="mobile-padding">
                            ${premiumBadge}
                            <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 300; color: #1f2937; letter-spacing: 0.5px;" class="mobile-title">
                                Your Mirror of Truth
                            </h1>
                            <div style="width: 60px; height: 2px; background: linear-gradient(135deg, #f59e0b, #ec4899); margin: 0 auto 20px auto; border-radius: 2px;"></div>
                            <p style="margin: 0; color: #6b7280; font-size: 16px; font-style: italic;">
                                A reflection to return to when you need to remember your power
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Greeting -->
                    <tr>
                        <td style="padding: 0 40px 30px 40px;" class="mobile-padding">
                            <p style="margin: 0 0 20px 0; font-size: 18px; color: #374151; font-weight: 500;">
                                ${userName},
                            </p>
                            <p style="margin: 0; font-size: 16px; color: #6b7280; line-height: 1.6;" class="mobile-font">
                                Here is your ${
                                  isPremium ? "premium " : ""
                                }reflection from The Mirror of Truth. This isn't just words on a screen — it's a reminder of who you are when you stop hiding from your own power.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- FIXED: Single reflection content block -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;" class="mobile-padding">
                            <div style="background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%); border: 2px solid #e5e7eb; border-radius: 16px; padding: 32px; position: relative;" class="reflection-content force-light">
                                <!-- Subtle accent -->
                                <div style="position: absolute; top: 12px; left: 12px; width: 32px; height: 32px; background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%); border-radius: 50%;"></div>
                                
                                <!-- Single reflection text -->
                                <div style="font-size: 17px; line-height: 1.7; color: #374151;" class="mobile-font">
                                    ${content}
                                </div>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Instructions -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;" class="mobile-padding">
                            <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef7cd 100%); border-left: 4px solid #f59e0b; padding: 24px; border-radius: 12px;">
                                <p style="margin: 0 0 12px 0; font-size: 16px; color: #92400e; font-weight: 600;">
                                    How to work with this reflection:
                                </p>
                                <p style="margin: 0; font-size: 15px; color: #92400e; line-height: 1.6;" class="mobile-font">
                                    Return to these words when doubt creeps in. When others question your path. When you forget that your desire arose for a reason. This reflection sees the truth of who you are — not who you think you should be, but who you already are when you stop apologizing for wanting what you want.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Save instructions -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;" class="mobile-padding">
                            <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; border: 2px solid #0ea5e9;">
                                <p style="margin: 0; color: #0c4a6e; font-size: 15px; font-weight: 500;" class="mobile-font">
                                    💾 <strong>Save this reflection:</strong> This email contains your complete reflection. Save or print this email to keep it forever.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Action button -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px; text-align: center;" class="mobile-padding">
                            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; text-align: center;">
                                        <a href="https://mirror-of-truth.vercel.app" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 500; letter-spacing: 0.3px;" class="mobile-button">
                                            ✨ Visit The Mirror of Truth
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Personal message -->
                    <tr>
                        <td style="padding: 40px 40px 30px 40px; border-top: 2px solid #e5e7eb;" class="mobile-padding">
                            <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;" class="mobile-font">
                                This work of creating mirrors for people's truth — helping them see their wholeness instead of their brokenness — it's what I'm here to do. If this reflection landed for you, if it helped you see something you hadn't seen before, I'd love to hear about it.
                            </p>
                            <p style="margin: 0 0 16px 0; font-size: 15px; color: #6b7280; font-style: italic;" class="mobile-font">
                                Just reply to this email. I read every response personally.
                            </p>
                            <p style="margin: 0; font-size: 15px; color: #6b7280; line-height: 1.6;" class="mobile-font">
                                And if you know someone who could use their own mirror — someone who's been waiting for permission to trust their dreams — send them to The Mirror of Truth. The deepest gift we can give is helping others remember their own power.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Signature -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px; text-align: right;" class="mobile-padding mobile-center">
                            <p style="margin: 0 0 6px 0; font-size: 16px; color: #374151;">
                                With quiet certainty,
                            </p>
                            <p style="margin: 0 0 6px 0; font-size: 20px; color: #1f2937; font-weight: 600;">
                                Ahiya
                            </p>
                            <p style="margin: 0; font-size: 14px; color: #9ca3af; font-style: italic;">
                                Creator, The Mirror of Truth
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer note -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;" class="mobile-padding">
                            <div style="background: #f9fafb; border-left: 3px solid #d1d5db; padding: 20px; border-radius: 8px;">
                                <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;" class="mobile-font">
                                    <strong>P.S.</strong> This isn't a business email or a marketing funnel. It's one human being offering another human being a chance to see themselves clearly. If that's what you received, then the mirror worked exactly as intended.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                </table>
                
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// Gift invitation email template with premium support
function getGiftInvitationTemplate(gift) {
  const giftUrl = `${getBaseUrl()}/breathing?gift=${gift.giftCode}`;
  const giftType = gift.isPremium ? "Premium" : "Essential";
  const giftAmount = gift.isPremium ? "$4.99" : "$2.99";

  return `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>A Sacred Gift Awaits You</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #0f0f23 100%); color: #fff; line-height: 1.6;">
    
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        
        <!-- Gift Card -->
        <div style="background: rgba(255, 255, 255, 0.06); backdrop-filter: blur(30px); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 24px; padding: 40px; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3); position: relative; overflow: hidden;">
            
            <!-- Cosmic accent -->
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);"></div>
            
            ${
              gift.isPremium
                ? `
            <!-- Premium badge -->
            <div style="position: absolute; top: -1px; right: 2rem; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 0.4rem 1rem; border-radius: 0 0 16px 16px; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">
                ✨ Premium Gift
            </div>
            `
                : ""
            }
            
            <!-- Gift icon -->
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 4rem; margin-bottom: 20px;">🎁</div>
                <h1 style="font-size: 2rem; font-weight: 300; margin: 0 0 10px 0; background: linear-gradient(135deg, #ffffff 0%, rgba(251, 191, 36, 0.9) 50%, #ffffff 100%); -webkit-background-clip: text; color: transparent;">
                    A Sacred ${giftType} Gift Awaits You
                </h1>
                <p style="margin: 0; opacity: 0.8; font-size: 1.1rem;">Someone sees your light</p>
            </div>

            <!-- Gift message -->
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 30px; margin: 30px 0; text-align: center;">
                <h2 style="font-size: 1.5rem; font-weight: 400; margin: 0 0 20px 0; color: rgba(255, 255, 255, 0.95);">From ${
                  gift.giverName
                }</h2>
                
                ${
                  gift.personalMessage
                    ? `
                <div style="background: rgba(251, 191, 36, 0.1); border-left: 3px solid rgba(251, 191, 36, 0.5); padding: 20px; border-radius: 8px; margin: 20px 0; font-style: italic; color: rgba(255, 255, 255, 0.9);">
                    "${gift.personalMessage}"
                </div>
                `
                    : ""
                }
                
                <p style="margin: 20px 0; font-size: 1.1rem; color: rgba(255, 255, 255, 0.85); line-height: 1.7;">
                    ${
                      gift.giverName
                    } has gifted you a <strong>${giftType} reflection experience</strong> (${giftAmount} value) from <strong>The Mirror of Truth</strong> — a sacred space to connect with your dreams and remember your wholeness.
                </p>
                
                ${
                  gift.isPremium
                    ? `
                <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 1rem; color: rgba(251, 191, 36, 0.9); font-weight: 500;">
                        ✨ This Premium gift includes enhanced AI thinking for deeper, more personally accurate insights.
                    </p>
                </div>
                `
                    : ""
                }
            </div>

            <!-- What they'll experience -->
            <div style="margin: 30px 0;">
                <h3 style="text-align: center; margin-bottom: 20px; color: rgba(255, 255, 255, 0.9); font-weight: 500;">Your Sacred Journey</h3>
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: rgba(255, 255, 255, 0.02); border-radius: 12px;">
                        <span style="font-size: 1.5rem;">🌊</span>
                        <span style="color: rgba(255, 255, 255, 0.8);">A breathing meditation to center and prepare</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: rgba(255, 255, 255, 0.02); border-radius: 12px;">
                        <span style="font-size: 1.5rem;">❓</span>
                        <span style="color: rgba(255, 255, 255, 0.8);">5 profound questions about your dreams</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: rgba(255, 255, 255, 0.02); border-radius: 12px;">
                        <span style="font-size: 1.5rem;">✨</span>
                        <span style="color: rgba(255, 255, 255, 0.8);">A personalized ${giftType.toLowerCase()} reflection showing your wholeness</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: rgba(255, 255, 255, 0.02); border-radius: 12px;">
                        <span style="font-size: 1.5rem;">📧</span>
                        <span style="color: rgba(255, 255, 255, 0.8);">Your reflection emailed to keep forever</span>
                    </div>
                    ${
                      gift.isPremium
                        ? `
                    <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: rgba(251, 191, 36, 0.05); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 12px;">
                        <span style="font-size: 1.5rem;">🧠</span>
                        <span style="color: rgba(251, 191, 36, 0.9);">Enhanced AI thinking for deeper insights</span>
                    </div>
                    `
                        : ""
                    }
                </div>
            </div>

            <!-- Call to action -->
            <div style="text-align: center; margin: 40px 0 30px 0;">
                <p style="margin-bottom: 25px; font-size: 1.1rem; color: rgba(255, 255, 255, 0.8);">
                    Ready to see yourself clearly?
                </p>
                <a href="${giftUrl}" style="display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%); border: 2px solid rgba(255, 255, 255, 0.25); border-radius: 20px; color: #fff; text-decoration: none; font-size: 1.2rem; font-weight: 500; letter-spacing: 0.5px; transition: all 0.3s ease; box-shadow: 0 8px 32px rgba(255, 255, 255, 0.1);">
                    ✨ Begin My ${giftType} Reflection ✨
                </a>
            </div>

            <!-- Gift note -->
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 20px; margin-top: 30px; text-align: center;">
                <p style="margin: 0; font-size: 0.9rem; color: rgba(255, 255, 255, 0.7); line-height: 1.6;">
                    This ${giftType.toLowerCase()} gift can only be redeemed once and is yours alone. When you're ready to explore the questions that matter most, your sacred space awaits.
                </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                <p style="margin: 0 0 15px 0; color: rgba(255, 255, 255, 0.6); font-size: 0.9rem;">
                    With quiet certainty,<br>
                    <strong>Ahiya</strong><br>
                    Creator, The Mirror of Truth
                </p>
                <p style="margin: 0; font-size: 0.8rem; color: rgba(255, 255, 255, 0.5);">
                    <em>"The deepest gift we can give is helping others remember their own power"</em>
                </p>
            </div>
        </div>
    </div>
</body>
</html>`;
}

// Gift receipt email template with premium support
function getGiftReceiptTemplate(gift) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const giftType = gift.isPremium ? "Premium" : "Essential";

  return `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gift Receipt - Mirror of Truth</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        
        <!-- Receipt Card -->
        <div style="background: white; border: 2px solid #e2e8f0; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <!-- Header -->
            <div style="text-align: center; padding-bottom: 30px; border-bottom: 2px solid #e2e8f0; margin-bottom: 30px;">
                <div style="font-size: 2rem; margin-bottom: 10px;">🎁</div>
                <h1 style="font-size: 1.8rem; color: #1f2937; margin: 0 0 10px 0; font-weight: 700;">Gift Receipt</h1>
                <p style="color: #6b7280; margin: 0; font-size: 1rem;">Sacred ${giftType} Reflection Gift</p>
            </div>

            <!-- Gift Details -->
            <div style="margin-bottom: 30px;">
                <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 1.2rem;">Gift Information</h3>
                <div style="background: #f9fafb; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px;">
                    <p style="margin: 0 0 10px 0; color: #374151;"><strong>Gift Code:</strong> ${
                      gift.giftCode
                    }</p>
                    <p style="margin: 0 0 10px 0; color: #374151;"><strong>Gift Type:</strong> ${giftType} Reflection</p>
                    <p style="margin: 0 0 10px 0; color: #374151;"><strong>From:</strong> ${
                      gift.giverName
                    } (${gift.giverEmail})</p>
                    <p style="margin: 0 0 10px 0; color: #374151;"><strong>To:</strong> ${
                      gift.recipientName
                    } (${gift.recipientEmail})</p>
                    <p style="margin: 0; color: #374151;"><strong>Amount:</strong> $${
                      gift.amount
                    }</p>
                </div>
            </div>

            <!-- Payment Info -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                <div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 15px; border-radius: 8px;">
                    <p style="color: #0c4a6e; margin: 0 0 5px 0; font-size: 0.9rem; font-weight: 600;">Payment Method:</p>
                    <p style="color: #0369a1; margin: 0; font-size: 1rem; font-weight: 600;">${
                      gift.paymentMethod === "paypal" ? "PayPal" : "Card"
                    }</p>
                </div>
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px;">
                    <p style="color: #14532d; margin: 0 0 5px 0; font-size: 0.9rem; font-weight: 600;">Date:</p>
                    <p style="color: #166534; margin: 0; font-size: 1rem; font-weight: 600;">${currentDate}</p>
                </div>
            </div>

            <!-- Personal Message -->
            ${
              gift.personalMessage
                ? `
            <div style="margin-bottom: 30px;">
                <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 1.2rem;">Personal Message</h3>
                <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px;">
                    <p style="margin: 0; color: #92400e; font-style: italic; line-height: 1.6;">"${gift.personalMessage}"</p>
                </div>
            </div>
            `
                : ""
            }

            <!-- Status -->
            <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 10px 0; font-size: 1.2rem;">Gift Status</h3>
                <p style="margin: 0; font-size: 0.9rem; opacity: 0.9;">${giftType} invitation sent to ${
    gift.recipientName
  }</p>
            </div>

            <!-- Footer -->
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 0.85rem; line-height: 1.5;">Thank you for sharing the gift of reflection and truth.</p>
                <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 0.85rem;">Your recipient will receive their ${giftType.toLowerCase()} invitation shortly.</p>
                <p style="color: #9ca3af; margin: 0; font-size: 0.8rem; font-style: italic;">The Mirror of Truth - Helping others remember their wholeness</p>
            </div>
        </div>
    </div>
</body>
</html>`;
}

// Receipt email template with premium support (keeping existing for now)
function getReceiptTemplate(receiptData) {
  const serviceType = receiptData.isPremium ? "Premium" : "Essential";

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
                    ">AhIya</h3>
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
                ">Mirror of Truth - ${serviceType} Reflection Session</h4>
                <p style="
                    color: #6b7280;
                    margin: 0;
                    font-size: 0.9rem;
                    line-height: 1.5;
                ">${serviceType} reflection session designed to help you see yourself clearly and connect with your inner power.</p>
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
                ">This receipt serves as proof of payment for the Mirror of Truth ${serviceType.toLowerCase()} reflection experience.</p>
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
                ">This service is provided by AhIya - a registered business.</p>
            </div>
        </div>
    </div>
</body>
</html>`;
}

// Helper to get base URL
function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.DOMAIN) {
    return process.env.DOMAIN;
  }
  return "http://localhost:3000";
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
    } else if (action === "send-gift-invitation") {
      return await handleSendGiftInvitation(req, res);
    } else if (action === "generate-gift-receipt") {
      return await handleGenerateGiftReceipt(req, res);
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

// Send reflection email with premium support
async function handleSendReflection(req, res) {
  const {
    email,
    content,
    userName = "Friend",
    language = "en",
    isPremium = false,
  } = req.body;

  if (!email || !content) {
    return res.status(400).json({
      success: false,
      error: "Email and content are required",
    });
  }

  const serviceType = isPremium ? "Premium" : "Essential";
  const subject = `${userName} - Your ${serviceType} Mirror of Truth Reflection`;
  const htmlContent = getReflectionTemplate(userName, content, isPremium);

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

// Send gift invitation
async function handleSendGiftInvitation(req, res) {
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
  const htmlContent = getGiftInvitationTemplate(gift);

  await transporter.sendMail({
    from: `"Ahiya - The Mirror of Truth" <${process.env.GMAIL_USER}>`,
    to: gift.recipientEmail,
    subject: subject,
    html: htmlContent,
  });

  return res.json({
    success: true,
    message: "Gift invitation sent successfully",
    timestamp: new Date().toISOString(),
  });
}

// Generate gift receipt for purchaser
async function handleGenerateGiftReceipt(req, res) {
  const { gift } = req.body;

  if (!gift || !gift.giverEmail || !gift.giftCode) {
    return res.status(400).json({
      success: false,
      error: "Gift information required",
    });
  }

  const giftType = gift.isPremium ? "Premium" : "Essential";
  const subject = `${giftType} Gift Receipt - Mirror of Truth Reflection`;
  const htmlContent = getGiftReceiptTemplate(gift);

  await transporter.sendMail({
    from: `"Ahiya - The Mirror of Truth" <${process.env.GMAIL_USER}>`,
    to: gift.giverEmail,
    subject: subject,
    html: htmlContent,
  });

  return res.json({
    success: true,
    message: "Gift receipt sent successfully",
    timestamp: new Date().toISOString(),
  });
}

// Generate and send receipt with premium support
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
      isPremium: isPremium,
      date: receiptData.date,
    });

    console.log(
      `✅ ${serviceType} receipt stored: ${storedReceipt.receiptNumber}`
    );
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
