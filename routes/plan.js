const express = require('express');
const router = express.Router();
const Plan = require('../models/planModel');
const Lobby = require('../models/lobbyModel');
const User = require('../models/userModel');
const Plan_catering = require('../models/PlanWith/Plan-Catering')
const Plan_decorate = require('../models/PlanWith/Plan-Decorate')
const Plan_present = require('../models/PlanWith/Plan-Present')

router.post('/add', async (req, res) => {
    try {
        const { lobbyId, UserId, planprice, plansoluongkhach, plandateevent, planId, cateringId, decorateId, presentId } = req.body;

        if (cateringId) {
            await Plan_catering.create({ PlanId: planId, CateringId: cateringId });
        }

        if (decorateId) {
            await Plan_decorate.create({ PlanId: planId, DecorateId: decorateId });
        }

        if (presentId) {
            await Plan_present.create({ PlanId: planId, PresentId: presentId });
        }

        return res.status(201).json({ status: true, message: "Thêm dịch vụ vào kế hoạch thành công" });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Lỗi khi thêm dịch vụ" });
    }
});


// Lấy tất cả kế hoạch
router.get('/all', async (req, res) => {
    try {
        const plans = await Plan.find()
            .populate('lobbyId', 'name price SoLuongKhach')  // Populate thông tin phòng
            .populate('UserId', 'name email');  // Populate thông tin người dùng
        res.status(200).json({ status: true, message: "Lấy danh sách kế hoạch thành công", data: plans });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Thất bại khi lấy danh sách kế hoạch" });
    }
});

// Lấy kế hoạch theo ID
router.get('/:id', async (req, res) => {
    try {

        const planId = req.params.id;

        const plan = await Plan.findById(planId)
            .populate('lobbyId')
            .populate('UserId', 'name email');

        if (!plan) {
            return res.status(404).json({ status: false, message: "Không tìm thấy kế hoạch" });
        }

        const caterings = await Plan_catering.find({ PlanId: planId }).populate('CateringId');
        const decorates = await Plan_decorate.find({ PlanId: planId }).populate('DecorateId');
        const presents = await Plan_present.find({ PlanId: planId }).populate('PresentId');

        res.status(200).json({
            status: true,
            message: "Lấy kế hoạch và dịch vụ thành công",
            data: {
                plan,
                caterings: caterings.map(item => item.CateringId),
                decorates: decorates.map(item => item.DecorateId),
                presents: presents.map(item => item.PresentId)
            }
        });
    } catch (error) {
        res.status(500).json({ status: false, message: "Lỗi khi lấy dữ liệu" });
    }
});

// Cập nhật kế hoạch theo ID
router.put('/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Kiểm tra xem kế hoạch có tồn tại không
        const existingPlan = await Plan.findById(id);
        if (!existingPlan) {
            return res.status(404).json({ status: false, message: "Kế hoạch không tồn tại" });
        }

        // Chỉ cập nhật các trường có trong request body
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                existingPlan[key] = updates[key];
            }
        });

        await existingPlan.save();

        res.status(200).json({ status: true, message: "Cập nhật kế hoạch thành công", data: existingPlan });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Lỗi khi cập nhật kế hoạch" });
    }
});

// Xóa kế hoạch theo ID
router.delete('/:planId/', async (req, res) => {
    try {
        const { planId, serviceType, serviceId } = req.params;

        let model;
        if (serviceType === "catering") model = Plan_catering;
        else if (serviceType === "decorate") model = Plan_decorate;
        else if (serviceType === "present") model = Plan_present;
        else return res.status(400).json({ status: false, message: "Loại dịch vụ không hợp lệ" });

        const deletedService = await model.findOneAndDelete({ PlanId: planId, [`${serviceType}Id`]: serviceId });

        if (!deletedService) {
            return res.status(404).json({ status: false, message: "Dịch vụ không tồn tại trong kế hoạch" });
        }

        res.status(200).json({ status: true, message: "Xóa dịch vụ thành công" });
    } catch (error) {
        res.status(500).json({ status: false, message: "Lỗi khi xóa dịch vụ" });
    }
});


module.exports = router;
