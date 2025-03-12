const express = require('express');
const router = express.Router();
const Plan = require('../models/planModel');
const Lobby = require('../models/Sanh');
const User = require('../models/userModel');
const Plan_catering = require('../models/PlanWith/Plan-Catering')
const Plan_decorate = require('../models/PlanWith/Plan-Decorate')
const Plan_present = require('../models/PlanWith/Plan-Present')
const cate_catering = require('../models/Cate/cate_cateringModel')

router.post('/add', async (req, res) => {
    try {
        const { name, SanhId, planprice, plansoluongkhach, plandateevent, cateringId = [], decorateId = [], presentId = [] } = req.body;

        if (!name || !SanhId || !planprice || !plansoluongkhach || !plandateevent) {
            return res.status(400).json({ status: false, message: "Thiếu dữ liệu bắt buộc" });
        }


        // Tạo mới kế hoạch
        const newPlan = await Plan.create({
            name,
            SanhId,
            planprice,
            plansoluongkhach,
            plandateevent
        });

        const planId = newPlan._id;

        // Liên kết với các dịch vụ
        if (Array.isArray(cateringId) && cateringId.length > 0) {
            await Plan_catering.insertMany(cateringId.map(id => ({ PlanId: planId, CateringId: id })));
        }

        if (Array.isArray(decorateId) && decorateId.length > 0) {
            await Plan_decorate.insertMany(decorateId.map(id => ({ PlanId: planId, DecorateId: id })));
        }

        if (Array.isArray(presentId) && presentId.length > 0) {
            await Plan_present.insertMany(presentId.map(id => ({ PlanId: planId, PresentId: id })));
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
            const caterings = await Plan_catering.find({ PlanId: plan._id })
                .populate({
                    path: 'CateringId',
                    populate: {
                        path: 'cate_cateringId', // Populate lồng
                        select: 'name' // Chỉ lấy name
                    }
                });
            const decorates = await Plan_decorate.find({ PlanId: plan._id })
                .populate({
                    path: 'DecorateId',
                    populate: {
                        path: 'Cate_decorateId',
                        select: 'name'
                    }
                });
            const presents = await Plan_present.find({ PlanId: plan._id })
                .populate({
                    path: 'PresentId',
                    populate: {
                        path: 'Cate_presentId',
                        select: 'name'
                    }
                });

            // Nếu totalPrice chưa có hoặc bị lỗi, tự động cập nhật
            if (!plan.totalPrice) {
                await plan.calculateTotalPrice();
                await plan.save(); // Lưu lại totalPrice vào DB
            }

            return {
                ...plan.toObject(),
                totalPrice: plan.totalPrice, // Đảm bảo totalPrice hiển thị
                caterings: caterings.map(item => item.CateringId),
                decorates: decorates.map(item => item.DecorateId),
                presents: presents.map(item => item.PresentId),

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
        const { planId } = req.params;
        const { serviceType, serviceId } = req.query; // Dùng query thay vì params để linh hoạt hơn

        // Kiểm tra xem ID hợp lệ không
        if (!planId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ status: false, message: "PlanId không hợp lệ" });
        }

        // Nếu có serviceType và serviceId → Xóa dịch vụ trong kế hoạch
        if (serviceType && serviceId) {
            let model;
            let fieldName;

            if (serviceType === "catering") {
                model = Plan_catering;
                fieldName = "CateringId";
            } else if (serviceType === "decorate") {
                model = Plan_decorate;
                fieldName = "DecorateId";
            } else if (serviceType === "present") {
                model = Plan_present;
                fieldName = "PresentId";
            } else {
                return res.status(400).json({ status: false, message: "Loại dịch vụ không hợp lệ" });
            }

            const deletedService = await model.findOneAndDelete({ PlanId: planId, [fieldName]: serviceId });

            if (!deletedService) {
                return res.status(404).json({ status: false, message: "Dịch vụ không tồn tại trong kế hoạch" });
            }

            return res.status(200).json({ status: true, message: "Xóa dịch vụ thành công" });
        }

        // Nếu không có serviceType → Xóa toàn bộ kế hoạch và các dịch vụ liên quan
        const deletedPlan = await Plan.findByIdAndDelete(planId);
        if (!deletedPlan) {
            return res.status(404).json({ status: false, message: "Không tìm thấy kế hoạch" });
        }

        // Xóa các dịch vụ liên quan trong bảng trung gian
        await Plan_catering.deleteMany({ PlanId: planId });
        await Plan_decorate.deleteMany({ PlanId: planId });
        await Plan_present.deleteMany({ PlanId: planId });

        return res.status(200).json({ status: true, message: "Xóa kế hoạch và các dịch vụ liên quan thành công" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: "Lỗi khi xóa kế hoạch hoặc dịch vụ" });
    }
});


// Tìm kiếm Plan theo planprice
router.get('/price', async (req, res) => {
    try {
        const { minPrice, maxPrice } = req.query;

        // Khởi tạo bộ lọc tìm kiếm
        const filter = {};

        // Xử lý minPrice và maxPrice nếu có
        if (minPrice && !isNaN(minPrice)) filter.planprice = { $gte: parseFloat(minPrice) };
        if (maxPrice && !isNaN(maxPrice)) {
            filter.planprice = filter.planprice ? 
                { ...filter.planprice, $lte: parseFloat(maxPrice) } : 
                { $lte: parseFloat(maxPrice) };
        }

        // Tìm các Plan phù hợp với điều kiện lọc
        const plans = await Plan.find(filter);

        // Trả về dữ liệu JSON với thông báo rõ ràng
        res.status(200).json({ message: 'Lấy dữ liệu thành công', plans });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

//planPrice = totalPrice, soLuongKhach = sanhID.SoluongKhach
router.get('/khaosat', async (req, res) => {
    try {
        const { minPrice, maxPrice, soluongkhach, dateevent } = req.query;

        // Khởi tạo bộ lọc tìm kiếm
        const filter = {};

        // Lọc theo khoảng giá từ `Totalprice`
        if (minPrice && !isNaN(minPrice)) {
            filter.totalprice = { $gte: parseFloat(minPrice) };
        }
        if (maxPrice && !isNaN(maxPrice)) {
            filter.totalprice = filter.totalprice
                ? { ...filter.totalprice, $lte: parseFloat(maxPrice) }
                : { $lte: parseFloat(maxPrice) };
        }

        // Lọc theo ngày tổ chức (các plan có ngày tổ chức sau ngày khảo sát)
        if (dateevent) {
            const eventDate = new Date(dateevent);
            if (!isNaN(eventDate.getTime())) {
                filter.plandateevent = { $gte: eventDate };
            }
        }

        // Lấy danh sách Plan và populate thêm thông tin Sảnh
        const plans = await Plan.find(filter)
            .populate({
                path: 'SanhId',
                select: 'name price SoLuongKhach',
                match: { SoLuongKhach: { $lte: parseInt(soluongkhach) } } // Lọc số lượng khách từ SanhId
            })
            .populate('UserId', 'name email');

        // Lọc bỏ những kế hoạch không có `SanhId` phù hợp (do `match`)
        const filteredPlans = plans.filter(plan => plan.SanhId !== null);

        res.status(200).json({ status: true, message: 'Lấy danh sách kế hoạch thành công', data: filteredPlans });
    } catch (error) {
        res.status(500).json({ status: false, message: 'Lỗi server', error: error.message });
    }
});


module.exports = router;
