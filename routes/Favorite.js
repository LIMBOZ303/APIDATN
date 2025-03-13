const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const catering_order = require('../models/ListOrder/Catering_order');
const decorate_order = require('../models/ListOrder/Decorate_order');
const lobby_order = require('../models/ListOrder/Lobby_order');
const present_order = require('../models/ListOrder/Present_order');

// 📌 API yêu thích / bỏ yêu thích đơn hàng
router.post('/add/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { type, itemId } = req.body; // type: Catering, Decorate, Lobby, Present

        let orderModel, orderField;
        switch (type) {
            case 'Catering':
                orderModel = require('../models/ListOrder/Catering_order');
                orderField = 'Catering_orders';
                break;
            case 'Decorate':
                orderModel = require('../models/ListOrder/Decorate_order');
                orderField = 'Decorate_orders';
                break;
            case 'Sanh':
                orderModel = require('../models/ListOrder/Lobby_order');
                orderField = 'Lobby_orders';
                break;
            case 'Present':
                orderModel = require('../models/ListOrder/Present_order');
                orderField = 'Present_orders';
                break;
            default:
                return res.status(400).json({ status: false, message: "Loại không hợp lệ" });
        }

        // Tạo bản ghi trong bảng trung gian
        const newOrder = await orderModel.create({ [`${type}Id`]: itemId, UserId: userId });

        // Cập nhật User để lưu danh sách yêu thích
        await User.findByIdAndUpdate(userId, { $push: { [orderField]: newOrder._id } });

        res.status(200).json({ status: true, message: "Đã thêm vào danh sách yêu thích" });
    } catch (error) {
        res.status(500).json({ status: false, message: "Lỗi server", error: error.message });
    }
});

router.delete('/delete/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { type, itemId } = req.body;

        let orderModel, orderField;
        switch (type) {
            case 'Catering':
                orderModel = require('../models/ListOrder/Catering_order');
                orderField = 'Catering_orders';
                break;
            case 'Decorate':
                orderModel = require('../models/ListOrder/Decorate_order');
                orderField = 'Decorate_orders';
                break;
            case 'Sanh':
                orderModel = require('../models/ListOrder/Lobby_order');
                orderField = 'Lobby_orders';
                break;
            case 'Present':
                orderModel = require('../models/ListOrder/Present_order');
                orderField = 'Present_orders';
                break;
            default:
                return res.status(400).json({ status: false, message: "Loại không hợp lệ" });
        }

        // Xóa bản ghi khỏi bảng trung gian
        const order = await orderModel.findOneAndDelete({ [`${type}Id`]: itemId, UserId: userId });

        if (!order) {
            return res.status(404).json({ status: false, message: "Không tìm thấy mục yêu thích" });
        }

        // Xóa khỏi danh sách trong User
        await User.findByIdAndUpdate(userId, { $pull: { [orderField]: order._id } });

        res.status(200).json({ status: true, message: "Đã xóa khỏi danh sách yêu thích" });
    } catch (error) {
        res.status(500).json({ status: false, message: "Lỗi server", error: error.message });
    }
});


//lấy danh sách theo UserId
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId)
            .populate({
                path: 'Catering_orders',
                populate: { path: 'CateringId' } // Populate chi tiết đơn hàng
            })
            .populate({
                path: 'Decorate_orders',
                populate: { path: 'DecorateId' }
            })
            .populate({
                path: 'Lobby_orders',
                populate: { path: 'SanhId' }
            })
            .populate({
                path: 'Present_orders',
                populate: { path: 'PresentId' }
            });

        if (!user) {
            return res.status(404).json({ status: false, message: "User không tồn tại" });
        }

        res.status(200).json({
            status: true,
            message: "Lấy danh sách đơn hàng yêu thích thành công",
            data: {
                Catering: user.Catering_orders,
                Decorate: user.Decorate_orders,
                Lobby: user.Lobby_orders,
                Present: user.Present_orders
            }
        });
    } catch (error) {
        res.status(500).json({ status: false, message: "Lỗi server", error: error.message });
    }
});



module.exports = router;
