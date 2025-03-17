const express = require('express');
const router = express.Router();
const crypto = require('crypto');


const User = require('../models/userModel'); 
const OTP = require('../models/otpModel');
const { sendEmail } = require('../utils/email');
    
// Hàm tạo OTP gồm 4 chữ số
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// -------------------------
// 1. API gửi OTP (Forgot Password)
// -------------------------
// Endpoint: POST /api/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email không tồn tại" });
    }
    
    
    const otp = generateOTP();
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
    
  
    await OTP.create({
      email,
      otp: hashedOTP,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });
    
    await sendEmail(email, "Mã OTP đặt lại mật khẩu", `Mã OTP của bạn là: ${otp}`);
    
    res.json({ message: "OTP đã được gửi đến email của bạn" });
  } catch (error) {
    console.error("Error in forgot-password:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
});

// -------------------------
// 2. API xác thực OTP
// -------------------------
// Endpoint: POST /api/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
    
    const otpRecord = await OTP.findOne({ email, otp: hashedOTP });
    if (!otpRecord) {
      return res.status(400).json({ message: "OTP không hợp lệ" });
    }
    
    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP đã hết hạn" });
    }
    
    await OTP.deleteOne({ email });
    
    res.json({ message: "OTP hợp lệ, bạn có thể đặt lại mật khẩu" });
  } catch (error) {
    console.error("Error in verify-otp:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
});

// -------------------------
// 3. API đặt lại mật khẩu
// -------------------------
// Endpoint: POST /api/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email không tồn tại" });
    }
    
    user.password = newPassword;
    
    await user.save();
    
    res.json({ message: "Mật khẩu đã được đặt lại thành công" });
  } catch (error) {
    console.error("Error in reset-password:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
});

module.exports = router;
