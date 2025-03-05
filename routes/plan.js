const express = require('express');
const router = express.Router();
const Plan = require('../models/planModel');
const Lobby = require('../models/Sanh');
const User = require('../models/userModel');
const Plan_catering = require('../models/PlanWith/Plan-Catering')
const Plan_decorate = require('../models/PlanWith/Plan-Decorate')
const Plan_present = require('../models/PlanWith/Plan-Present')

router.post('/add', async (req, res) => {
    try {
        const { name, SanhId, planprice, plansoluongkhach, plandateevent, cateringId = [], decorateId = [], presentId = [] } = req.body;

        if (!name || !SanhId || !planprice || !plansoluongkhach || !plandateevent) {
            return res.status(400).json({ status: false, message: "Thiếu dữ liệu bắt buộc" });
        }

        let totalPrice = 0;

        // Lấy giá sảnh
        const sanh = await Lobby.findById(SanhId);
        if (!sanh) {
            return res.status(404).json({ status: false, message: "Không tìm thấy sảnh" });
        }
        totalPrice += sanh.price;

        // Lấy giá của các dịch vụ ăn uống
        let caterings = [];
        if (Array.isArray(cateringId) && cateringId.length > 0) {
            caterings = await Plan_catering.find({ _id: { $in: cateringId } });
            totalPrice += caterings.reduce((sum, catering) => sum + catering.price, 0);
        }

        // Lấy giá của các dịch vụ trang trí
        let decorates = [];
        if (Array.isArray(decorateId) && decorateId.length > 0) {
            decorates = await Plan_decorate.find({ _id: { $in: decorateId } });
            totalPrice += decorates.reduce((sum, decorate) => sum + decorate.price, 0);
        }

        // Lấy giá của các dịch vụ biểu diễn
        let presents = [];
        if (Array.isArray(presentId) && presentId.length > 0) {
            presents = await Plan_present.find({ _id: { $in: presentId } });
            totalPrice += presents.reduce((sum, present) => sum + present.price, 0);
        }

        // Tạo mới kế hoạch
        const newPlan = await Plan.create({
            name,
            SanhId,
            totalPrice,
            planprice,
            plansoluongkhach,
            plandateevent
        });

        const planId = newPlan._id;

        // Liên kết với các dịch vụ
        if (caterings.length > 0) {
            await Plan_catering.insertMany(caterings.map(catering => ({ PlanId: planId, CateringId: catering._id })));
        }

        if (decorates.length > 0) {
            await Plan_decorate.insertMany(decorates.map(decorate => ({ PlanId: planId, DecorateId: decorate._id })));
        }

        if (presents.length > 0) {
            await Plan_present.insertMany(presents.map(present => ({ PlanId: planId, PresentId: present._id })));
        }

        return res.status(201).json({ status: true, message: "Thêm kế hoạch và dịch vụ thành công", data: newPlan });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: "Lỗi khi thêm kế hoạch" });
    }
});



// Lấy tất cả kế hoạch
router.get('/all', async (req, res) => {
    try {
        const plans = await Plan.find()
            .populate('SanhId') // Populate thông tin sảnh
            .populate('UserId', 'name email'); // Populate thông tin người dùng

        // Lấy dịch vụ từ bảng trung gian
        const populatedPlans = await Promise.all(plans.map(async (plan) => {
            const caterings = await Plan_catering.find({ PlanId: plan._id }).populate('CateringId');
            const decorates = await Plan_decorate.find({ PlanId: plan._id }).populate('DecorateId');
            const presents = await Plan_present.find({ PlanId: plan._id }).populate('PresentId');

            return {
                ...plan.toObject(),
                caterings: caterings.map(item => item.CateringId),
                decorates: decorates.map(item => item.DecorateId),
                presents: presents.map(item => item.PresentId)
            };
        }));

        res.status(200).json({ status: true, message: "Lấy danh sách kế hoạch thành công", data: populatedPlans });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Thất bại khi lấy danh sách kế hoạch" });
    }
});

