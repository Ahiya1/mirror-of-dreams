// server/lib/email.ts - Email service using nodemailer with Gmail

import nodemailer from 'nodemailer';

import { emailLogger } from './logger';

// Gmail SMTP configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verify connection on startup (only in development)
if (process.env.NODE_ENV === 'development') {
  transporter.verify((error) => {
    if (error) {
      emailLogger.error({ err: error, operation: 'transporter.verify' }, 'Email service error');
    }
  });
}

// Get the app URL for links
const getAppUrl = () => {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  );
};

// Email templates - Cosmic design aligned with Mirror of Dreams aesthetic
const emailTemplates = {
  emailVerification: (verifyLink: string, userName?: string) => ({
    subject: 'Begin Your Dream Journey | Mirror of Dreams',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0416; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <!-- Outer cosmic void container -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(180deg, #0a0416 0%, #120828 50%, #1a0f2e 100%); min-height: 100vh;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 520px; margin: 0 auto;">

          <!-- Cosmic Header with Moon Icon -->
          <tr>
            <td style="text-align: center; padding-bottom: 32px;">
              <!-- Moon glow effect -->
              <div style="display: inline-block; width: 80px; height: 80px; background: radial-gradient(circle, rgba(124, 58, 237, 0.4) 0%, rgba(124, 58, 237, 0.1) 50%, transparent 70%); border-radius: 50%; margin-bottom: 16px; position: relative;">
                <span style="font-size: 48px; line-height: 80px;">🌙</span>
              </div>
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 200; margin: 0; letter-spacing: 2px; text-transform: uppercase;">
                Mirror of Dreams
              </h1>
              <p style="color: rgba(196, 181, 253, 0.7); font-size: 12px; letter-spacing: 3px; margin: 8px 0 0 0; text-transform: uppercase;">
                Your Gateway to the Realm of Dreams
              </p>
            </td>
          </tr>

          <!-- Main Glass Card with Purple Glow -->
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="
                background: linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(255, 255, 255, 0.03) 50%, rgba(124, 58, 237, 0.05) 100%);
                border-radius: 24px;
                border: 1px solid rgba(124, 58, 237, 0.3);
                box-shadow:
                  0 0 40px rgba(124, 58, 237, 0.15),
                  0 0 80px rgba(124, 58, 237, 0.08),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1);
              ">
                <tr>
                  <td style="padding: 48px 36px;">

                    <!-- Sparkle Icon -->
                    <div style="text-align: center; margin-bottom: 28px;">
                      <span style="font-size: 56px; filter: drop-shadow(0 0 10px rgba(196, 181, 253, 0.5));">✨</span>
                    </div>

                    <!-- Greeting -->
                    <h2 style="color: #ffffff; font-size: 24px; font-weight: 300; text-align: center; margin: 0 0 20px 0; letter-spacing: 0.5px;">
                      ${userName ? `Welcome, ${userName}` : 'Welcome, Dreamer'}
                    </h2>

                    <!-- Divider -->
                    <div style="width: 60px; height: 1px; background: linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.6), transparent); margin: 0 auto 24px auto;"></div>

                    <!-- Message -->
                    <p style="color: rgba(255, 255, 255, 0.85); font-size: 16px; line-height: 1.8; text-align: center; margin: 0 0 32px 0; font-weight: 300;">
                      The mirror awaits. Verify your email to begin your journey through the realm of dreams, where AI-powered insights illuminate the hidden meanings within.
                    </p>

                    <!-- CTA Button with Glow -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${verifyLink}" target="_blank" style="
                            display: inline-block;
                            background: linear-gradient(135deg, rgba(124, 58, 237, 0.9) 0%, rgba(147, 51, 234, 0.9) 100%);
                            color: #ffffff;
                            text-decoration: none;
                            padding: 18px 48px;
                            border-radius: 14px;
                            font-size: 16px;
                            font-weight: 500;
                            letter-spacing: 1px;
                            text-transform: uppercase;
                            border: 1px solid rgba(168, 85, 247, 0.5);
                            box-shadow:
                              0 4px 24px rgba(124, 58, 237, 0.4),
                              0 8px 40px rgba(124, 58, 237, 0.2),
                              inset 0 1px 0 rgba(255, 255, 255, 0.2);
                          ">
                            Enter the Mirror ✦
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Expiry Notice -->
                    <p style="color: rgba(196, 181, 253, 0.5); font-size: 12px; text-align: center; margin: 28px 0 0 0; font-style: italic; letter-spacing: 0.5px;">
                      This gateway remains open for 24 hours
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Features Preview with Glass Effect -->
          <tr>
            <td style="padding-top: 28px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="
                background: linear-gradient(135deg, rgba(124, 58, 237, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%);
                border-radius: 16px;
                border: 1px solid rgba(124, 58, 237, 0.2);
              ">
                <tr>
                  <td style="padding: 24px 28px;">
                    <p style="color: rgba(196, 181, 253, 0.9); font-size: 13px; font-weight: 500; margin: 0 0 16px 0; text-align: center; letter-spacing: 1.5px; text-transform: uppercase;">
                      What Dreams Await
                    </p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0; color: rgba(255, 255, 255, 0.75); font-size: 14px; line-height: 1.6;">
                          <span style="color: #c4b5fd; margin-right: 12px;">🌙</span> Record your dreams in a sacred digital journal
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: rgba(255, 255, 255, 0.75); font-size: 14px; line-height: 1.6;">
                          <span style="color: #c4b5fd; margin-right: 12px;">✨</span> AI-powered analysis reveals hidden patterns
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: rgba(255, 255, 255, 0.75); font-size: 14px; line-height: 1.6;">
                          <span style="color: #c4b5fd; margin-right: 12px;">🔮</span> Watch your inner world unfold over time
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Fallback Link -->
          <tr>
            <td style="padding-top: 28px; text-align: center;">
              <p style="color: rgba(255, 255, 255, 0.35); font-size: 11px; margin: 0 0 10px 0; letter-spacing: 0.5px;">
                If the button doesn't work, copy this link:
              </p>
              <p style="color: rgba(168, 85, 247, 0.7); font-size: 10px; margin: 0; word-break: break-all; line-height: 1.6;">
                ${verifyLink}
              </p>
            </td>
          </tr>

          <!-- Footer with Stars -->
          <tr>
            <td style="padding-top: 48px; text-align: center;">
              <div style="width: 100%; height: 1px; background: linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.3), transparent); margin-bottom: 24px;"></div>
              <p style="color: rgba(255, 255, 255, 0.25); font-size: 11px; margin: 0 0 8px 0; letter-spacing: 2px;">
                ✦ ✦ ✦
              </p>
              <p style="color: rgba(255, 255, 255, 0.3); font-size: 11px; margin: 0 0 4px 0; letter-spacing: 0.5px;">
                Mirror of Dreams
              </p>
              <p style="color: rgba(255, 255, 255, 0.2); font-size: 10px; margin: 0;">
                © ${new Date().getFullYear()} All dreams reserved
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `
MIRROR OF DREAMS
Your Gateway to the Realm of Dreams

${userName ? `Welcome, ${userName}!` : 'Welcome, Dreamer!'}

The mirror awaits. Verify your email to begin your journey through the realm of dreams, where AI-powered insights illuminate the hidden meanings within.

VERIFY YOUR EMAIL:
${verifyLink}

This gateway remains open for 24 hours.

WHAT DREAMS AWAIT:
• Record your dreams in a sacred digital journal
• AI-powered analysis reveals hidden patterns
• Watch your inner world unfold over time

---
Mirror of Dreams
© ${new Date().getFullYear()} All dreams reserved
    `,
  }),

  passwordReset: (resetLink: string, userName?: string) => ({
    subject: 'Return to Your Dreams | Mirror of Dreams',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0416; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <!-- Outer cosmic void container -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(180deg, #0a0416 0%, #120828 50%, #1a0f2e 100%); min-height: 100vh;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 520px; margin: 0 auto;">

          <!-- Cosmic Header -->
          <tr>
            <td style="text-align: center; padding-bottom: 32px;">
              <div style="display: inline-block; width: 80px; height: 80px; background: radial-gradient(circle, rgba(124, 58, 237, 0.4) 0%, rgba(124, 58, 237, 0.1) 50%, transparent 70%); border-radius: 50%; margin-bottom: 16px;">
                <span style="font-size: 48px; line-height: 80px;">🌙</span>
              </div>
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 200; margin: 0; letter-spacing: 2px; text-transform: uppercase;">
                Mirror of Dreams
              </h1>
              <p style="color: rgba(196, 181, 253, 0.7); font-size: 12px; letter-spacing: 3px; margin: 8px 0 0 0; text-transform: uppercase;">
                Your Gateway to the Realm of Dreams
              </p>
            </td>
          </tr>

          <!-- Main Glass Card -->
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="
                background: linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(255, 255, 255, 0.03) 50%, rgba(124, 58, 237, 0.05) 100%);
                border-radius: 24px;
                border: 1px solid rgba(124, 58, 237, 0.3);
                box-shadow:
                  0 0 40px rgba(124, 58, 237, 0.15),
                  0 0 80px rgba(124, 58, 237, 0.08),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1);
              ">
                <tr>
                  <td style="padding: 48px 36px;">

                    <!-- Key Icon -->
                    <div style="text-align: center; margin-bottom: 28px;">
                      <span style="font-size: 56px; filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.4));">🔐</span>
                    </div>

                    <!-- Greeting -->
                    <h2 style="color: #ffffff; font-size: 24px; font-weight: 300; text-align: center; margin: 0 0 20px 0; letter-spacing: 0.5px;">
                      ${userName ? `Hello, ${userName}` : 'Hello, Dreamer'}
                    </h2>

                    <!-- Divider -->
                    <div style="width: 60px; height: 1px; background: linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.6), transparent); margin: 0 auto 24px auto;"></div>

                    <!-- Message -->
                    <p style="color: rgba(255, 255, 255, 0.85); font-size: 16px; line-height: 1.8; text-align: center; margin: 0 0 32px 0; font-weight: 300;">
                      Lost the key to your dreams? No worries. Click below to create a new password and return to your sacred space of reflection.
                    </p>

                    <!-- CTA Button with Golden Glow -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${resetLink}" target="_blank" style="
                            display: inline-block;
                            background: linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%);
                            color: #fde047;
                            text-decoration: none;
                            padding: 18px 48px;
                            border-radius: 14px;
                            font-size: 16px;
                            font-weight: 500;
                            letter-spacing: 1px;
                            text-transform: uppercase;
                            border: 1px solid rgba(251, 191, 36, 0.4);
                            box-shadow:
                              0 4px 24px rgba(251, 191, 36, 0.2),
                              0 8px 40px rgba(251, 191, 36, 0.1),
                              inset 0 1px 0 rgba(255, 255, 255, 0.1);
                          ">
                            Reset Password ✦
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Expiry Notice -->
                    <p style="color: rgba(251, 191, 36, 0.5); font-size: 12px; text-align: center; margin: 28px 0 0 0; font-style: italic; letter-spacing: 0.5px;">
                      This link expires in 1 hour for your security
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding-top: 28px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="
                background: linear-gradient(135deg, rgba(251, 191, 36, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%);
                border-radius: 16px;
                border: 1px solid rgba(251, 191, 36, 0.2);
              ">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="color: rgba(253, 224, 71, 0.85); font-size: 13px; margin: 0; line-height: 1.6; text-align: center;">
                      <span style="margin-right: 8px;">⚠️</span>
                      If you didn't request this, simply ignore this email. Your dreams remain safe and your password unchanged.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Fallback Link -->
          <tr>
            <td style="padding-top: 28px; text-align: center;">
              <p style="color: rgba(255, 255, 255, 0.35); font-size: 11px; margin: 0 0 10px 0; letter-spacing: 0.5px;">
                If the button doesn't work, copy this link:
              </p>
              <p style="color: rgba(251, 191, 36, 0.6); font-size: 10px; margin: 0; word-break: break-all; line-height: 1.6;">
                ${resetLink}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 48px; text-align: center;">
              <div style="width: 100%; height: 1px; background: linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.3), transparent); margin-bottom: 24px;"></div>
              <p style="color: rgba(255, 255, 255, 0.25); font-size: 11px; margin: 0 0 8px 0; letter-spacing: 2px;">
                ✦ ✦ ✦
              </p>
              <p style="color: rgba(255, 255, 255, 0.3); font-size: 11px; margin: 0 0 4px 0; letter-spacing: 0.5px;">
                Mirror of Dreams
              </p>
              <p style="color: rgba(255, 255, 255, 0.2); font-size: 10px; margin: 0;">
                © ${new Date().getFullYear()} All dreams reserved
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `
MIRROR OF DREAMS
Return to Your Dreams

${userName ? `Hello, ${userName}!` : 'Hello, Dreamer!'}

Lost the key to your dreams? No worries. Click below to create a new password and return to your sacred space of reflection.

RESET YOUR PASSWORD:
${resetLink}

This link expires in 1 hour for your security.

If you didn't request this, simply ignore this email. Your dreams remain safe and your password unchanged.

---
Mirror of Dreams
© ${new Date().getFullYear()} All dreams reserved
    `,
  }),
};

