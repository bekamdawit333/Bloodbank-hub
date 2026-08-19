const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { mainDb } = require("../config/prisma");
const { JWT_SECRET } = require("../middleware/auth");

// Helper to send transactional email using Brevo API
async function sendBrevoEmail(toEmail, code) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.log(
      `[Brevo Mock] No API Key set. Email to: ${toEmail} Code: ${code}`,
    );
    return;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "Blood Bank Hub",
          email: "dagiderbe59@gmail.com",
        },
        to: [
          {
            email: toEmail,
          },
        ],
        subject: "Blood Bank Hub - Email Verification Code",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; padding: 25px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 500px; margin: 0 auto; background-color: #fafafa;">
            <h2 style="color: #ef233c; text-align: center; margin-top: 0; font-weight: 800; letter-spacing: -0.5px;">Blood Bank Hub</h2>
            <p style="font-size: 1rem; color: #333; line-height: 1.5;">Welcome to the Blood Bank & Emergency Response System!</p>
            <p style="font-size: 0.95rem; color: #555;">Use the following 6-digit verification code to complete your donor registration:</p>
            <div style="text-align: center; margin: 25px 0;">
              <span style="font-size: 28px; font-weight: 800; background: #ffffff; border: 1px dashed #ef233c; color: #ef233c; padding: 12px 24px; border-radius: 6px; letter-spacing: 4px; display: inline-block; font-family: monospace;">
                ${code}
              </span>
            </div>
            <p style="color: #666; font-size: 0.8rem; line-height: 1.4; border-top: 1px solid #eeeeee; padding-top: 15px; margin-top: 25px;">
              This code will expire in 10 minutes. If you did not request this registry profile, you can safely ignore this email.
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Brevo Error Response]:", errorText);
    } else {
      console.log(
        `[Brevo Email Sent] Verification code ${code} sent to ${toEmail}`,
      );
    }
  } catch (err) {
    console.error("[Brevo Email Send Error]:", err.message);
  }
}

async function sendForgotPasswordEmail(toEmail, code) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.log(
      `[Brevo Mock] No API Key set. Forgot Password Email to: ${toEmail} Code: ${code}`,
    );
    return;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "Blood Bank Hub",
          email: "dagiderbe59@gmail.com",
        },
        to: [
          {
            email: toEmail,
          },
        ],
        subject: "Blood Bank Hub - Password Reset Code",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; padding: 25px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 500px; margin: 0 auto; background-color: #fafafa;">
            <h2 style="color: #ef233c; text-align: center; margin-top: 0; font-weight: 800; letter-spacing: -0.5px;">Blood Bank Hub</h2>
            <p style="font-size: 1rem; color: #333; line-height: 1.5;">You requested a password reset for your donor profile.</p>
            <p style="font-size: 0.95rem; color: #555;">Use the following 6-digit verification code to complete your password reset:</p>
            <div style="text-align: center; margin: 25px 0;">
              <span style="font-size: 28px; font-weight: 800; background: #ffffff; border: 1px dashed #ef233c; color: #ef233c; padding: 12px 24px; border-radius: 6px; letter-spacing: 4px; display: inline-block; font-family: monospace;">
                ${code}
              </span>
            </div>
            <p style="color: #666; font-size: 0.8rem; line-height: 1.4; border-top: 1px solid #eeeeee; padding-top: 15px; margin-top: 25px;">
              This code will expire in 10 minutes. If you did not request a password reset, you can safely ignore this email and your password will remain unchanged.
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Brevo Error Response]:", errorText);
    } else {
      console.log(
        `[Brevo Email Sent] Password reset code ${code} sent to ${toEmail}`,
      );
    }
  } catch (err) {
    console.error("[Brevo Email Send Error]:", err.message);
  }
}
