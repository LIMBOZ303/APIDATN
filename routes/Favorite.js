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

const { ObjectId } = require('mongoose').Types;

router.delete('/delete/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { type, itemId } = req.query;

        // Định nghĩa model và field tương ứng
        const models = {
            Catering: { model: require('../models/ListOrder/Catering_order'), field: 'Catering_orders' },
            Decorate: { model: require('../models/ListOrder/Decorate_order'), field: 'Decorate_orders' },
            Sanh: { model: require('../models/ListOrder/Lobby_order'), field: 'Lobby_orders' },
            Present: { model: require('../models/ListOrder/Present_order'), field: 'Present_orders' },
        };

        // Kiểm tra type hợp lệ
        if (!models[type]) {
            return res.status(400).json({ status: false, message: "Loại không hợp lệ" });
        }

        const { model: orderModel, field: orderField } = models[type];

        // Chuyển đổi itemId và userId thành ObjectId
        const orderIdCondition = new ObjectId(itemId);
        const userIdCondition = new ObjectId(userId);

        // Log để debug
        console.log(`Tìm xóa: type=${type}, ${type}Id=${itemId}, UserId=${userId}`);

        // Xóa bản ghi khỏi bảng trung gian (Present_order, ...)
        const order = await orderModel.findOneAndDelete({
            [`${type}Id`]: orderIdCondition, // PresentId
            UserId: userIdCondition,
        });

        if (!order) {
            console.log(`Không tìm thấy bản ghi trong ${type}_order với ${type}Id=${itemId} và UserId=${userId}`);
            return res.status(404).json({ status: false, message: "Không tìm thấy mục yêu thích" });
        }

        // Xóa tham chiếu trong User
        const updatedUser = await User.findByIdAndUpdate(
            userIdCondition,
            { $pull: { [orderField]: order._id } },
            { new: true }
        );

        if (!updatedUser) {
            console.warn(`Không tìm thấy User với ID=${userId}`);
        }

        res.status(200).json({
            status: true,
            message: "Đã xóa khỏi danh sách yêu thích",
            deletedId: order._id.toString(),
        });
    } catch (error) {
        console.error("Lỗi server khi xóa:", error.message);
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
