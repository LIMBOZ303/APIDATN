const express = require('express');
const mongoose = require('mongoose');
const CateringOrder = require('../models/Catering_order'); // Đảm bảo đường dẫn tới model Catering_order đúng

const router = express.Router();

// Create (POST) - Tạo mới một Catering_order
router.post('/add', async (req, res) => {
    try {
        const { CateringId, FavoriteId } = req.body;

        const newCateringOrder = new CateringOrder({
            CateringId,
            FavoriteId
        });

        await newCateringOrder.save();

        return res.status(201).json({
            status: true,
            message: "Tạo mới thành công",
            data: newCateringOrder
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Tạo mới thất bại",
            data: error.message
        });
    }
});

// Read (GET) - Lấy tất cả Catering_order
router.get('/all', async (req, res) => {
    try {
        const cateringOrders = await CateringOrder.find().populate('CateringId FavoriteId');

        return res.status(200).json({
            status: true,
            message: "Lấy danh sách thành công",
            data: cateringOrders
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Lấy danh sách thất bại",
            data: error.message
        });
    }
});

// Read (GET) - Lấy thông tin Catering_order theo ID
router.get('/:id', async (req, res) => {
    try {
        const cateringOrder = await CateringOrder.findById(req.params.id).populate('CateringId FavoriteId');

        if (!cateringOrder) {
            return res.status(404).json({
                status: false,
                message: "Không tìm thấy Catering_order",
                data: null
            });
        }

        return res.status(200).json({
            status: true,
            message: "Lấy thông tin thành công",
            data: cateringOrder
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Lấy thông tin thất bại",
            data: error.message
        });
    }
});

// Update (PUT) - Cập nhật thông tin Catering_order theo ID
router.put('/:id', async (req, res) => {
    try {
        const { CateringId, FavoriteId } = req.body;

        const updatedCateringOrder = await CateringOrder.findByIdAndUpdate(req.params.id, {
            CateringId,
            FavoriteId
        }, { new: true });

        if (!updatedCateringOrder) {
            return res.status(404).json({
                status: false,
                message: "Không tìm thấy Catering_order để cập nhật",
                data: null
            });
        }

        return res.status(200).json({
            status: true,
            message: "Cập nhật thành công",
            data: updatedCateringOrder
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Cập nhật thất bại",
            data: error.message
        });
    }
});

// Delete (DELETE) - Xóa Catering_order theo ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedCateringOrder = await CateringOrder.findByIdAndDelete(req.params.id);

        if (!deletedCateringOrder) {
            return res.status(404).json({
                status: false,
                message: "Không tìm thấy Catering_order để xóa",
                data: null
            });
        }

        return res.status(200).json({
            status: true,
            message: "Xóa thành công",
            data: deletedCateringOrder
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
