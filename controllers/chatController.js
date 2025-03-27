const ChatMessage = require('../models/chatModel');

// Lấy lịch sử chat giữa admin và một user cụ thể
exports.getChatHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Tìm tất cả tin nhắn giữa admin và user
        const messages = await ChatMessage.find({
            $or: [
                { senderId: userId, receiverId: 'admin' },
                { senderId: 'admin', receiverId: userId }
            ]
        }).sort({ createdAt: 1 });
        
        // Đánh dấu tất cả tin nhắn từ user đã được đọc
        await ChatMessage.updateMany(
            { senderId: userId, receiverId: 'admin', read: false },
            { read: true }
        );
        
        res.status(200).json({
            success: true,
            data: messages
        });
    } catch (error) {
        console.error('Error getting chat history:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy lịch sử chat'
        });
    }
};

// Lấy danh sách tất cả các user đã chat với admin
exports.getAllChatUsers = async (req, res) => {
    try {
        // Tìm tất cả người dùng đã gửi tin nhắn cho admin
        const userMessages = await ChatMessage.find({
            $or: [
                { senderId: { $ne: 'admin' }, receiverId: 'admin' },
                { senderId: 'admin', receiverId: { $ne: 'admin' } }
            ]
        }).sort({ createdAt: -1 });
        
        // Lấy danh sách userId duy nhất và tin nhắn mới nhất
        const usersMap = new Map();
        
        userMessages.forEach(message => {
            const userId = message.senderId === 'admin' ? message.receiverId : message.senderId;
            
            if (!usersMap.has(userId)) {
                usersMap.set(userId, {
                    userId: userId,
                    lastMessage: message.message,
                    lastMessageTime: message.createdAt,
                    unreadCount: 0
                });
            }
        });
        
        // Đếm số tin nhắn chưa đọc
        const unreadCounts = await ChatMessage.aggregate([
            {
                $match: {
                    senderId: { $ne: 'admin' },
                    receiverId: 'admin',
                    read: false
                }
            },
            {
                $group: {
                    _id: '$senderId',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        // Cập nhật số lượng tin nhắn chưa đọc
        unreadCounts.forEach(item => {
            if (usersMap.has(item._id)) {
                usersMap.get(item._id).unreadCount = item.count;
            }
        });
        
        // Chuyển Map thành mảng và sắp xếp theo thời gian tin nhắn mới nhất
        const users = Array.from(usersMap.values()).sort((a, b) => 
            new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
        );
        
        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Error getting chat users:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy danh sách người dùng chat'
        });
    }
};

// Lưu tin nhắn mới
exports.saveMessage = async (req, res) => {
    try {
        const { senderId, receiverId, message, senderType } = req.body;
        
        if (!senderId || !receiverId || !message || !senderType) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin cần thiết'
            });
        }
        
        // Tạo tin nhắn mới
        const newMessage = await ChatMessage.create({
            senderId,
            receiverId,
            message,
            senderType,
            read: false
        });
        
        res.status(201).json({
            success: true,
            data: newMessage
        });
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lưu tin nhắn'
        });
    }
}; 