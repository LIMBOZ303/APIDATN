const express = require('express');
const mongoose = require('mongoose');
const WeddingFlowerOrder = require('../models/WeddingFlower_order'); // Đảm bảo đường dẫn tới model WeddingFlower_order đúng

const router = express.Router();

// Create (POST) - Tạo mới một WeddingFlower_order
router.post('/add', async (req, res) => {
    try {
        const { WeddingFlowerId, FavoriteId } = req.body;

        const newWeddingFlowerOrder = new WeddingFlowerOrder({
            WeddingFlowerId,
            FavoriteId
        });

        await newWeddingFlowerOrder.save();

        return res.status(201).json({
            status: true,
            message: "Tạo mới thành công",
            data: newWeddingFlowerOrder
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Tạo mới thất bại",
            data: error.message
        });
    }
});

// Read (GET) - Lấy tất cả WeddingFlower_order
router.get('/all', async (req, res) => {
    try {
        const weddingFlowerOrders = await WeddingFlowerOrder.find().populate('WeddingFlowerId FavoriteId');

        return res.status(200).json({
            status: true,
            message: "Lấy danh sách thành công",
            data: weddingFlowerOrders
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Lấy danh sách thất bại",
            data: error.message
        });
    }
});

// Read (GET) - Lấy thông tin WeddingFlower_order theo ID
router.get('/:id', async (req, res) => {
    try {
        const weddingFlowerOrder = await WeddingFlowerOrder.findById(req.params.id).populate('WeddingFlowerId FavoriteId');

        if (!weddingFlowerOrder) {
            return res.status(404).json({
                status: false,
                message: "Không tìm thấy WeddingFlower_order",
                data: null
            });
        }

        return res.status(200).json({
            status: true,
            message: "Lấy thông tin thành công",
            data: weddingFlowerOrder
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Lấy thông tin thất bại",
            data: error.message
        });
    }
});

// Update (PUT) - Cập nhật thông tin WeddingFlower_order theo ID
router.put('/:id', async (req, res) => {
    try {
        const { WeddingFlowerId, FavoriteId } = req.body;

        const updatedWeddingFlowerOrder = await WeddingFlowerOrder.findByIdAndUpdate(req.params.id, {
            WeddingFlowerId,
            FavoriteId
        }, { new: true });

        if (!updatedWeddingFlowerOrder) {
            return res.status(404).json({
                status: false,
                message: "Không tìm thấy WeddingFlower_order để cập nhật",
                data: null
            });
        }

        return res.status(200).json({
            status: true,
            message: "Cập nhật thành công",
            data: updatedWeddingFlowerOrder
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Cập nhật thất bại",
            data: error.message
        });
    }
});

// Delete (DELETE) - Xóa WeddingFlower_order theo ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedWeddingFlowerOrder = await WeddingFlowerOrder.findByIdAndDelete(req.params.id);

        if (!deletedWeddingFlowerOrder) {
            return res.status(404).json({
                status: false,
                message: "Không tìm thấy WeddingFlower_order để xóa",
                data: null
            });
        }

        return res.status(200).json({
            status: true,
            message: "Xóa thành công",
            data: deletedWeddingFlowerOrder
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
