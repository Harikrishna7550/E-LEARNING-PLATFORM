const express = require('express');
const router = express.Router();
const { sendOTP, verifyOTP, login, logout, getMe, sendForgotPasswordOtp, verifyForgotPasswordOtp, resetPassword } = require('../controllers/authController');
const auth = require('../middlewares/auth');


router.post('/send-otp', sendOTP);

router.post('/verify-otp', verifyOTP);

router.post('/send-forgot-otp', sendForgotPasswordOtp);

router.post('/verify-forgot-otp', verifyForgotPasswordOtp);

router.post('/reset-password', resetPassword);

router.post('/login', login);

router.post('/logout', logout);

router.get('/me', auth, getMe);

module.exports = router;