const express = require('express');
const router = express.Router();
const moment = require('moment');
const Plan = require('../models/planModel');
const Plan_catering = require('../models/PlanWith/Plan-Catering')
const Plan_decorate = require('../models/PlanWith/Plan-Decorate')
const Plan_present = require('../models/PlanWith/Plan-Present')

const catering_order = require('../models/ListOrder/Catering_order'); // Viết thường
const decorate_order = require('../models/ListOrder/Decorate_order'); // Viết thường
const present_order = require('../models/ListOrder/Present_order');   // Viết thường
const Lobby_order = require('../models/ListOrder/Lobby_order');   // Viết thường

const Transaction = require('../models/transactionModel');



// Trong file routes/plan.js
router.put('/override/:planId', async (req, res) => {
    try {
        const { planId } = req.params;
        const { newPlanId } = req.body;
        const userId = req.headers['user-id'];

        if (!planId || !newPlanId) {
            return res.status(400).json({ success: false, message: 'Thiếu planId hoặc newPlanId' });
        }

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Thiếu user-id trong header' });
        }

        const originalPlan = await Plan.findById(planId);
        const newPlan = await Plan.findById(newPlanId);

        if (!originalPlan || !newPlan) {
            return res.status(404).json({
                success: false,
                message: `Kế hoạch không tồn tại: ${!originalPlan ? 'planId' : 'newPlanId'}`
            });
        }

        if (originalPlan.UserId && originalPlan.UserId.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Không có quyền chỉnh sửa kế hoạch này' });
        }

        // Kiểm tra trạng thái kế hoạch
        if (['Đang chờ', 'Đã đặt cọc'].includes(originalPlan.status)) {
            return res.status(403).json({
                success: false,
                message: `Kế hoạch đang ở trạng thái '${originalPlan.status}', không thể ghi đè các mục.`
            });
        }

        // Xóa dịch vụ cũ
        await Promise.all([
            Plan_catering.deleteMany({ PlanId: planId }),
            Plan_decorate.deleteMany({ PlanId: planId }),
            Plan_present.deleteMany({ PlanId: planId }),
        ]);

        // Sao chép dịch vụ từ newPlan
        const [caterings, decorates, presents] = await Promise.all([
            Plan_catering.find({ PlanId: newPlanId }),
            Plan_decorate.find({ PlanId: newPlanId }),
            Plan_present.find({ PlanId: newPlanId }),
        ]);

        await Promise.all([
            Plan_catering.insertMany(
                caterings.map(item => ({ PlanId: planId, CateringId: item.CateringId }))
            ),
            Plan_decorate.insertMany(
                decorates.map(item => ({ PlanId: planId, DecorateId: item.DecorateId }))
            ),
            Plan_present.insertMany(
                presents.map(item => ({
                    PlanId: planId,
                    PresentId: item.PresentId,
                    quantity: item.quantity || 1,
                }))
            ),
        ]);

        // Ghi đè dữ liệu kế hoạch
        originalPlan.set({
            ...newPlan.toObject(),
            _id: originalPlan._id,
            originalPlanId: undefined,
            isTemporary: undefined,
            status: 'Chưa đặt cọc',
            plansoluongkhach: newPlan.plansoluongkhach || originalPlan.plansoluongkhach || 0,
            updatedAt: new Date(),
        });

        // Tính lại totalPrice
        await originalPlan.calculateTotalPrice();
        await originalPlan.save();

        // Populate dữ liệu trả về
        const populatedPlan = await Plan.findById(planId)
            .populate('SanhId', 'name price imageUrl')
            .populate('UserId', 'name email')
            .populate({
                path: 'caterings',
                populate: { path: 'CateringId', select: 'name price imageUrl' },
            })
            .populate({
                path: 'decorates',
                populate: { path: 'DecorateId', select: 'name price imageUrl' },
            })
            .populate({
                path: 'presents',
                populate: { path: 'PresentId', select: 'name price imageUrl' },
            });

        res.json({
            success: true,
            message: 'Kế hoạch đã được ghi đè',
            data: populatedPlan,
        });
    } catch (error) {
        console.error('Lỗi ghi đè kế hoạch:', {
            planId: req.params.planId,
            newPlanId: req.body.newPlanId,
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
    }
});



router.delete('/cancel/:tempPlanId', async (req, res) => {
    try {
        const { tempPlanId } = req.params;

        // Tìm và xóa kế hoạch giả
        const tempPlan = await Plan.findById(tempPlanId);
        if (!tempPlan || !tempPlan.isTemporary) {
            return res.status(404).json({ success: false, message: 'Kế hoạch tạm thời không tồn tại' });
        }

        await Plan.deleteOne({ _id: tempPlanId });
        res.json({ success: true, message: 'Kế hoạch tạm thời đã bị hủy' });
    } catch (error) {
        console.error('Lỗi hủy kế hoạch:', {
            tempPlanId,
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});


router.post('/confirm/:tempPlanId', async (req, res) => {
    try {
        const { tempPlanId } = req.params;

        const tempPlan = await Plan.findById(tempPlanId);
        if (!tempPlan || !tempPlan.isTemporary) {
            return res.status(404).json({ success: false, message: 'Kế hoạch tạm thời không tồn tại' });
        }

        const originalPlan = await Plan.findById(tempPlan.originalPlanId);
        if (!originalPlan) {
            return res.status(404).json({ success: false, message: 'Kế hoạch gốc không tồn tại' });
        }

        // Ghi đè kế hoạch gốc
        originalPlan.set({
            ...tempPlan.toObject(),
            _id: originalPlan._id,
            isTemporary: undefined,
            originalPlanId: undefined,
            status: 'Chưa đặt cọc',
            updatedAt: new Date(),
        });

        // Lưu kế hoạch (middleware pre('save') sẽ tính totalPrice)
        await originalPlan.save();

        // Xóa kế hoạch tạm thời
        await Plan.deleteOne({ _id: tempPlanId });

        // Populate dữ liệu trả về
        const populatedPlan = await Plan.findById(originalPlan._id)
            .populate('SanhId', 'name price imageUrl')
            .populate('UserId', 'name email')
            .populate({
                path: 'caterings',
                populate: { path: 'CateringId', select: 'name price imageUrl' },
            })
            .populate({
                path: 'decorates',
                populate: { path: 'DecorateId', select: 'name price imageUrl' },
            })
            .populate({
                path: 'presents',
                populate: { path: 'PresentId', select: 'name price imageUrl' },
            });

        res.json({
            success: true,
            message: 'Kế hoạch đã được xác nhận và ghi đè',
            data: populatedPlan,
        });
    } catch (error) {
        console.error('Lỗi xác nhận kế hoạch:', {
            tempPlanId,
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Trong file routes/plan.js
router.post('/clone/:planId', async (req, res) => {
    try {
        const { planId } = req.params;
        const { guestCount: soLuongKhachYeuCau } = req.body;

        if (!planId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'PlanId không hợp lệ' });
        }

        const originalPlan = await Plan.findById(planId)
            .populate('SanhId', 'name price imageUrl SoLuongKhach');
        if (!originalPlan) {
            return res.status(404).json({ success: false, message: 'Kế hoạch không tồn tại' });
        }

        const guestCount = soLuongKhachYeuCau || originalPlan.plansoluongkhach || 0;
        if (guestCount <= 0) {
            return res.status(400).json({ success: false, message: 'Số lượng khách không hợp lệ' });
        }

        if (originalPlan.SanhId && originalPlan.SanhId.SoLuongKhach < guestCount) {
            return res.status(400).json({
                success: false,
                message: `Sảnh ${originalPlan.SanhId.name} chỉ chứa tối đa ${originalPlan.SanhId.SoLuongKhach} khách, không đủ cho ${guestCount} khách`
            });
        }

        const soLuongBan = Math.ceil(guestCount / 10);

        const [caterings, decorates, presents] = await Promise.all([
            Plan_catering.find({ PlanId: planId }),
            Plan_decorate.find({ PlanId: planId }),
            Plan_present.find({ PlanId: planId })
        ]);

        const newPlan = new Plan({
            ...originalPlan.toObject(),
            _id: undefined,
            status: 'Đang chờ xác nhận',
            isTemporary: true,
            originalPlanId: planId,
            createdAt: new Date(),
            updatedAt: new Date(),
            plansoluongkhach: guestCount
        });

        await newPlan.save();

        const newCaterings = caterings.map(catering => ({
            PlanId: newPlan._id,
            CateringId: catering.CateringId,
            quantity: soLuongBan
        }));

        const newDecorates = decorates.map(decorate => ({
            PlanId: newPlan._id,
            DecorateId: decorate.DecorateId
        }));

        const newPresents = presents.map(present => ({
            PlanId: newPlan._id,
            PresentId: present.PresentId,
            quantity: present.quantity || guestCount
        }));

        await Promise.all([
            newCaterings.length ? Plan_catering.insertMany(newCaterings) : Promise.resolve(),
            newDecorates.length ? Plan_decorate.insertMany(newDecorates) : Promise.resolve(),
            newPresents.length ? Plan_present.insertMany(newPresents) : Promise.resolve()
        ]);

        // Tính lại totalPrice
        await newPlan.calculateTotalPrice();
        await newPlan.save();

        const populatedNewPlan = await Plan.findById(newPlan._id)
            .populate('SanhId', 'name price imageUrl SoLuongKhach')
            .populate('UserId', 'name email')
            .populate({
                path: 'caterings',
                populate: { path: 'CateringId', select: 'name price imageUrl' }
            })
            .populate({
                path: 'decorates',
                populate: { path: 'DecorateId', select: 'name price imageUrl' }
            })
            .populate({
                path: 'presents',
                populate: { path: 'PresentId', select: 'name price imageUrl' }
            });

        const responseData = {
            ...populatedNewPlan.toObject(),
            plansoluongkhach: guestCount,
            caterings: populatedNewPlan.caterings.map(item => ({
                ...item.CateringId.toObject(),
                quantity: item.quantity || soLuongBan
            })),
            decorates: populatedNewPlan.decorates.map(item => item.DecorateId),
            presents: populatedNewPlan.presents.map(item => ({
                ...item.PresentId.toObject(),
                quantity: item.quantity || guestCount
            }))
        };

        res.json({
            success: true,
            message: 'Kế hoạch đã được sao chép thành công',
            data: {
                newPlanId: newPlan._id,
                planData: responseData
            }
        });
    } catch (error) {
        console.error('Lỗi clone kế hoạch:', {
            PlanId,
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
    }
});


// Endpoint: Chuyển trạng thái từ "Đang chờ xác nhận" sang "Chưa đặt cọc"
router.put('/confirm-to-pending/:planId', async (req, res) => {
    try {
        const { planId } = req.params;

        // Kiểm tra planId hợp lệ
        if (!planId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ status: false, message: "PlanId không hợp lệ" });
        }

        // Tìm kế hoạch
        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({ status: false, message: "Không tìm thấy kế hoạch" });
        }

        // Kiểm tra trạng thái hiện tại
        if (plan.status !== 'Đang chờ xác nhận') {
            return res.status(400).json({ 
                status: false, 
                message: "Kế hoạch không ở trạng thái 'Đang chờ xác nhận'" 
            });
        }

        // Cập nhật trạng thái kế hoạch
        plan.status = 'Chưa đặt cọc';
        await plan.save();

        // Cập nhật trạng thái giao dịch liên quan
        const transactions = await Transaction.find({ planId });
        if (transactions.length > 0) {
            await Transaction.updateMany(
                { planId, status: 'Đang chờ xác nhận' },
                { $set: { status: 'Chưa đặt cọc' } }
            );
        }

        // Populate lại dữ liệu để trả về
        const populatedPlan = await Plan.findById(planId)
            .populate('SanhId', 'name price imageUrl')
            .populate('UserId', 'name email');
        const populatedData = await populatePlans([populatedPlan]);

        return res.status(200).json({
            status: true,
            message: "Chuyển trạng thái sang 'Chưa đặt cọc' thành công",
            data: populatedData[0]
        });
    } catch (error) {
        console.error("Lỗi khi chuyển trạng thái:", error);
        return res.status(500).json({
            status: false,
            message: "Lỗi khi chuyển trạng thái",
            error: error.message
        });
    }
});

// API endpoint: Hủy kế hoạch
router.put('/cancel/:planId', async (req, res) => {
    try {
        const { planId } = req.params;

        if (!planId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ status: false, message: "PlanId không hợp lệ" });
        }

        // Tìm kế hoạch
        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({ status: false, message: "Không tìm thấy kế hoạch" });
        }

        // Kiểm tra trạng thái hiện tại của kế hoạch
        if (plan.status === 'Đã hủy') {
            return res.status(400).json({ status: false, message: "Kế hoạch đã được hủy trước đó" });
        }

        // Cập nhật trạng thái kế hoạch thành "Đã hủy"
        plan.status = 'Đã hủy';
        await plan.save();

        // Tìm và cập nhật trạng thái giao dịch liên quan
        const transactions = await Transaction.find({ planId });
        if (transactions.length > 0) {
            await Transaction.updateMany(
                { planId },
                { $set: { status: 'Đã hủy' } }
            );
        }

        // Populate lại dữ liệu để trả về
        const populatedPlan = await Plan.findById(planId)
            .populate('SanhId', 'name price imageUrl')
            .populate('UserId', 'name email');
        const populatedData = await populatePlans([populatedPlan]);

        return res.status(200).json({
            status: true,
            message: "Hủy kế hoạch và cập nhật giao dịch thành công",
            data: populatedData[0]
        });
    } catch (error) {
        console.error("Lỗi khi hủy kế hoạch:", error);
        return res.status(500).json({
            status: false,
            message: "Lỗi khi hủy kế hoạch",
            error: error.message
        });
    }
});

// Hàm chung để populate và tính toán plans
const populatePlans = async (plans) => {
    return await Promise.all(plans.map(async (plan) => {
        const caterings = await Plan_catering.find({ PlanId: plan._id })
            .populate({
                path: 'CateringId',
                select: 'name price imageUrl',
                populate: {
                    path: 'cate_cateringId',
                    select: 'name'
                }
            });
        const decorates = await Plan_decorate.find({ PlanId: plan._id })
            .populate({
                path: 'DecorateId',
                select: 'name price imageUrl',
                populate: {
                    path: 'Cate_decorateId',
                    select: 'name'
                }
            });
        const presents = await Plan_present.find({ PlanId: plan._id })
            .populate({
                path: 'PresentId',
                select: 'name price imageUrl',
                populate: {
                    path: 'Cate_presentId',
                    select: 'name'
                }
            });

        // Nếu totalPrice chưa có hoặc bị lỗi, tự động cập nhật
        if (!plan.totalPrice) {
            await plan.calculateTotalPrice();
            await plan.save();
        }

        return {
            ...plan.toObject(),
            totalPrice: plan.totalPrice,
            caterings: caterings.map(item => item.CateringId),
            decorates: decorates.map(item => item.DecorateId),
            presents: presents.map(item => ({
                ...item.PresentId.toObject(), // Lấy toàn bộ thông tin của PresentId
                quantity: item.quantity // Thêm quantity từ Plan_present
            })),
        };
    }));
};


// 2. Lấy plans không có UserId
router.get('/no-user', async (req, res) => {
    try {
        const plans = await Plan.find({ UserId: { $exists: false } })
            .populate('SanhId', 'name price imageUrl');

        const populatedPlans = await populatePlans(plans);
        res.status(200).json({ status: true, message: "Lấy danh sách kế hoạch không có user thành công", data: populatedPlans });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Thất bại khi lấy danh sách kế hoạch không có user" });
    }
});;

// 3. Lấy plans có UserId
router.get('/with-user', async (req, res) => {
    try {
        const plans = await Plan.find({ UserId: { $exists: true } })
            .populate('SanhId', 'name price imageUrl') // Lấy name, price, imageUrl của Sanh
            .populate('UserId', 'name email');

        const populatedPlans = await populatePlans(plans);
        res.status(200).json({ status: true, message: "Lấy danh sách kế hoạch có user thành công", data: populatedPlans });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Thất bại khi lấy danh sách kế hoạch có user" });
    }
});


router.post('/add', async (req, res) => {
    try {
        const {
            name,
            SanhId,
            planprice = null,
            plansoluongkhach = null,
            plandateevent = null,
            cateringId = [],
            decorateId = [],
            presentId = []
        } = req.body;

        if (!name || !SanhId) {
            return res.status(400).json({ status: false, message: "Thiếu dữ liệu bắt buộc (name, SanhId)" });
        }

        // Tạo kế hoạch mới
        const newPlan = new Plan({
            name,
            SanhId,
            planprice,
            plansoluongkhach,
            plandateevent,
        });

        // Thêm dịch vụ
        await Promise.all([
            cateringId.length > 0 ? Plan_catering.insertMany(cateringId.map(id => ({ PlanId: newPlan._id, CateringId: id }))) : null,
            decorateId.length > 0 ? Plan_decorate.insertMany(decorateId.map(id => ({ PlanId: newPlan._id, DecorateId: id }))) : null,
            presentId.length > 0 ? Plan_present.insertMany(presentId.map(id => ({ PlanId: newPlan._id, PresentId: id, quantity: 1 }))) : null
        ]);

        // Lưu kế hoạch (middleware pre('save') sẽ tính totalPrice)
        await newPlan.save();

        // Populate dữ liệu trả về
        const populatedPlan = await Plan.findById(newPlan._id)
            .populate('SanhId', 'name price imageUrl')
            .populate({
                path: 'caterings',
                populate: { path: 'CateringId', select: 'name price imageUrl' },
            })
            .populate({
                path: 'decorates',
                populate: { path: 'DecorateId', select: 'name price imageUrl' },
            })
            .populate({
                path: 'presents',
                populate: { path: 'PresentId', select: 'name price imageUrl' },
            });

        return res.status(201).json({
            status: true,
            message: "Thêm kế hoạch thành công",
            data: populatedPlan,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: "Lỗi khi thêm kế hoạch" });
    }
});




// Lấy tất cả kế hoạch
router.get('/all', async (req, res) => {
    try {
        const plans = await Plan.find()
            .populate('SanhId', 'name price imageUrl')
            .populate('UserId', 'name email');

        const populatedPlans = await Promise.all(plans.map(async (plan) => {
            // Tính lại totalPrice
            await plan.calculateTotalPrice();
            await plan.save();

            const caterings = await Plan_catering.find({ PlanId: plan._id }).populate({
                path: 'CateringId',
                select: 'name price imageUrl',
                populate: { path: 'cate_cateringId', select: 'name' },
            });
            const decorates = await Plan_decorate.find({ PlanId: plan._id }).populate({
                path: 'DecorateId',
                select: 'name price imageUrl',
                populate: { path: 'Cate_decorateId', select: 'name' },
            });
            const presents = await Plan_present.find({ PlanId: plan._id }).populate({
                path: 'PresentId',
                select: 'name price imageUrl',
                populate: { path: 'Cate_presentId', select: 'name' },
            });

            return {
                ...plan.toObject(),
                totalPrice: plan.totalPrice,
                caterings: caterings.map(item => item.CateringId),
                decorates: decorates.map(item => item.DecorateId),
                presents: presents.map(item => ({
                    ...item.PresentId.toObject(),
                    quantity: item.quantity || 1,
                })),
            };
        }));

        res.status(200).json({ status: true, message: "Lấy danh sách kế hoạch thành công", data: populatedPlans });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách kế hoạch:", error);
        res.status(500).json({ status: false, message: "Thất bại khi lấy danh sách kế hoạch", error: error.message });
    }
});



// Lấy kế hoạch theo ID
// Lấy kế hoạch theo ID
router.get('/:id', async (req, res) => {
    try {
        const planId = req.params.id;

        if (!planId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ status: false, message: "ID không hợp lệ" });
        }

        const plan = await Plan.findById(planId)
            .populate('SanhId')
            .populate('UserId', 'name email');

        if (!plan) {
            return res.status(404).json({ status: false, message: "Không tìm thấy kế hoạch" });
        }

        const caterings = await Plan_catering.find({ PlanId: planId })
            .populate({
                path: 'CateringId',
                populate: { path: 'cate_cateringId', select: 'name' }
            });

        const decorates = await Plan_decorate.find({ PlanId: planId })
            .populate({
                path: 'DecorateId',
                populate: { path: 'Cate_decorateId', select: 'name' }
            });

        const presents = await Plan_present.find({ PlanId: planId })
            .populate({
                path: 'PresentId',
                populate: { path: 'Cate_presentId', select: 'name' }
            });

        console.log('Raw presents data:', JSON.stringify(presents, null, 2));

        if (!plan.totalPrice) {
            await plan.calculateTotalPrice();
            await plan.save();
        }

        res.status(200).json({
            status: true,
            message: "Lấy kế hoạch và dịch vụ thành công",
            data: {
                ...plan.toObject(),
                totalPrice: plan.totalPrice,
                caterings: caterings.map(item => item.CateringId),
                decorates: decorates.map(item => item.DecorateId),
                presents: presents.map(item => ({
                    ...(item.PresentId ? item.PresentId.toObject() : {}),
                    quantity: item.quantity || 0 // Đảm bảo quantity luôn có giá trị
                }))
            }
        });
    } catch (error) {
        console.error("Lỗi khi lấy kế hoạch:", error);
        res.status(500).json({ status: false, message: "Lỗi khi lấy kế hoạch", error: error.message });
    }
});



//update
router.put('/update/:id', async (req, res) => {
    try {
        const planId = req.params.id;
        const updateData = req.body;
        const userId = updateData.UserId;
        const forceDuplicate = updateData.forceDuplicate || false;

        const oldPlan = await Plan.findById(planId)
            .populate('SanhId')
            .populate('caterings')
            .populate('decorates')
            .populate('presents');

        if (!oldPlan) {
            return res.status(404).json({ status: false, message: "Không tìm thấy kế hoạch" });
        }

        // Kiểm tra trạng thái kế hoạch
        if (['Đang chờ', 'Đã đặt cọc'].includes(oldPlan.status) && !forceDuplicate) {
            return res.status(403).json({
                status: false,
                message: `Kế hoạch đang ở trạng thái '${oldPlan.status}', không thể cập nhật các mục.`
            });
        }

        // Hàm ánh xạ ID (giữ nguyên như hiện tại)
        const resolveIds = async (ids, type) => {
            // ... (giữ nguyên logic hiện tại)
        };

        const resolvedSanhId = updateData.SanhId
            ? (await resolveIds([updateData.SanhId], 'Sanh'))[0]
            : oldPlan.SanhId;

        const resolvedCaterings = updateData.caterings ? await resolveIds(updateData.caterings, 'caterings') : [];
        const resolvedDecorates = updateData.decorates ? await resolveIds(updateData.decorates, 'decorates') : [];
        let resolvedPresents = [];
        if (updateData.presents) {
            if (Array.isArray(updateData.presents)) {
                resolvedPresents = await Promise.all(updateData.presents.map(async item => {
                    const presentId = typeof item === 'object' ? item.id : item;
                    const quantity = typeof item === 'object' ? (item.quantity || 1) : 1;
                    const resolvedId = (await resolveIds([presentId], 'presents'))[0];
                    return { id: resolvedId, quantity };
                }));
            } else {
                resolvedPresents = (await resolveIds(updateData.presents, 'presents')).map(id => ({ id, quantity: 1 }));
            }
        }

        if (!forceDuplicate && oldPlan.UserId?.toString() === userId) {
            // Cập nhật các trường cơ bản
            Object.assign(oldPlan, {
                UserId: updateData.UserId || oldPlan.UserId,
                SanhId: resolvedSanhId,
                status: updateData.status || oldPlan.status,
                plandateevent: updateData.plandateevent || oldPlan.plandateevent,
                plansoluongkhach: updateData.plansoluongkhach || oldPlan.plansoluongkhach || 0,
                name: updateData.name || oldPlan.name,
                planprice: updateData.planprice || oldPlan.planprice,
            });

            // Xóa và thêm dịch vụ mới (chỉ thực hiện nếu trạng thái không bị khóa)
            if (!['Đang chờ', 'Đã đặt cọc'].includes(oldPlan.status)) {
                await Promise.all([
                    Plan_catering.deleteMany({ PlanId: planId }),
                    Plan_decorate.deleteMany({ PlanId: planId }),
                    Plan_present.deleteMany({ PlanId: planId }),
                ]);

                const newCaterings = resolvedCaterings.map(cateringId => ({
                    PlanId: planId,
                    CateringId: cateringId,
                }));
                const newDecorates = resolvedDecorates.map(decorateId => ({
                    PlanId: planId,
                    DecorateId: decorateId,
                }));
                const newPresents = resolvedPresents.map(present => ({
                    PlanId: planId,
                    PresentId: present.id,
                    quantity: present.quantity,
                }));

                await Promise.all([
                    newCaterings.length > 0 ? Plan_catering.insertMany(newCaterings) : Promise.resolve(),
                    newDecorates.length > 0 ? Plan_decorate.insertMany(newDecorates) : Promise.resolve(),
                    newPresents.length > 0 ? Plan_present.insertMany(newPresents) : Promise.resolve(),
                ]);
            }

            // Tính lại totalPrice
            await oldPlan.calculateTotalPrice();
            await oldPlan.save();

            // Populate dữ liệu trả về
            const populatedUpdatedPlan = await Plan.findById(planId)
                .populate('SanhId', 'name price imageUrl')
                .populate({
                    path: 'caterings',
                    populate: { path: 'CateringId', select: 'name price imageUrl' },
                })
                .populate({
                    path: 'decorates',
                    populate: { path: 'DecorateId', select: 'name price imageUrl' },
                })
                .populate({
                    path: 'presents',
                    populate: { path: 'PresentId', select: 'name price imageUrl' },
                });

            return res.status(200).json({
                status: true,
                message: "Cập nhật kế hoạch thành công",
                data: populatedUpdatedPlan,
            });
        }

        // Tạo kế hoạch mới nếu forceDuplicate hoặc User khác
        const newPlan = await Plan.create({
            UserId: userId,
            SanhId: resolvedSanhId,
            status: updateData.status || oldPlan.status,
            plandateevent: updateData.plandateevent || oldPlan.plandateevent || new Date(),
            plansoluongkhach: updateData.plansoluongkhach || oldPlan.plansoluongkhach || 0,
            name: updateData.name ? `Copy of ${updateData.name}` : `Copy of ${oldPlan.name}`,
            planprice: updateData.planprice || oldPlan.planprice,
        });

        const newCaterings = resolvedCaterings.map(cateringId => ({
            PlanId: newPlan._id,
            CateringId: cateringId,
        }));
        const newDecorates = resolvedDecorates.map(decorateId => ({
            PlanId: newPlan._id,
            DecorateId: decorateId,
        }));
        const newPresents = resolvedPresents.map(present => ({
            PlanId: newPlan._id,
            PresentId: present.id,
            quantity: present.quantity,
        }));

        await Promise.all([
            newCaterings.length > 0 ? Plan_catering.insertMany(newCaterings) : Promise.resolve(),
            newDecorates.length > 0 ? Plan_decorate.insertMany(newDecorates) : Promise.resolve(),
            newPresents.length > 0 ? Plan_present.insertMany(newPresents) : Promise.resolve(),
        ]);

        // Tính lại totalPrice
        await newPlan.calculateTotalPrice();
        await newPlan.save();

        const populatedNewPlan = await Plan.findById(newPlan._id)
            .populate('SanhId', 'name price imageUrl')
            .populate({
                path: 'caterings',
                populate: { path: 'CateringId', select: 'name price imageUrl' },
            })
            .populate({
                path: 'decorates',
                populate: { path: 'DecorateId', select: 'name price imageUrl' },
            })
            .populate({
                path: 'presents',
                populate: { path: 'PresentId', select: 'name price imageUrl' },
            });

        res.status(200).json({
            status: true,
            message: "Đã tạo kế hoạch sao chép",
            data: populatedNewPlan,
        });
    } catch (error) {
        console.error("Lỗi khi cập nhật kế hoạch:", error);
        res.status(500).json({ status: false, message: "Lỗi khi cập nhật kế hoạch", error: error.message });
    }
});

// Lấy danh sách kế hoạch theo UserId
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ status: false, message: "UserId không hợp lệ" });
        }

        const plans = await Plan.find({ UserId: userId })
            .populate('SanhId', 'name price SoLuongKhach')
            .populate('UserId', 'name email');

        if (!plans.length) {
            return res.status(200).json({ status: true, message: "Không có kế hoạch nào", data: [] });
        }

        const populatedPlans = await Promise.all(plans.map(async (plan) => {
            // Tính lại totalPrice
            await plan.calculateTotalPrice();
            await plan.save();

            const caterings = await Plan_catering.find({ PlanId: plan._id }).populate({
                path: 'CateringId',
                select: 'name price imageUrl',
            });
            const decorates = await Plan_decorate.find({ PlanId: plan._id }).populate({
                path: 'DecorateId',
                select: 'name price imageUrl',
            });
            const presents = await Plan_present.find({ PlanId: plan._id }).populate({
                path: 'PresentId',
                select: 'name price imageUrl',
            });

            return {
                ...plan.toObject(),
                totalPrice: plan.totalPrice,
                caterings: caterings.map(item => item.CateringId),
                decorates: decorates.map(item => item.DecorateId),
                presents: presents.map(item => ({
                    ...item.PresentId.toObject(),
                    quantity: item.quantity || 1,
                })),
            };
        }));

        res.status(200).json({ status: true, message: "Lấy danh sách kế hoạch thành công", data: populatedPlans });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách kế hoạch:", error);
        res.status(500).json({ status: false, message: "Lỗi khi lấy danh sách kế hoạch", error: error.message });
    }
});



