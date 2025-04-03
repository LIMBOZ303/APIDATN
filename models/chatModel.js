const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    // User ID hoặc thông tin định danh người dùng
    senderId: { 
        type: String, 
        required: true 
    },
    // Định danh người nhận (user hoặc admin)
    receiverId: { 
        type: String, 
        required: true 
    },
    // Loại người gửi: 'user' hoặc 'admin'
    senderType: {
        type: String,
        enum: ['user', 'admin'],
        required: true
    },
    // Loại tin nhắn: 'text' hoặc 'image'
    messageType: {
        type: String,
        enum: ['text', 'image'],
        default: 'text',
        required: true
    },
    // Nội dung tin nhắn (văn bản hoặc ảnh dạng base64)
    message: { 
        type: String, 
        required: true 
    },
    // Đã đọc hay chưa
    read: { 
        type: Boolean, 
        default: false 
    },
    // Thời gian tạo tin nhắn
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Tạo index để tìm kiếm nhanh hơn
chatMessageSchema.index({ senderId: 1, receiverId: 1 });
chatMessageSchema.index({ createdAt: -1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
module.exports = ChatMessage; 