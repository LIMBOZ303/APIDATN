const express = require('express');
const router = express.Router();
const moment = require('moment');
const Plan = require('../models/planModel');
const Lobby = require('../models/Sanh');
const User = require('../models/userModel');
const Plan_catering = require('../models/PlanWith/Plan-Catering')
const Plan_decorate = require('../models/PlanWith/Plan-Decorate')
const Plan_present = require('../models/PlanWith/Plan-Present')
const Plan_lobby = require('../models/PlanWith/Plan-lobby')

const cate_catering = require('../models/Cate/cate_cateringModel')
const decorate = require('../models/decorateModel')
const catering = require('../models/cateringModel')
const present = require('../models/presentModel')


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

        // Kiểm tra ID hợp lệ
        if (!planId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ status: false, message: "ID không hợp lệ" });
        }

        // Tìm kế hoạch theo ID, populate dữ liệu Sảnh & User
        const plan = await Plan.findById(planId)
            .populate('SanhId') // Populate thông tin sảnh
            .populate('UserId', 'name email'); // Chỉ lấy name & email của User

        if (!plan) {
            return res.status(404).json({ status: false, message: "Không tìm thấy kế hoạch" });
        }

        // Lấy danh sách dịch vụ từ các bảng trung gian
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

        // Kiểm tra nếu totalPrice chưa có, cập nhật lại
        if (!plan.totalPrice) {
            await plan.calculateTotalPrice();
            await plan.save();
        }

        // Trả về dữ liệu đầy đủ giống API `/khaosat`
        res.status(200).json({
            status: true,
            message: "Lấy kế hoạch và dịch vụ thành công",
            data: {
                ...plan.toObject(),
                totalPrice: plan.totalPrice, // Đảm bảo hiển thị tổng giá
                caterings: caterings.map(item => item.CateringId),
                decorates: decorates.map(item => item.DecorateId),
                presents: presents.map(item => item.PresentId)
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
  
      // Tìm kế hoạch cũ theo ID
      const oldPlan = await Plan.findById(planId)
        .populate('SanhId')
        .populate('caterings')
        .populate('decorates')
        .populate('presents');
  
      if (!oldPlan) {
        return res.status(404).json({ status: false, message: "Không tìm thấy kế hoạch" });
      }
  
      // Nếu không có forceDuplicate và UserId trùng với kế hoạch cũ, cập nhật trực tiếp
      if (!forceDuplicate && oldPlan.UserId.toString() === userId) {
        // Cập nhật các trường cơ bản của Plan
        Object.assign(oldPlan, {
          UserId: updateData.UserId || oldPlan.UserId,
          SanhId: updateData.SanhId || oldPlan.SanhId,
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
        // Xóa các document cũ
        await Promise.all([
          Plan_catering.deleteMany({ PlanId: planId }),
          Plan_decorate.deleteMany({ PlanId: planId }),
          Plan_present.deleteMany({ PlanId: planId }),
        ]);
  
        // Thêm các document mới từ updateData
        const newCaterings = (updateData.caterings || []).map(cateringId => ({
          PlanId: planId,
          CateringId: cateringId,
        }));
        const newDecorates = (updateData.decorates || []).map(decorateId => ({
          PlanId: planId,
          DecorateId: decorateId,
        }));
        const newPresents = (updateData.presents || []).map(presentId => ({
          PlanId: planId,
          PresentId: presentId,
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
  
        return res.status(200).json({
          status: true,
          message: "Cập nhật kế hoạch thành công",
          data: populatedUpdatedPlan,
        });
      }
  
      // Nếu có forceDuplicate hoặc User khác, tạo kế hoạch mới
      const newPlan = await Plan.create({
        UserId: userId,
        SanhId: updateData.SanhId || oldPlan.SanhId._id, // Sử dụng dữ liệu từ updateData
        totalPrice: updateData.totalPrice || oldPlan.totalPrice,
        status: updateData.status || oldPlan.status,
        plandateevent: updateData.plandateevent || oldPlan.plandateevent,
        plansoluongkhach: updateData.plansoluongkhach || oldPlan.plansoluongkhach,
        name: updateData.name ? `Copy of ${updateData.name}` : `Copy of ${oldPlan.name}`,
        planprice: updateData.planprice || oldPlan.planprice,
      });
  
      // Thêm các dịch vụ từ updateData
      const newCaterings = (updateData.caterings || []).map(cateringId => ({
        PlanId: newPlan._id,
        CateringId: cateringId,
      }));
      const newDecorates = (updateData.decorates || []).map(decorateId => ({
        PlanId: newPlan._id,
        DecorateId: decorateId,
      }));
      const newPresents = (updateData.presents || []).map(presentId => ({
        PlanId: newPlan._id,
        PresentId: presentId,
      }));
  
      await Promise.all([
        newCaterings.length > 0 ? Plan_catering.insertMany(newCaterings) : Promise.resolve(),
        newDecorates.length > 0 ? Plan_decorate.insertMany(newDecorates) : Promise.resolve(),
        newPresents.length > 0 ? Plan_present.insertMany(newPresents) : Promise.resolve(),
      ]);
  
      // Populate lại dữ liệu của newPlan trước khi trả về
      const populatedNewPlan = await Plan.findById(newPlan._id)
        .populate('SanhId')
        .populate('caterings')
        .populate('decorates')
        .populate('presents');
  
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

        // Lọc theo giá
        if (planprice && !isNaN(planprice)) {
            filter.totalPrice = { $lte: parseFloat(planprice) };
        }

        // Chuyển đổi ngày từ dd/mm/yyyy sang ISODate để so sánh
        if (plandateevent) {
            const formattedDate = moment(plandateevent, 'DD/MM/YYYY').startOf('day').toDate();
            filter.PlanDateEvent = { $ne: formattedDate }; // Lọc ra các ngày chưa có người đặt
        }

        let plans = await Plan.find(filter)
            .populate('SanhId') // Populate sảnh
            .populate('UserId', 'name email'); // Populate người dùng (sẽ là null cho plan mặc định)

        // Lọc theo số lượng khách
        if (plansoluongkhach && !isNaN(plansoluongkhach)) {
            plans = plans.filter(plan =>
                plan.SanhId && plan.SanhId.SoLuongKhach >= parseInt(plansoluongkhach)
            );
        }

        // Lấy dịch vụ từ bảng trung gian
        const populatedPlans = await Promise.all(plans.map(async (plan) => {
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

            return {
                ...plan.toObject(),
                caterings: caterings.map(item => item.CateringId),
                decorates: decorates.map(item => item.DecorateId),
                presents: presents.map(item => item.PresentId)
            };
        }));

        res.status(200).json({
            status: true,
            message: "Lấy danh sách kế hoạch mặc định thành công",
            data: populatedPlans
        });

    } catch (error) {
        console.error("Lỗi:", error);
        res.status(500).json({ status: false, error: error.message });
    }
});






module.exports = router;
