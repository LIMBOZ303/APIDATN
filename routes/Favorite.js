const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { ObjectId } = require('mongoose').Types;

// 📌 API thêm yêu thích
router.post('/add/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { type, itemId } = req.body;

        const models = {
            Catering: { model: require('../models/ListOrder/Catering_order'), field: 'Catering_orders', idField: 'CateringId' },
            Decorate: { model: require('../models/ListOrder/Decorate_order'), field: 'Decorate_orders', idField: 'DecorateId' },
            Sanh: { model: require('../models/ListOrder/Lobby_order'), field: 'Lobby_orders', idField: 'SanhId' },
            Present: { model: require('../models/ListOrder/Present_order'), field: 'Present_orders', idField: 'PresentId' },
        };

        if (!models[type]) {
            return res.status(400).json({ status: false, message: 'Loại không hợp lệ' });
        }

        const { model: orderModel, field: orderField } = models[type];

        // Tạo bản ghi trong bảng trung gian
        const newOrder = await orderModel.create({ [models[type].idField]: itemId, UserId: userId });

        // Cập nhật User
        await User.findByIdAndUpdate(userId, { $push: { [orderField]: newOrder._id } });

        res.status(200).json({ status: true, message: 'Đã thêm vào danh sách yêu thích' });
    } catch (error) {
        res.status(500).json({ status: false, message: 'Lỗi server', error: error.message });
    }
});

// 📌 API xóa yêu thích
router.delete('/delete/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { type, itemId } = req.query;

        const models = {
            Catering: { model: require('../models/ListOrder/Catering_order'), field: 'Catering_orders', idField: 'CateringId' },
            Decorate: { model: require('../models/ListOrder/Decorate_order'), field: 'Decorate_orders', idField: 'DecorateId' },
            Sanh: { model: require('../models/ListOrder/Lobby_order'), field: 'Lobby_orders', idField: 'SanhId' },
            Present: { model: require('../models/ListOrder/Present_order'), field: 'Present_orders', idField: 'PresentId' },
        };

        if (!models[type]) {
            return res.status(400).json({ status: false, message: 'Loại không hợp lệ' });
        }

        const { model: orderModel, field: orderField, idField } = models[type];

        const userIdCondition = new ObjectId(userId);

        // Xóa bản ghi dựa trên PresentId (hoặc tương ứng) và UserId
        const order = await orderModel.findOneAndDelete({
            [idField]: new ObjectId(itemId),
            UserId: userIdCondition,
        });

        if (!order) {
            console.log(`Không tìm thấy bản ghi với ${idField}=${itemId} và UserId=${userId}`);
        }

        // Cập nhật User
        await User.findByIdAndUpdate(userIdCondition, { $pull: { [orderField]: order?._id } });

        // Lấy danh sách yêu thích mới
        const user = await User.findById(userIdCondition).populate(orderField);
        if (!user) {
            return res.status(404).json({ status: false, message: 'Không tìm thấy người dùng' });
        }

        const favorites = user[orderField] || [];
        const formattedFavorites = favorites.map((order) => ({
            type,
            itemId: order[idField]?.toString(),
            _id: order._id.toString(),
            image: order[idField]?.image || 'https://via.placeholder.com/80',
            name: order[idField]?.name || 'Không có tên',
            price: order[idField]?.price || 0,
        }));

        res.status(200).json({
            status: true,
            message: order ? 'Đã xóa khỏi danh sách yêu thích' : 'Mục không tồn tại, trả về danh sách mới',
            data: formattedFavorites,
        });
    } catch (error) {
        console.error('Lỗi server khi xóa:', error.message);
        res.status(500).json({ status: false, message: 'Lỗi server', error: error.message });
    }
});

// 📌 API lấy danh sách yêu thích
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId)
            .populate({
                path: 'Catering_orders',
                populate: { path: 'CateringId' },
            })
            .populate({
                path: 'Decorate_orders',
                populate: { path: 'DecorateId' },
            })
            .populate({
                path: 'Lobby_orders',
                populate: { path: 'SanhId' },
            })
            .populate({
                path: 'Present_orders',
                populate: { path: 'PresentId' },
            });

        if (!user) {
            return res.status(404).json({ status: false, message: 'User không tồn tại' });
        }

        res.status(200).json({
            status: true,
            message: 'Lấy danh sách đơn hàng yêu thích thành công',
            data: {
                Catering: user.Catering_orders,
                Decorate: user.Decorate_orders,
                Lobby: user.Lobby_orders,
                Present: user.Present_orders,
            },
        });
    } catch (error) {
        res.status(500).json({ status: false, message: 'Lỗi server', error: error.message });
    }
});

module.exports = router;