// Xóa kế hoạch theo ID
router.delete('/:planId', async (req, res) => {
    try {
        const { planId } = req.params;
        const { serviceType, serviceId } = req.query;

        if (!planId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ status: false, message: "PlanId không hợp lệ" });
        }

        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({ status: false, message: "Không tìm thấy kế hoạch" });
        }

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

            // Tính lại totalPrice sau khi xóa dịch vụ
            await plan.calculateTotalPrice();
            await plan.save();

            return res.status(200).json({ status: true, message: "Xóa dịch vụ thành công" });
        }

        // Xóa toàn bộ kế hoạch
        await Plan.findByIdAndDelete(planId);
        await Promise.all([
            Plan_catering.deleteMany({ PlanId: planId }),
            Plan_decorate.deleteMany({ PlanId: planId }),
            Plan_present.deleteMany({ PlanId: planId }),
        ]);

        return res.status(200).json({ status: true, message: "Xóa kế hoạch và các dịch vụ liên quan thành công" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: "Lỗi khi xóa kế hoạch hoặc dịch vụ" });
    }
});


router.post("/search", async (req, res) => {
    try {
        const { budget, guests } = req.body;
        const plans = await Plan.find({ budget: { $lte: budget }, guests: { $gte: guests } });

        const populatedPlans = await Promise.all(plans.map(async (plan) => {
            const caterings = await CateringOrder.find({ PlanId: plan._id }).populate("CateringId", "name");
            const decorates = await DecorateOrder.find({ PlanId: plan._id }).populate("DecorateId", "name");
            const presents = await PresentOrder.find({ PlanId: plan._id }).populate("PresentId", "name");

            return {
                ...plan.toObject(),
                caterings: caterings.map(item => item.CateringId),
                decorates: decorates.map(item => item.DecorateId),
                presents: presents.map(item => item.PresentId)
            };
        }));

        res.status(200).json({ status: true, message: "Lấy danh sách kế hoạch phù hợp thành công", data: populatedPlans });
    } catch (error) {
        res.status(500).json({ status: false, message: "Lỗi khi tìm kế hoạch", error: error.message });
    }
});

