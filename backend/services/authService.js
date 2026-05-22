const jwt = require('jsonwebtoken');
const config = require('../config/dbConfig');
const { findUserByEmail, createUser, saveUser } = require('./userService');
const { sendOtpEmail, sendForgotPasswordOtpEmail } = require('./emailService');

const generateToken = (userId) => {
  return jwt.sign({ user: { id: userId } }, config.jwtSecret, {
    expiresIn: config.jwtExpire,
  });
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendSignupOtp = async ({ name, email, password, role }) => {
  const existingUser = await findUserByEmail(email);
  if (existingUser && existingUser.verified) {
    const error = new Error('Email already registered');
    error.status = 400;
    throw error;
  }

  const otp = generateOtp();
  const otpExpires = Date.now() + 10 * 60 * 1000;

  if (existingUser) {
    existingUser.name = name;
    existingUser.password = password;
    existingUser.role = role || 'student';
    existingUser.otp = otp;
    existingUser.otpExpires = otpExpires;
    await saveUser(existingUser);
  } else {
    await createUser({
      name,
      email,
      password,
      role: role || 'student',
      otp,
      otpExpires,
    });
  }

  await sendOtpEmail({ to: email, otp });
  return { message: 'OTP sent to your email' };
};

const verifySignupOtp = async ({ email, otp }) => {
  const user = await findUserByEmail(email);
  if (!user) {
    const error = new Error('User not found');
    error.status = 400;
    throw error;
  }
  if (user.verified) {
    const error = new Error('User already verified');
    error.status = 400;
    throw error;
  }
  if (!user.otp || user.otp !== otp) {
    const error = new Error('Invalid OTP');
    error.status = 400;
    throw error;
  }
  if (Date.now() > user.otpExpires) {
    const error = new Error('OTP expired');
    error.status = 400;
    throw error;
  }

  user.verified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await saveUser(user);

  const token = generateToken(user._id);
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

const loginUser = async ({ email, password }) => {
  const user = await findUserByEmail(email);
  if (!user) {
    const error = new Error('Email is not registered');
    error.status = 400;
    throw error;
  }
  if (!user.verified) {
    const error = new Error('Please verify your email first');
    error.status = 400;
    throw error;
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Incorrect password');
    error.status = 400;
    throw error;
  }

  const token = generateToken(user._id);

  return {
    token,
    user: {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      verified: user.verified,
      profile: user.profile,
      instructorProfile: user.instructorProfile,
      darkModePreference: user.darkModePreference,
    },
  };
};

const sendForgotPasswordOtp = async ({ email }) => {
  const user = await findUserByEmail(email);
  if (!user) {
    const error = new Error('User not found');
    error.status = 400;
    throw error;
  }

  const otp = generateOtp();
  const otpExpires = Date.now() + 10 * 60 * 1000;

  user.forgotPasswordOtp = otp;
  user.forgotPasswordOtpExpires = otpExpires;
  await saveUser(user);

  await sendForgotPasswordOtpEmail({ to: email, otp });
  return { message: 'OTP sent to your email for password reset' };
};

const verifyForgotPasswordOtp = async ({ email, otp }) => {
  const user = await findUserByEmail(email);
  if (!user) {
    const error = new Error('User not found');
    error.status = 400;
    throw error;
  }

  if (!user.forgotPasswordOtp || user.forgotPasswordOtp !== otp) {
    const error = new Error('Invalid OTP');
    error.status = 400;
    throw error;
  }

  if (Date.now() > user.forgotPasswordOtpExpires) {
    const error = new Error('OTP expired');
    error.status = 400;
    throw error;
  }

  return { message: 'OTP verified successfully' };
};

const resetPassword = async ({ email, otp, newPassword }) => {
  const user = await findUserByEmail(email);
  if (!user) {
    const error = new Error('User not found');
    error.status = 400;
    throw error;
  }

  if (!user.forgotPasswordOtp || user.forgotPasswordOtp !== otp) {
    const error = new Error('Invalid OTP');
    error.status = 400;
    throw error;
  }

  if (Date.now() > user.forgotPasswordOtpExpires) {
    const error = new Error('OTP expired');
    error.status = 400;
    throw error;
  }

  user.password = newPassword;
  user.forgotPasswordOtp = undefined;
  user.forgotPasswordOtpExpires = undefined;
  await saveUser(user);

  return { message: 'Password reset successfully' };
};

module.exports = {
  sendSignupOtp,
  verifySignupOtp,
  loginUser,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
};