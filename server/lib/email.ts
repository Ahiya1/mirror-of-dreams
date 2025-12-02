// server/lib/email.ts - Email service using nodemailer with Gmail

import nodemailer from 'nodemailer';

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
      console.error('Email service error:', error);
    } else {
      console.log('Email service ready');
    }
  });
}

// Get the app URL for links
const getAppUrl = () => {
  return process.env.NEXT_PUBLIC_APP_URL ||
         process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
         'http://localhost:3000';
};

// Email templates
const emailTemplates = {
  emailVerification: (verifyLink: string, userName?: string) => ({
    subject: 'Verify Your Email | Mirror of Truth',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f23; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0f0f23;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 500px; margin: 0 auto;">

          <!-- Header -->
          <tr>
            <td style="text-align: center; padding-bottom: 30px;">
              <div style="font-size: 48px; margin-bottom: 10px;">🪞</div>
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 300; margin: 0; letter-spacing: 0.5px;">
                Mirror of Truth
              </h1>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%); border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);">
                <tr>
                  <td style="padding: 40px 30px;">

                    <!-- Icon -->
                    <div style="text-align: center; margin-bottom: 25px;">
                      <span style="font-size: 50px;">✨</span>
                    </div>

                    <!-- Greeting -->
                    <h2 style="color: #ffffff; font-size: 22px; font-weight: 400; text-align: center; margin: 0 0 15px 0;">
                      ${userName ? `Welcome ${userName}!` : 'Welcome!'}
                    </h2>

                    <!-- Message -->
                    <p style="color: rgba(255,255,255,0.8); font-size: 15px; line-height: 1.7; text-align: center; margin: 0 0 30px 0; font-weight: 300;">
                      Thank you for joining Mirror of Truth. Please verify your email address to complete your registration and begin your journey of self-discovery.
                    </p>

                    <!-- Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${verifyLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, rgba(52,211,153,0.2) 0%, rgba(52,211,153,0.15) 100%); color: #6ee7b7; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 15px; font-weight: 500; border: 1px solid rgba(52,211,153,0.4); letter-spacing: 0.3px;">
                            Verify Email ✓
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Expiry Notice -->
                    <p style="color: rgba(255,255,255,0.5); font-size: 13px; text-align: center; margin: 25px 0 0 0; font-style: italic;">
                      This link will expire in 24 hours.
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What's Next -->
          <tr>
            <td style="padding-top: 25px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: rgba(52,211,153,0.08); border-radius: 12px; border: 1px solid rgba(52,211,153,0.2);">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: rgba(110,231,183,0.95); font-size: 14px; font-weight: 500; margin: 0 0 10px 0; text-align: center;">
                      What awaits you:
                    </p>
                    <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin: 0; line-height: 1.6; text-align: center;">
                      🌟 AI-powered self-reflection sessions<br>
                      🔮 Deep insights into your inner world<br>
                      📚 A sacred journal of your journey
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Fallback Link -->
          <tr>
            <td style="padding-top: 25px; text-align: center;">
              <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 0 0 8px 0;">
                Button not working? Copy and paste this link:
              </p>
              <p style="color: rgba(59,130,246,0.8); font-size: 11px; margin: 0; word-break: break-all;">
                ${verifyLink}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 40px; text-align: center; border-top: 1px solid rgba(255,255,255,0.08); margin-top: 30px;">
              <p style="color: rgba(255,255,255,0.3); font-size: 12px; margin: 20px 0 0 0;">
                Mirror of Truth - Your sacred space for reflection
              </p>
              <p style="color: rgba(255,255,255,0.2); font-size: 11px; margin: 8px 0 0 0;">
                © ${new Date().getFullYear()} Mirror of Truth. All rights reserved.
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
Mirror of Truth - Verify Your Email

${userName ? `Welcome ${userName}!` : 'Welcome!'}

Thank you for joining Mirror of Truth. Please verify your email address to complete your registration:

${verifyLink}

This link will expire in 24 hours.

What awaits you:
- AI-powered self-reflection sessions
- Deep insights into your inner world
- A sacred journal of your journey

---
Mirror of Truth - Your sacred space for reflection
    `,
  }),

  passwordReset: (resetLink: string, userName?: string) => ({
    subject: 'Reset Your Password | Mirror of Truth',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f23; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0f0f23;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 500px; margin: 0 auto;">

          <!-- Header -->
          <tr>
            <td style="text-align: center; padding-bottom: 30px;">
              <div style="font-size: 48px; margin-bottom: 10px;">🪞</div>
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 300; margin: 0; letter-spacing: 0.5px;">
                Mirror of Truth
              </h1>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%); border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);">
                <tr>
                  <td style="padding: 40px 30px;">

                    <!-- Icon -->
                    <div style="text-align: center; margin-bottom: 25px;">
                      <span style="font-size: 50px;">🔐</span>
                    </div>

                    <!-- Greeting -->
                    <h2 style="color: #ffffff; font-size: 22px; font-weight: 400; text-align: center; margin: 0 0 15px 0;">
                      ${userName ? `Hello ${userName},` : 'Hello,'}
                    </h2>

                    <!-- Message -->
                    <p style="color: rgba(255,255,255,0.8); font-size: 15px; line-height: 1.7; text-align: center; margin: 0 0 30px 0; font-weight: 300;">
                      We received a request to reset your password. Click the button below to create a new password for your account.
                    </p>

                    <!-- Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${resetLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(251,191,36,0.15) 100%); color: #fde047; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 15px; font-weight: 500; border: 1px solid rgba(251,191,36,0.4); letter-spacing: 0.3px;">
                            Reset Password ✨
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Expiry Notice -->
                    <p style="color: rgba(255,255,255,0.5); font-size: 13px; text-align: center; margin: 25px 0 0 0; font-style: italic;">
                      This link will expire in 1 hour for security reasons.
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding-top: 25px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: rgba(251,191,36,0.08); border-radius: 12px; border: 1px solid rgba(251,191,36,0.2);">
                <tr>
                  <td style="padding: 15px 20px;">
                    <p style="color: rgba(253,224,71,0.9); font-size: 13px; margin: 0; line-height: 1.5; text-align: center;">
                      ⚠️ If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Fallback Link -->
          <tr>
            <td style="padding-top: 25px; text-align: center;">
              <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 0 0 8px 0;">
                Button not working? Copy and paste this link:
              </p>
              <p style="color: rgba(59,130,246,0.8); font-size: 11px; margin: 0; word-break: break-all;">
                ${resetLink}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 40px; text-align: center; border-top: 1px solid rgba(255,255,255,0.08); margin-top: 30px;">
              <p style="color: rgba(255,255,255,0.3); font-size: 12px; margin: 20px 0 0 0;">
                Mirror of Truth - Your sacred space for reflection
              </p>
              <p style="color: rgba(255,255,255,0.2); font-size: 11px; margin: 8px 0 0 0;">
                © ${new Date().getFullYear()} Mirror of Truth. All rights reserved.
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
Mirror of Truth - Password Reset

${userName ? `Hello ${userName},` : 'Hello,'}

We received a request to reset your password. Visit the link below to create a new password:

${resetLink}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

---
Mirror of Truth - Your sacred space for reflection
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
    const resetLink = `${appUrl}/auth/reset-password?token=${token}`;

    const template = emailTemplates.passwordReset(resetLink, userName);

    await transporter.sendMail({
      from: `"Mirror of Truth" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    console.log(`Password reset email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
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
    const verifyLink = `${appUrl}/auth/verify-email?token=${token}`;

    const template = emailTemplates.emailVerification(verifyLink, userName);

    await transporter.sendMail({
      from: `"Mirror of Truth" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    console.log(`Verification email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send verification email:', error);
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