//planPrice = totalPrice, soLuongKhach = sanhID.SoluongKhach
router.post('/khaosat', async (req, res) => {
    try {
        const { planprice, plansoluongkhach, plandateevent } = req.body;

        let filter = {
            UserId: null,
        };

        if (plandateevent) {
            const formattedDate = moment(plandateevent, 'DD/MM/YYYY').startOf('day').toDate();
            filter.plandateevent = { $ne: formattedDate };
        }

        let plans = await Plan.find(filter)
            .populate('SanhId')
            .populate('UserId', 'name email');

        const populatedPlans = await Promise.all(plans.map(async (plan) => {
            const caterings = await Plan_catering.find({ PlanId: plan._id })
                .populate({
                    path: 'CateringId',
                    populate: { path: 'cate_cateringId', select: 'name' }
                });
            const decorates = await Plan_decorate.find({ PlanId: plan._id })
                .populate({
                    path: 'DecorateId',
                    populate: { path: 'Cate_decorateId', select: 'name' }
                });
            const presents = await Plan_present.find({ PlanId: plan._id })
                .populate({
                    path: 'PresentId',
                    populate: { path: 'Cate_presentId', select: 'name' }
                });

            const soLuongBan = plansoluongkhach ? Math.ceil(parseInt(plansoluongkhach) / 10) : 0;

            let totalCateringPrice = 0;
            if (soLuongBan > 0) {
                totalCateringPrice = caterings.reduce((sum, item) => {
                    const cateringPrice = item.CateringId?.price || 0;
                    return sum + (cateringPrice * soLuongBan);
                }, 0);
            }

            const totalDecoratePrice = decorates.reduce((sum, item) => {
                return sum + (item.DecorateId?.price || 0);
            }, 0);

            const totalPresentPrice = presents.reduce((sum, item) => {
                const price = item.PresentId?.price || 0;
                const quantity = item.quantity || 1;
                return sum + (price * quantity);
            }, 0);

            const sanhPrice = plan.SanhId?.price || 0;
            const calculatedTotalPrice = sanhPrice + totalCateringPrice + totalDecoratePrice + totalPresentPrice;

            // Cập nhật totalPrice và plansoluongkhach trong cơ sở dữ liệu
            plan.plansoluongkhach = plansoluongkhach || plan.plansoluongkhach;
            plan.totalPrice = calculatedTotalPrice;
            await plan.save();

            const isCapacityValid = !plansoluongkhach || (plan.SanhId && plan.SanhId.SoLuongKhach >= parseInt(plansoluongkhach));
            const isWithinBudget = !planprice || (calculatedTotalPrice <= parseFloat(planprice));

            if (isCapacityValid && isWithinBudget) {
                return {
                    ...plan.toObject(),
                    caterings: caterings.map(item => item.CateringId),
                    decorates: decorates.map(item => item.DecorateId),
                    presents: presents.map(item => ({
                        ...item.PresentId.toObject(),
                        quantity: item.quantity || 1,
                    })),
                    totalPrice: calculatedTotalPrice,
                };
            }
            return null;
        }));

        const validPlans = populatedPlans.filter(plan => plan !== null);

        res.status(200).json({
            status: true,
            message: "Lấy danh sách kế hoạch mặc định thành công",
            data: validPlans
        });
    } catch (error) {
        console.error("Lỗi:", error);
        res.status(500).json({ status: false, error: error.message });
    }
});


