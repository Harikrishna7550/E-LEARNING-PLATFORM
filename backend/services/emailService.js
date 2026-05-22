const nodemailer = require('nodemailer');
const config = require('../config/dbConfig');

// Allow env overrides so user can provide EMAIL_USER and EMAIL_APP_PASSWORD
const emailUser = process.env.EMAIL_USER || process.env.EMAIL || config.email.user;
const emailPass = process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASS || config.email.pass;
const emailFrom = process.env.EMAIL_FROM || config.email.from;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || config.email.host,
  port: Number(process.env.EMAIL_PORT || config.email.port) || 587,
  secure: false,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendOtpEmail = async ({ to, otp }) => {
  const mailOptions = {
    from: emailFrom,
    to,
    subject: 'Your OTP for E-Learning Platform Signup',
    text: `Your OTP is: ${otp}. It expires in 10 minutes.`,
  };
  try {
    return await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('sendOtpEmail SMTP error:', err);
    throw err;
  }
};

const sendForgotPasswordOtpEmail = async ({ to, otp }) => {
  const mailOptions = {
    from: emailFrom,
    to,
    subject: 'Your OTP for E-Learning Platform Password Reset',
    text: `Your OTP for password reset is: ${otp}. It expires in 10 minutes.`,
    html: `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <div style="max-width:600px;margin:0 auto;padding:20px;border:1px solid #eaeaea;border-radius:8px;">
        <h2 style="color:#111;">Password Reset Request</h2>
        <p style="line-height:1.6;">We received a request to reset your password. Use the OTP below to reset your password.</p>
        <div style="text-align:center;margin:24px 0;padding:20px;background-color:#f5f5f5;border-radius:6px;">
          <p style="font-size:12px;color:#777;">Your OTP is:</p>
          <h1 style="color:#28a745;letter-spacing:5px;margin:10px 0;">${otp}</h1>
          <p style="font-size:12px;color:#777;">This OTP expires in 10 minutes.</p>
        </div>
        <p style="font-size:12px;color:#777;">If you did not request a password reset, please ignore this email.</p>
      </div>
    </div>
    `,
  };
  try {
    return await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('sendForgotPasswordOtpEmail SMTP error:', err);
    throw err;
  }
};

module.exports = {
  sendOtpEmail,
  sendForgotPasswordOtpEmail,
};
