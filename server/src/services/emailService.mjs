import nodemailer from "nodemailer";
import env from "../config/env.mjs";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  secure: env.SMTP_SECURE === "true",
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html, text }) => {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    throw new Error("SMTP email configuration is missing");
  }

  return transporter.sendMail({
    from: `"LuxuryStay" <${env.SMTP_FROM || env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
};

export const sendStaffInvitation = async ({
  email,
  firstName,
  role,
  invitationUrl,
}) => {
  return sendEmail({
    to: email,
    subject: "LuxuryStay Staff Account Invitation",
    text: `Hello ${firstName},

You have been invited to join LuxuryStay as a ${role}.

Set your password using this link:
${invitationUrl}

This invitation expires in 24 hours.

If you did not expect this invitation, please contact LuxuryStay administration.
`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h2>Welcome to LuxuryStay</h2>
        <p>Hello ${firstName},</p>
        <p>
          You have been invited to join LuxuryStay as a
          <strong>${role}</strong>.
        </p>
        <p>
          Click the button below to set your password and activate your account.
        </p>
        <p>
          <a
            href="${invitationUrl}"
            style="
              display:inline-block;
              padding:12px 20px;
              background:#073B2A;
              color:#fff;
              text-decoration:none;
              border-radius:6px;
            "
          >
            Set Password
          </a>
        </p>
        <p>This invitation expires in <strong>24 hours</strong>.</p>
        <p>If you did not expect this invitation, contact LuxuryStay administration.</p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async ({
  email,
  firstName,
  resetUrl,
}) => {
  return sendEmail({
    to: email,
    subject: "LuxuryStay Password Reset",
    text: `Hello ${firstName},

You requested a password reset for your LuxuryStay account.

Reset your password here:
${resetUrl}

This link expires in 1 hour.

If you did not request this, you can safely ignore this email.
`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h2>LuxuryStay Password Reset</h2>
        <p>Hello ${firstName},</p>
        <p>You requested a password reset for your LuxuryStay account.</p>
        <p>
          <a
            href="${resetUrl}"
            style="
              display:inline-block;
              padding:12px 20px;
              background:#073B2A;
              color:#fff;
              text-decoration:none;
              border-radius:6px;
            "
          >
            Reset Password
          </a>
        </p>
        <p>This link expires in <strong>1 hour</strong>.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });
};