// Send password reset email
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const appUrl = getAppUrl();
    const resetLink = `${appUrl}/auth/reset-password.html?token=${token}`;

    const template = emailTemplates.passwordReset(resetLink, userName);

    await transporter.sendMail({
      from: `"Mirror of Dreams" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    return { success: true };
  } catch (error) {
    emailLogger.error(
      { err: error, operation: 'sendPasswordResetEmail', email },
      'Failed to send password reset email'
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

// Send email verification email
export async function sendVerificationEmail(
  email: string,
  token: string,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const appUrl = getAppUrl();
    // Use the API route path for verification
    const verifyLink = `${appUrl}/api/auth/verify-email?token=${token}`;

    const template = emailTemplates.emailVerification(verifyLink, userName);

    await transporter.sendMail({
      from: `"Mirror of Dreams" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    return { success: true };
  } catch (error) {
    emailLogger.error(
      { err: error, operation: 'sendVerificationEmail', email },
      'Failed to send verification email'
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

// Generate secure random token
export function generateToken(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

// Alias for backward compatibility
export const generateResetToken = generateToken;

// Calculate expiration time (1 hour from now) - for password reset
export function getTokenExpiration(): Date {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + 1);
  return expiration;
}

// Calculate expiration time (24 hours from now) - for email verification
export function getVerificationTokenExpiration(): Date {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + 24);
  return expiration;
}
