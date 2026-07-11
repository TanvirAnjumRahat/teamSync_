import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const sendInviteEmail = async (
  to: string,
  inviteLink: string,
  workspaceName: string,
  role: string
) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_USER === 'your-email@gmail.com') {
    console.warn('⚠️ GMAIL_USER or GMAIL_APP_PASSWORD not set or using dummy values. Email not sent.');
    console.log(`[SIMULATED EMAIL] To: ${to} | Link: ${inviteLink} | Workspace: ${workspaceName}`);
    return;
  }

  const mailOptions = {
    from: `"TeamSync AI" <${process.env.GMAIL_USER}>`,
    to,
    subject: `You've been invited to join ${workspaceName} on TeamSync AI`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #3b82f6; text-align: center;">TeamSync AI</h2>
        <p style="font-size: 16px; color: #333;">Hello,</p>
        <p style="font-size: 16px; color: #333;">You have been invited to join the <strong>${workspaceName}</strong> workspace as a <strong>${role}</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        <p style="font-size: 14px; color: #666;">If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="font-size: 14px; color: #3b82f6; word-break: break-all;">
          <a href="${inviteLink}">${inviteLink}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">
          TeamSync AI - Smart IT Productivity & Issue Tracker
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};
