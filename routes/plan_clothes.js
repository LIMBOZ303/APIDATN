const express = require('express');
const mongoose = require('mongoose');
const PlanClothes = require('../models/plan-clothesModel'); // Đảm bảo đường dẫn tới model Plan_Clothes đúng

const router = express.Router();

// Create (POST) - Thêm mới một Plan_Clothes
router.post('/add', async (req, res) => {
    try {
        const { PlanId, ClothesId } = req.body;

        const newPlanClothes = new PlanClothes({
            PlanId,
            ClothesId
        });

        await newPlanClothes.save();

        return res.status(201).json({
            status: true,
            message: "Tạo mới thành công",
            data: newPlanClothes
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Tạo mới thất bại",
            data: error.message
        });
    }
});

// Read (GET) - Lấy tất cả Plan_Clothes
router.get('/all', async (req, res) => {
    try {
        const planClothes = await PlanClothes.find().populate('PlanId ClothesId');

        return res.status(200).json({
            status: true,
            message: "Lấy danh sách thành công",
            data: planClothes
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Lấy danh sách thất bại",
            data: error.message
        });
    }
});

// Read (GET) - Lấy thông tin Plan_Clothes theo ID
router.get('/:id', async (req, res) => {
    try {
        const planClothes = await PlanClothes.findById(req.params.id).populate('PlanId ClothesId');

        if (!planClothes) {
            return res.status(404).json({
                status: false,
                message: "Không tìm thấy Plan_Clothes",
                data: null
            });
        }

        return res.status(200).json({
            status: true,
            message: "Lấy thông tin thành công",
            data: planClothes
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Lấy thông tin thất bại",
            data: error.message
        });
    }
});

// Update (PUT) - Cập nhật thông tin Plan_Clothes theo ID
router.put('/:id', async (req, res) => {
    try {
        const { PlanId, ClothesId } = req.body;

        const updatedPlanClothes = await PlanClothes.findByIdAndUpdate(req.params.id, {
            PlanId,
            ClothesId
        }, { new: true });

        if (!updatedPlanClothes) {
            return res.status(404).json({
                status: false,
                message: "Không tìm thấy Plan_Clothes để cập nhật",
                data: null
            });
        }

        return res.status(200).json({
            status: true,
            message: "Cập nhật thành công",
            data: updatedPlanClothes
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Cập nhật thất bại",
            data: error.message
        });
    }
});

// Delete (DELETE) - Xóa một Plan_Clothes theo ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedPlanClothes = await PlanClothes.findByIdAndDelete(req.params.id);

        if (!deletedPlanClothes) {
            return res.status(404).json({
                status: false,
                message: "Không tìm thấy Plan_Clothes để xóa",
                data: null
            });
        }

        return res.status(200).json({
            status: true,
            message: "Xóa thành công",
            data: deletedPlanClothes
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
