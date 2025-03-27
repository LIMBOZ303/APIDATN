const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Lấy lịch sử chat giữa admin và một user cụ thể
router.get('/history/:userId', chatController.getChatHistory);

// Lấy danh sách tất cả các user đã chat với admin
router.get('/users', chatController.getAllChatUsers);

// Lưu tin nhắn mới
router.post('/message', chatController.saveMessage);

module.exports = router; 