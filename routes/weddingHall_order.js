const express = require('express');
const mongoose = require('mongoose');
const WeddingHallOrder = require('../models/WeddingHall_order'); // Đảm bảo đường dẫn tới model WeddingHall_order đúng

const router = express.Router();

// Create (POST) - Tạo mới một WeddingHall_order
router.post('/add', async (req, res) => {
    try {
        const { WeddingHallId, FavoriteId } = req.body;

        const newWeddingHallOrder = new WeddingHallOrder({
            WeddingHallId,
            FavoriteId
        });

        await newWeddingHallOrder.save();

        return res.status(201).json({
            status: true,
            message: "Tạo mới thành công",
            data: newWeddingHallOrder
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Tạo mới thất bại",
            data: error.message
        });
    }
});

// Read (GET) - Lấy tất cả WeddingHall_order
router.get('/all', async (req, res) => {
    try {
        const weddingHallOrders = await WeddingHallOrder.find().populate('WeddingHallId FavoriteId');

        return res.status(200).json({
            status: true,
            message: "Lấy danh sách thành công",
            data: weddingHallOrders
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Lấy danh sách thất bại",
            data: error.message
        });
    }
});

// Read (GET) - Lấy thông tin WeddingHall_order theo ID
router.get('/:id', async (req, res) => {
    try {
        const weddingHallOrder = await WeddingHallOrder.findById(req.params.id).populate('WeddingHallId FavoriteId');

        if (!weddingHallOrder) {
            return res.status(404).json({
                status: false,
                message: "Không tìm thấy WeddingHall_order",
                data: null
            });
        }

        return res.status(200).json({
            status: true,
            message: "Lấy thông tin thành công",
            data: weddingHallOrder
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Lấy thông tin thất bại",
            data: error.message
        });
    }
});

// Update (PUT) - Cập nhật thông tin WeddingHall_order theo ID
router.put('/:id', async (req, res) => {
    try {
        const { WeddingHallId, FavoriteId } = req.body;

        const updatedWeddingHallOrder = await WeddingHallOrder.findByIdAndUpdate(req.params.id, {
            WeddingHallId,
            FavoriteId
        }, { new: true });

        if (!updatedWeddingHallOrder) {
            return res.status(404).json({
                status: false,
                message: "Không tìm thấy WeddingHall_order để cập nhật",
                data: null
            });
        }

        return res.status(200).json({
            status: true,
            message: "Cập nhật thành công",
            data: updatedWeddingHallOrder
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Cập nhật thất bại",
            data: error.message
        });
    }
});

// Delete (DELETE) - Xóa WeddingHall_order theo ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedWeddingHallOrder = await WeddingHallOrder.findByIdAndDelete(req.params.id);

        if (!deletedWeddingHallOrder) {
            return res.status(404).json({
                status: false,
                message: "Không tìm thấy WeddingHall_order để xóa",
                data: null
            });
        }

        return res.status(200).json({
            status: true,
            message: "Xóa thành công",
            data: deletedWeddingHallOrder
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Xóa thất bại",
            data: error.message
        });
    }
});

module.exports = router;