// Lấy kế hoạch theo ID
router.get('/:id', async (req, res) => {
    try {
        const planId = req.params.id;

        // Kiểm tra xem ID có hợp lệ không (tránh lỗi truy vấn)
        if (!planId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ status: false, message: "ID không hợp lệ" });
        }

        const plan = await Plan.findById(planId)
            .populate('SanhId') 
            .populate('UserId', 'name email'); // Chỉ lấy name & email

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
                caterings: caterings.length > 0 ? caterings.map(item => item.CateringId) : [],
                decorates: decorates.length > 0 ? decorates.map(item => item.DecorateId) : [],
                presents: presents.length > 0 ? presents.map(item => item.PresentId) : []
            }
        });
    } catch (error) {
        console.error(error); 
        res.status(500).json({ status: false, message: "Lỗi khi lấy dữ liệu" });
    }
});


//update
router.put('/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Kiểm tra xem id có hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ status: false, message: "ID không hợp lệ" });
        }

        // Kiểm tra xem kế hoạch có tồn tại không
        const existingPlan = await Plan.findById(id);
        if (!existingPlan) {
            return res.status(404).json({ status: false, message: "Kế hoạch không tồn tại" });
        }

        // Cập nhật kế hoạch (dùng findByIdAndUpdate để tối ưu hiệu suất)
        const updatedPlan = await Plan.findByIdAndUpdate(id, updates, { new: true });

        // Cập nhật dịch vụ nếu có
        if (updates.cateringId) {
            await Plan_catering.findOneAndUpdate(
                { PlanId: id },
                { CateringId: updates.cateringId },
                { upsert: true, new: true }
            );
        }

        if (updates.decorateId) {
            await Plan_decorate.findOneAndUpdate(
                { PlanId: id },
                { DecorateId: updates.decorateId },
                { upsert: true, new: true }
            );
        }

        if (updates.presentId) {
            await Plan_present.findOneAndUpdate(
                { PlanId: id },
                { PresentId: updates.presentId },
                { upsert: true, new: true }
            );
        }

        res.status(200).json({ status: true, message: "Cập nhật kế hoạch thành công", data: updatedPlan });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: "Lỗi khi cập nhật kế hoạch" });
    }
});


// Lấy danh sách kế hoạch theo UserId
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Kiểm tra xem userId có hợp lệ không
        if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ status: false, message: "UserId không hợp lệ" });
        }

        // Tìm tất cả kế hoạch của user
        const plans = await Plan.find({ UserId: userId })
            .populate('SanhId', 'name price SoLuongKhach')  // Chỉ lấy một số trường cần thiết
            .populate('UserId', 'name email');  // Chỉ lấy name & email

        if (!plans.length) {
            return res.status(404).json({ status: false, message: "Không tìm thấy kế hoạch nào cho người dùng này" });
        }

        // Lấy danh sách dịch vụ từ các bảng trung gian
        const planIds = plans.map(plan => plan._id);

        const caterings = await Plan_catering.find({ PlanId: { $in: planIds } }).populate('CateringId');
        const decorates = await Plan_decorate.find({ PlanId: { $in: planIds } }).populate('DecorateId');
        const presents = await Plan_present.find({ PlanId: { $in: planIds } }).populate('PresentId');

        // Kết hợp dịch vụ vào từng kế hoạch
        const enrichedPlans = plans.map(plan => {
            return {
                ...plan.toObject(),
                caterings: caterings.filter(item => item.PlanId.toString() === plan._id.toString()).map(item => item.CateringId),
                decorates: decorates.filter(item => item.PlanId.toString() === plan._id.toString()).map(item => item.DecorateId),
                presents: presents.filter(item => item.PlanId.toString() === plan._id.toString()).map(item => item.PresentId)
            };
        });

        res.status(200).json({ status: true, message: "Lấy danh sách kế hoạch thành công", data: enrichedPlans });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: "Lỗi khi lấy danh sách kế hoạch" });
    }
});



// Xóa kế hoạch theo ID
router.delete('/:planId', async (req, res) => {
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
