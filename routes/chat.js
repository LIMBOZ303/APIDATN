const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Hiển thị giao diện chat cho người dùng
router.get('/', (req, res) => {
  res.render('user-chat', { title: 'Chat với hỗ trợ viên' });
});

// Hiển thị giao diện chat cho admin
router.get('/admin', (req, res) => {
  res.render('admin-chat', { title: 'Quản lý chat' });
});

// Lấy lịch sử chat giữa admin và một user cụ thể
router.get('/history/:userId', chatController.getChatHistory);

// Lấy danh sách tất cả các user đã chat với admin
router.get('/users', chatController.getAllChatUsers);

// Lưu tin nhắn mới
router.post('/message', chatController.saveMessage);

module.exports = router; 