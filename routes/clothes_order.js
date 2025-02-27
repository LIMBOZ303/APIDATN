const express = require('express');
const mongoose = require('mongoose');
const ClothesOrder = require('../models/Clothes_order'); // Đảm bảo đường dẫn tới model clothes_order đúng

const router = express.Router();

// Create (POST) - Tạo mới một clothes_order
router.post('/add', async (req, res) => {
    try {
        const { ClothesId, FavoriteId } = req.body;

        const newClothesOrder = new ClothesOrder({
            ClothesId,
            FavoriteId
        });

        await newClothesOrder.save();

        return res.status(201).json({
            status: true,
            message: "Tạo mới thành công",
            data: newClothesOrder
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Tạo mới thất bại",
            data: error.message
        });
    }
});

// Read (GET) - Lấy tất cả clothes_order
router.get('/all', async (req, res) => {
    try {
        const clothesOrders = await ClothesOrder.find().populate('ClothesId FavoriteId');

        return res.status(200).json({
            status: true,
            message: "Lấy danh sách thành công",
            data: clothesOrders
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Lấy danh sách thất bại",
            data: error.message
        });
    }
});

// Read (GET) - Lấy thông tin clothes_order theo ID
router.get('/:id', async (req, res) => {
    try {
        const clothesOrder = await ClothesOrder.findById(req.params.id).populate('ClothesId FavoriteId');

        if (!clothesOrder) {
            return res.status(404).json({
                status: false,
                message: "Không tìm thấy clothes_order",
                data: null
            });
        }

        return res.status(200).json({
            status: true,
            message: "Lấy thông tin thành công",
            data: clothesOrder
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Lấy thông tin thất bại",
            data: error.message
        });
    }
});

// Update (PUT) - Cập nhật thông tin clothes_order theo ID
router.put('/:id', async (req, res) => {
    try {
        const { ClothesId, FavoriteId } = req.body;

        const updatedClothesOrder = await ClothesOrder.findByIdAndUpdate(req.params.id, {
            ClothesId,
            FavoriteId
        }, { new: true });

        if (!updatedClothesOrder) {
            return res.status(404).json({
                status: false,
                message: "Không tìm thấy clothes_order để cập nhật",
                data: null
            });
        }

        return res.status(200).json({
            status: true,
            message: "Cập nhật thành công",
            data: updatedClothesOrder
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Cập nhật thất bại",
            data: error.message
        });
    }
});

// Delete (DELETE) - Xóa một clothes_order theo ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedClothesOrder = await ClothesOrder.findByIdAndDelete(req.params.id);

        if (!deletedClothesOrder) {
            return res.status(404).json({
                status: false,
                message: "Không tìm thấy clothes_order để xóa",
                data: null
            });
        }

        return res.status(200).json({
            status: true,
            message: "Xóa thành công",
            data: deletedClothesOrder
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
