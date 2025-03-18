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



// -------------------------
// 1. Đăng ký tài khoản & Gửi OTP
// -------------------------
// Endpoint: POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address, role, avatar } = req.body;

    // Kiểm tra nếu email đã được đăng ký
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã được đăng ký" });
    }

    // Tạo user với isVerified = false
    const newUser = new User({
      name,
      email,
      password,
      phone,
      address,
      role,
      avatar,
      isVerified: false,
    });
    await newUser.save();

    // Tạo OTP gồm 4 chữ số
    const otp = generateOTP();

    // Lưu OTP vào DB (hết hạn sau 5 phút)
    await OTP.create({
      email,
      otp: otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    // Gửi OTP qua email để kích hoạt tài khoản
    await sendEmail(email, "Mã OTP kích hoạt tài khoản", `Mã OTP kích hoạt tài khoản của bạn là: ${otp}`);

    res.status(201).json({ message: "Đăng ký thành công! Mã OTP đã được gửi đến email của bạn" });
  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// -------------------------
// 2. Xác thực OTP để kích hoạt tài khoản
// -------------------------
// Endpoint: POST /auth/verify-registration-otp
router.post('/verify-registration-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Tìm OTP theo email và OTP
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: "OTP không hợp lệ" });
    }
    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP đã hết hạn" });
    }

    // Tìm user theo email và cập nhật trạng thái isVerified
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }
    user.isVerified = true;
    await user.save();

    // Xóa OTP khỏi DB
    await OTP.deleteOne({ email });

    res.json({ message: "Tài khoản đã được kích hoạt thành công" });
  } catch (error) {
    console.error("Error in verify-registration-otp:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});


module.exports = router;