router.delete('/user/:userId/plan/:planId', async (req, res) => {
    try {
        const { userId, planId } = req.params;

        // Kiểm tra xem userId và planId có hợp lệ không
        if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ status: false, message: "UserId không hợp lệ" });
        }
        if (!planId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ status: false, message: "PlanId không hợp lệ" });
        }

        // Tìm và xóa kế hoạch cụ thể của user
        const deletedPlan = await Plan.findOneAndDelete({ _id: planId, UserId: userId });
        if (!deletedPlan) {
            return res.status(404).json({
                status: false,
                message: "Không tìm thấy kế hoạch với PlanId và UserId này"
            });
        }

        // Xóa các dịch vụ liên quan trong bảng trung gian
        await Promise.all([
            Plan_catering.deleteMany({ PlanId: planId }),
            Plan_decorate.deleteMany({ PlanId: planId }),
            Plan_present.deleteMany({ PlanId: planId })
        ]);

        return res.status(200).json({
            status: true,
            message: "Xóa kế hoạch và các dịch vụ liên quan thành công"
        });

    } catch (error) {
        console.error("Lỗi khi xóa kế hoạch:", error);
        return res.status(500).json({
            status: false,
            message: "Lỗi khi xóa kế hoạch",
            error: error.message
        });
    }
});



module.exports = router;