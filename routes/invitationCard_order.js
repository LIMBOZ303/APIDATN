const express = require('express');
const mongoose = require('mongoose');
const InvitationCardOrder = require('../models/Invitation_card_order'); // Đảm bảo đường dẫn tới model InvitationCard_order đúng

const router = express.Router();

// Create (POST) - Tạo mới một InvitationCard_order
router.post('/add', async (req, res) => {
    try {
        const { InvitationId, FavoriteId } = req.body;

        const newInvitationCardOrder = new InvitationCardOrder({
            InvitationId,
            FavoriteId
        });

        await newInvitationCardOrder.save();

        return res.status(201).json({
            status: true,
            message: "Tạo mới thành công",
            data: newInvitationCardOrder
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Tạo mới thất bại",
            data: error.message
        });
    }
});

// Read (GET) - Lấy tất cả InvitationCard_order
router.get('/all', async (req, res) => {
    try {
        const invitationCardOrders = await InvitationCardOrder.find().populate('InvitationId FavoriteId');

        return res.status(200).json({
            status: true,
            message: "Lấy danh sách thành công",
            data: invitationCardOrders
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Lấy danh sách thất bại",
            data: error.message
        });
    }
});

// Read (GET) - Lấy thông tin InvitationCard_order theo ID
router.get('/:id', async (req, res) => {
    try {
        const invitationCardOrder = await InvitationCardOrder.findById(req.params.id).populate('InvitationId FavoriteId');

        if (!invitationCardOrder) {
            return res.status(404).json({
                status: false,
                message: "Không tìm thấy InvitationCard_order",
                data: null
            });
        }

        return res.status(200).json({
            status: true,
            message: "Lấy thông tin thành công",
            data: invitationCardOrder
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Lấy thông tin thất bại",
            data: error.message
        });
    }
});

// Update (PUT) - Cập nhật thông tin InvitationCard_order theo ID
router.put('/:id', async (req, res) => {
    try {
        const { InvitationId, FavoriteId } = req.body;

        const updatedInvitationCardOrder = await InvitationCardOrder.findByIdAndUpdate(req.params.id, {
            InvitationId,
            FavoriteId
        }, { new: true });

        if (!updatedInvitationCardOrder) {
            return res.status(404).json({
                status: false,
                message: "Không tìm thấy InvitationCard_order để cập nhật",
                data: null
            });
        }

        return res.status(200).json({
            status: true,
            message: "Cập nhật thành công",
            data: updatedInvitationCardOrder
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Cập nhật thất bại",
            data: error.message
        });
    }
});

// Delete (DELETE) - Xóa InvitationCard_order theo ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedInvitationCardOrder = await InvitationCardOrder.findByIdAndDelete(req.params.id);

        if (!deletedInvitationCardOrder) {
            return res.status(404).json({
                status: false,
                message: "Không tìm thấy InvitationCard_order để xóa",
                data: null
            });
        }

        return res.status(200).json({
            status: true,
            message: "Xóa thành công",
            data: deletedInvitationCardOrder
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
