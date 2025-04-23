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

        if (!planId || !newPlanId) {
            return res.status(400).json({ success: false, message: 'Thiếu planId hoặc newPlanId' });
        }

        const originalPlan = await Plan.findById(planId);
        const newPlan = await Plan.findById(newPlanId);

        if (!originalPlan || !newPlan) {
            return res.status(404).json({
                success: false,
                message: `Kế hoạch không tồn tại: ${!originalPlan ? 'planId' : 'newPlanId'}`
            });
        }

        originalPlan.set({
            ...newPlan.toObject(),
            _id: originalPlan._id,
            originalPlanId: undefined,
            status: 'Chưa đặt cọc',
            updatedAt: new Date(),
        });

        await originalPlan.save();
        await Plan.deleteOne({ _id: newPlanId });

        res.json({ success: true, message: 'Kế hoạch đã được ghi đè' });
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

        // Tìm kế hoạch giả
        const tempPlan = await Plan.findById(tempPlanId);
        if (!tempPlan || !tempPlan.isTemporary) {
            return res.status(404).json({ success: false, message: 'Kế hoạch tạm thời không tồn tại' });
        }

        // Tìm kế hoạch gốc
        const originalPlan = await Plan.findById(tempPlan.originalPlanId);
        if (!originalPlan) {
            return res.status(404).json({ success: false, message: 'Kế hoạch gốc không tồn tại' });
        }

        // Ghi đè kế hoạch gốc bằng dữ liệu từ kế hoạch giả
        originalPlan.set({
            ...tempPlan.toObject(),
            _id: originalPlan._id, // Giữ ID gốc
            isTemporary: undefined, // Xóa trường isTemporary
            originalPlanId: undefined, // Xóa trường originalPlanId
            status: 'Chưa đặt cọc', // Trạng thái sau khi xác nhận
            updatedAt: new Date(),
        });

        await originalPlan.save();
        await Plan.deleteOne({ _id: tempPlanId }); // Xóa kế hoạch giả

        res.json({ success: true, message: 'Kế hoạch đã được xác nhận và ghi đè' });
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
        const originalPlan = await Plan.findById(planId);
        if (!originalPlan) {
            return res.status(404).json({ success: false, message: 'Kế hoạch không tồn tại' });
        }

        // Clone kế hoạch
        const newPlan = new Plan({
            ...originalPlan.toObject(),
            _id: undefined, // Tạo ID mới
            status: 'Đang chờ xác nhận', // Trạng thái nháp
            isTemporary: true, // Đánh dấu là kế hoạch giả/tạm thời
            originalPlanId: planId, // Lưu ID kế hoạch gốc để tham chiếu
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await newPlan.save();
        res.json({ success: true, data: { newPlanId: newPlan._id, planData: newPlan } });
    } catch (error) {
        console.error('Lỗi clone kế hoạch:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
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

        // Tạo mới kế hoạch, các giá trị có thể để trống
        const newPlan = await Plan.create({
            name,
            SanhId,
            planprice,
            plansoluongkhach,
            plandateevent
        });

        const planId = newPlan._id;

        // Liên kết với các dịch vụ nếu có
        await Promise.all([
            cateringId.length > 0 ? Plan_catering.insertMany(cateringId.map(id => ({ PlanId: planId, CateringId: id }))) : null,
            decorateId.length > 0 ? Plan_decorate.insertMany(decorateId.map(id => ({ PlanId: planId, DecorateId: id }))) : null,
            presentId.length > 0 ? Plan_present.insertMany(presentId.map(id => ({ PlanId: planId, PresentId: id }))) : null
        ]);

        return res.status(201).json({ status: true, message: "Thêm kế hoạch thành công", data: newPlan });
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

        console.log('Received updateData:', JSON.stringify(updateData, null, 2));

        // Tìm kế hoạch cũ theo ID
        const oldPlan = await Plan.findById(planId)
            .populate('SanhId')
            .populate('caterings')
            .populate('decorates')
            .populate('presents');

        if (!oldPlan) {
            return res.status(404).json({ status: false, message: "Không tìm thấy kế hoạch" });
        }

        // Hàm ánh xạ ID từ "Yêu thích" hoặc ID gốc
        const resolveIds = async (ids, type) => {
            const resolvedIds = [];
            let orderModel;
            let field;

            switch (type) {
                case 'caterings':
                    orderModel = catering_order;
                    field = 'CateringId';
                    break;
                case 'decorates':
                    orderModel = decorate_order;
                    field = 'DecorateId';
                    break;
                case 'presents':
                    orderModel = present_order;
                    field = 'PresentId';
                    break;
                case 'Sanh':
                    orderModel = Lobby_order;
                    field = 'SanhId';
                    break;
                default:
                    return ids;
            }

            for (const id of ids) {
                const order = await orderModel.findById(id);
                if (order && order[field]) {
                    resolvedIds.push(order[field]);
                } else {
                    resolvedIds.push(id);
                }
            }
            return resolvedIds;
        };

        // Ánh xạ SanhId
        const resolvedSanhId = updateData.SanhId
            ? (await resolveIds([updateData.SanhId], 'Sanh'))[0]
            : oldPlan.SanhId;

        // Ánh xạ các ID từ updateData
        const resolvedCaterings = updateData.caterings ? await resolveIds(updateData.caterings, 'caterings') : [];
        const resolvedDecorates = updateData.decorates ? await resolveIds(updateData.decorates, 'decorates') : [];
        
        // Xử lý presents với quantity
        let resolvedPresents = [];
        if (updateData.presents) {
            if (Array.isArray(updateData.presents)) {
                // Nếu presents là mảng các object chứa id và quantity
                resolvedPresents = await Promise.all(updateData.presents.map(async item => {
                    const presentId = typeof item === 'object' ? item.id : item;
                    const quantity = typeof item === 'object' ? (item.quantity || 1) : 1;
                    const resolvedId = (await resolveIds([presentId], 'presents'))[0];
                    return { id: resolvedId, quantity };
                }));
            } else {
                // Nếu presents vẫn là mảng các ID đơn thuần
                resolvedPresents = (await resolveIds(updateData.presents, 'presents')).map(id => ({ id, quantity: 1 }));
            }
        }

        // Nếu không có forceDuplicate và UserId trùng với kế hoạch cũ, cập nhật trực tiếp
        if (!forceDuplicate && oldPlan.UserId?.toString() === userId) {
            // Cập nhật các trường cơ bản của Plan
            Object.assign(oldPlan, {
                UserId: updateData.UserId || oldPlan.UserId,
                SanhId: resolvedSanhId,
                totalPrice: updateData.totalPrice || oldPlan.totalPrice,
                status: updateData.status || oldPlan.status,
                plandateevent: updateData.plandateevent || oldPlan.plandateevent,
                plansoluongkhach: updateData.plansoluongkhach || oldPlan.plansoluongkhach,
                name: updateData.name || oldPlan.name,
                planprice: updateData.planprice || oldPlan.planprice,
            });

            // Lưu các thay đổi cơ bản của Plan
            const updatedPlan = await oldPlan.save();

            // Cập nhật các dịch vụ (caterings, decorates, presents)
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

            // Populate lại dữ liệu trước khi trả về
            const populatedUpdatedPlan = await Plan.findById(updatedPlan._id)
                .populate('SanhId')
                .populate('caterings')
                .populate('decorates')
                .populate('presents');

            console.log('Updated plan:', JSON.stringify(populatedUpdatedPlan, null, 2));

            return res.status(200).json({
                status: true,
                message: "Cập nhật kế hoạch thành công",
                data: populatedUpdatedPlan,
            });
        }

        // Nếu có forceDuplicate hoặc User khác, tạo kế hoạch mới
        const newPlan = await Plan.create({
            UserId: userId,
            SanhId: resolvedSanhId,
            totalPrice: updateData.totalPrice || oldPlan.totalPrice,
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

        const populatedNewPlan = await Plan.findById(newPlan._id)
            .populate('SanhId')
            .populate('caterings')
            .populate('decorates')
            .populate('presents');

        console.log('New plan:', JSON.stringify(populatedNewPlan, null, 2));

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
            UserId: null, // Chỉ lấy các plan không có UserId (plan mặc định)
        };

        // Chuyển đổi ngày từ dd/mm/yyyy sang ISODate để so sánh
        if (plandateevent) {
            const formattedDate = moment(plandateevent, 'DD/MM/YYYY').startOf('day').toDate();
            filter.plandateevent = { $ne: formattedDate }; // Lọc ra các ngày chưa có người đặt
        }

        // Lấy danh sách kế hoạch mặc định
        let plans = await Plan.find(filter)
            .populate('SanhId') // Populate sảnh
            .populate('UserId', 'name email'); // Populate người dùng (sẽ là null cho plan mặc định)

        // Tính toán và lọc kế hoạch dựa trên ngân sách và số lượng khách
        const populatedPlans = await Promise.all(plans.map(async (plan) => {
            // Lấy dịch vụ từ bảng trung gian
            const caterings = await Plan_catering.find({ PlanId: plan._id })
                .populate({
                    path: 'CateringId',
                    populate: {
                        path: 'cate_cateringId',
                        select: 'name'
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

            // Tính số bàn dựa trên plansoluongkhach (nếu có)
            const soLuongBan = plansoluongkhach ? Math.ceil(parseInt(plansoluongkhach) / 10) : 0;

            // Tính tổng giá catering
            let totalCateringPrice = 0;
            if (soLuongBan > 0) {
                totalCateringPrice = caterings.reduce((sum, item) => {
                    const cateringPrice = item.CateringId?.price || 0;
                    return sum + (cateringPrice * soLuongBan);
                }, 0);
            }

            // Tính tổng giá decorate
            const totalDecoratePrice = decorates.reduce((sum, item) => {
                return sum + (item.DecorateId?.price || 0);
            }, 0);

            // Tính tổng giá sảnh
            const sanhPrice = plan.SanhId?.price || 0;

            // Tính totalPrice dựa trên số lượng khách
            const calculatedTotalPrice = sanhPrice + totalCateringPrice + totalDecoratePrice;

            // Kiểm tra sức chứa của sảnh (nếu có plansoluongkhach)
            const isCapacityValid = !plansoluongkhach || (plan.SanhId && plan.SanhId.SoLuongKhach >= parseInt(plansoluongkhach));

            // Kiểm tra ngân sách (nếu có planprice)
            const isWithinBudget = !planprice || (calculatedTotalPrice <= parseFloat(planprice));

            // Chỉ trả về plan nếu sức chứa hợp lệ và trong ngân sách
            if (isCapacityValid && isWithinBudget) {
                return {
                    ...plan.toObject(),
                    caterings: caterings.map(item => item.CateringId),
                    decorates: decorates.map(item => item.DecorateId),
                    presents: presents.map(item => item.PresentId),
                    totalPrice: calculatedTotalPrice // Ghi đè totalPrice đã tính
                };
            }
            return null; // Loại bỏ plan nếu không đủ sức chứa hoặc vượt ngân sách
        }));

        // Loại bỏ các plan null (không đủ sức chứa hoặc vượt ngân sách)
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