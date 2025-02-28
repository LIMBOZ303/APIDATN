const express = require('express');
const mongoose = require('mongoose');
const Plan = require('../models/planModel'); // Đảm bảo đường dẫn tới model Plan đúng

const router = express.Router();
const Invitation = require('../models/invitationModel');
const Catering = require('../models/cateringModel');
const Flower = require('../models/flowerModel');
const Lobby = require('../models/lobbyModel');
const User = require('../models/userModel');
const Clothes = require('../models/clothesModel');
const Plan_Clothes = require('../models/plan-clothesModel');



// API tìm Plan theo userId
router.get('/plans/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'UserId không hợp lệ!' });
        }

        const plans = await Plan.find({ UserId: userId });
        if (plans.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy kế hoạch nào cho người dùng này!' });
        }

        res.status(200).json({ plans });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ!', error: error.message });
    }
});


// API tạo Plan dựa trên tổng tiền, số lượng khách và ngày tổ chức
router.post('/create-plan', async (req, res) => {
    try {
        const { budget, guestCount, eventDate, userId, planLocation } = req.body;
        if (!budget || !guestCount || !eventDate || !userId || !planLocation) {
            return res.status(400).json({ message: 'Thiếu thông tin bắt buộc!' });
        }

        // Tìm các mục với giá cả phù hợp
        const invitation = await Invitation.findOne().sort({ price: 1 });
        const lobby = await Lobby.findOne({ SoLuongKhach: { $gte: guestCount } }).sort({ price: 1 });
        const catering = await Catering.findOne().sort({ price: 1 });
        const flower = await Flower.findOne().sort({ price: 1 });
        
        if (!invitation || !lobby || !catering || !flower) {
            return res.status(404).json({ message: 'Không tìm thấy các mục phù hợp!' });
        }

        // Tính tổng giá tiền ban đầu (chưa có quần áo)
        let totalPrice = invitation.price + lobby.price + catering.price + flower.price;
        if (totalPrice > budget) {
            return res.status(400).json({ message: 'Ngân sách không đủ để tạo Plan!' });
        }

        // Lấy danh sách quần áo có giá phù hợp với phần ngân sách còn lại
        const remainingBudget = budget - totalPrice;
        const clothesList = await Clothes.find({ price: { $lte: remainingBudget } }).sort({ price: 1 });

        if (!clothesList.length) {
            return res.status(404).json({ message: 'Không tìm thấy quần áo phù hợp!' });
        }

        // Tính tổng chi phí sau khi thêm quần áo
        let selectedClothes = [];
        let clothesCost = 0;
        for (let item of clothesList) {
            if (clothesCost + item.price <= remainingBudget) {
                selectedClothes.push(item);
                clothesCost += item.price;
            } else {
                break;
            }
        }
        totalPrice += clothesCost;

        // Lấy danh sách ID quần áo đã chọn
        let selectedClothesIds = selectedClothes.map(item => item._id);

        // Tạo kế hoạch mới với danh sách quần áo
        const newPlan = new Plan({
            invitationId: invitation._id,
            lobbyId: lobby._id,
            cateringId: catering._id,
            flowerId: flower._id,
            UserId: userId,
            totalPrice,
            planprice: totalPrice,
            plansoluongkhach: guestCount,
            plandateevent: eventDate,
            planlocation: planLocation,
            status: 'active',
            clothesIds: selectedClothesIds // Lưu danh sách quần áo vào plan
        });
        await newPlan.save();

        // Gán danh sách quần áo vào bảng Plan_Clothes
        for (let cloth of selectedClothes) {
            const newPlanClothes = new Plan_Clothes({
                PlanId: newPlan._id,
                ClothesId: cloth._id
            });
            await newPlanClothes.save();
        }

        res.status(201).json({ 
            message: 'Tạo Plan thành công!', 
            plan: newPlan, 
            clothesIds: selectedClothesIds 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ!', error: error.message });
    }
});


// Create (POST) - Tạo mới một Plan
router.post('/add', async (req, res) => {
    try {
        const {
            invitationId, 
            lobbyId, 
            cateringId, 
            flowerId, 
            UserId, 
            totalPrice, 
            planprice, 
            plansoluongkhach, 
            plandateevent, 
            planlocation
        } = req.body;

        const newPlan = new Plan({
            invitationId, 
            lobbyId, 
            cateringId, 
            flowerId, 
            UserId, 
            totalPrice, 
            planprice, 
            plansoluongkhach, 
            plandateevent, 
            planlocation
        });

        await newPlan.save();

        return res.status(201).json({
            status: true,
            message: "Tạo mới kế hoạch thành công",
            data: newPlan
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Tạo mới kế hoạch thất bại",
            data: error.message
        });
    }
});

// Read (GET) - Lấy tất cả các Plan
router.get('/all', async (req, res) => {
    try {
        const plans = await Plan.find().populate('invitationId lobbyId cateringId flowerId UserId');

        return res.status(200).json({
            status: true,
            message: "Lấy danh sách kế hoạch thành công",
            data: plans
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Lấy danh sách kế hoạch thất bại",
            data: error.message
        });
    }
});

// Read (GET) - Lấy thông tin Plan theo ID

router.get('/:id', async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id)
            .populate('invitationId', 'name price imageUrl')
            .populate('lobbyId', 'name price SoLuongKhach imageUrl')
            .populate('cateringId', 'name price imageUrl')
            .populate('flowerId', 'name price imageUrl description')
            .populate('UserId', 'name phone address');

        if (!plan) {
            return res.status(404).json({
                status: false,
                message: 'Không tìm thấy kế hoạch',
                data: null
            });
        }

        // Lấy danh sách quần áo từ bảng Plan_Clothes
        const planClothes = await Plan_Clothes.find({ PlanId: plan._id }).populate('ClothesId', 'name price imageUrl description');
        
        // Gán danh sách quần áo vào plan
        const clothesList = planClothes.map(pc => pc.ClothesId);
        
        return res.status(200).json({
            status: true,
            message: 'Lấy thông tin kế hoạch thành công',
            data: { ...plan.toObject(), clothes: clothesList }
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: 'Lấy thông tin kế hoạch thất bại',
            data: error.message
        });
    }
});



// Update (PUT) - Cập nhật thông tin Plan theo ID
router.put('/:id', async (req, res) => {
    try {
        const {
            invitationId, 
            lobbyId, 
            cateringId, 
            flowerId, 
            UserId, 
            totalPrice, 
            planprice, 
            plansoluongkhach, 
            plandateevent, 
            planlocation
        } = req.body;

        const updatedPlan = await Plan.findByIdAndUpdate(req.params.id, {
            invitationId, 
            lobbyId, 
            cateringId, 
            flowerId, 
            UserId, 
            totalPrice, 
            planprice, 
            plansoluongkhach, 
            plandateevent, 
            planlocation
        }, { new: true });

        if (!updatedPlan) {
            return res.status(404).json({
                status: false,
                message: "Không tìm thấy kế hoạch để cập nhật",
                data: null
            });
        }

        return res.status(200).json({
            status: true,
            message: "Cập nhật kế hoạch thành công",
            data: updatedPlan
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Cập nhật kế hoạch thất bại",
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
                message: "Không tìm thấy kế hoạch để xóa",
                data: null
            });
        }

        return res.status(200).json({
            status: true,
            message: "Xóa kế hoạch thành công",
            data: deletedPlan
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Xóa kế hoạch thất bại",
            data: error.message
        });
    }
});

module.exports = router;
