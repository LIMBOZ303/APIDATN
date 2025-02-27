const express = require('express');
const mongoose = require('mongoose');
const Plan = require('../models/planModel'); // Đảm bảo đường dẫn tới model Plan đúng

const router = express.Router();

// Create (POST) - Tạo mới một Plan
router.post('/add', async (req, res) => {
    try {
        const { invitationId, lobbyId, cateringId, flowerId, UserId, totalPrice, planprice, plansoluongkhach, planlocation } = req.body;

        const newPlan = new Plan({
            invitationId,
            lobbyId,
            cateringId,
            flowerId,
            UserId,
            totalPrice,
            planprice,
            plansoluongkhach,
            planlocation
        });

        await newPlan.save();

        return res.status(201).json({
            status: true,
            message: "Tạo mới thành công",
            data: newPlan
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Tạo mới thất bại",
            data: error.message
        });
    }
});

// Read (GET) - Lấy tất cả Plan
router.get('/all', async (req, res) => {
    try {
        const plans = await Plan.find().populate('invitationId lobbyId cateringId flowerId UserId');

        return res.status(200).json({
            status: true,
            message: "Lấy danh sách thành công",
            data: plans
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Lấy danh sách thất bại",
            data: error.message
        });
    }
});

// Read (GET) - Lấy thông tin Plan theo ID
router.get('/:id', async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id).populate('invitationId lobbyId cateringId flowerId UserId');

        if (!plan) {
            return res.status(404).json({
                status: false,
                message: "Không tìm thấy Plan",
                data: null
            });
        }

        return res.status(200).json({
            status: true,
            message: "Lấy thông tin thành công",
            data: plan
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Lấy thông tin thất bại",
            data: error.message
        });
    }
});

// Update (PUT) - Cập nhật thông tin Plan theo ID
router.put('/:id', async (req, res) => {
    try {
        const { invitationId, lobbyId, cateringId, flowerId, UserId, totalPrice, planprice, plansoluongkhach, planlocation, status } = req.body;

        const updatedPlan = await Plan.findByIdAndUpdate(req.params.id, {
            invitationId,
            lobbyId,
            cateringId,
            flowerId,
            UserId,
            totalPrice,
            planprice,
            plansoluongkhach,
            planlocation,
            status
        }, { new: true });

        if (!updatedPlan) {
            return res.status(404).json({
                status: false,
                message: "Không tìm thấy Plan để cập nhật",
                data: null
            });
        }

        return res.status(200).json({
            status: true,
            message: "Cập nhật thành công",
            data: updatedPlan
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Cập nhật thất bại",
            data: error.message
        });
    }
});

// Delete (DELETE) - Xóa Plan theo ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedPlan = await Plan.findByIdAndDelete(req.params.id);

        if (!deletedPlan) {
            return res.status(404).json({
                status: false,
                message: "Không tìm thấy Plan để xóa",
                data: null
            });
        }

        return res.status(200).json({
            status: true,
            message: "Xóa thành công",
            data: deletedPlan
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
