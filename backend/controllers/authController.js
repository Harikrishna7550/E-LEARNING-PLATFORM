const authService = require('../services/authService');
const User = require('../models/User');


exports.sendOTP = async (req, res) => {
  try {
    const result = await authService.sendSignupOtp(req.body);
    res.json(result);
  } catch (error) {
    console.error('sendOTP error:', error);
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};


exports.sendForgotPasswordOtp = async (req, res) => {
  try {
    const result = await authService.sendForgotPasswordOtp(req.body);
    res.json(result);
  } catch (error) {
    console.error('sendForgotPasswordOtp error:', error);
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};


exports.verifyForgotPasswordOtp = async (req, res) => {
  try {
    const result = await authService.verifyForgotPasswordOtp(req.body);
    res.json(result);
  } catch (error) {
    console.error('verifyForgotPasswordOtp error:', error);
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};


exports.resetPassword = async (req, res) => {
  try {
    const result = await authService.resetPassword(req.body);
    res.json(result);
  } catch (error) {
    console.error('resetPassword error:', error);
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};


exports.logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.verifyOTP = async (req, res) => {
  try {
    const result = await authService.verifySignupOtp(req.body);
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json(result);
  } catch (error) {
    console.error('verifyOTP error:', error);
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};


exports.login = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json(result);
  } catch (error) {
    console.error('login error:', error);
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};


exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;