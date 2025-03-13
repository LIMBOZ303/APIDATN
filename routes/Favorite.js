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

        const models = {
            Catering: { model: require('../models/ListOrder/Catering_order'), field: 'Catering_orders' },
            Decorate: { model: require('../models/ListOrder/Decorate_order'), field: 'Decorate_orders' },
            Sanh: { model: require('../models/ListOrder/Lobby_order'), field: 'Lobby_orders' },
            Present: { model: require('../models/ListOrder/Present_order'), field: 'Present_orders' },
        };

        if (!models[type]) {
            return res.status(400).json({ status: false, message: "Loại không hợp lệ" });
        }

        const { model: orderModel, field: orderField } = models[type];

        const orderIdCondition = new ObjectId(itemId); // itemId là _id của present_order
        const userIdCondition = new ObjectId(userId);

        console.log(`Tìm xóa: type=${type}, _id=${itemId}, UserId=${userId}`);

        // Xóa bản ghi dựa trên _id và UserId
        const order = await orderModel.findOneAndDelete({
            _id: orderIdCondition,
            UserId: userIdCondition,
        });

        if (!order) {
            console.log(`Không tìm thấy bản ghi với _id=${itemId} và UserId=${userId}`);
            // Làm mới danh sách ngay cả khi không tìm thấy
        }

        // Cập nhật User
        await User.findByIdAndUpdate(userIdCondition, { $pull: { [orderField]: order?._id } });

        // Lấy danh sách yêu thích mới
        const user = await User.findById(userIdCondition).populate(orderField);
        if (!user) {
            return res.status(404).json({ status: false, message: "Không tìm thấy người dùng" });
        }

        const favorites = user[orderField] || [];
        const formattedFavorites = favorites.map(order => ({
            type: type,
            itemId: order._id.toString(),
            _id: order._id.toString(),
            image: order[`${type}Id`]?.image || 'https://via.placeholder.com/80',
            name: order[`${type}Id`]?.name || 'Không có tên',
            price: order[`${type}Id`]?.price || 0,
        }));

        res.status(200).json({
            status: true,
            message: order ? "Đã xóa khỏi danh sách yêu thích" : "Mục không tồn tại, trả về danh sách mới",
            data: formattedFavorites,
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
