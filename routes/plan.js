const express = require('express');
const router = express.Router();
const Plan = require('../models/planModel');
const Clothes = require('../models/clothesModel');
const Invitation = require('../models/invitationModel');
const Lobby = require('../models/lobbyModel');
const Catering = require('../models/catering');
const Flower = require('../models/flowerModel');

router.post('/survey-plan', async (req, res) => {
    try {
        const { budget, location, guestCount } = req.body;
        if (!budget || !location || !guestCount) {
            return res.status(400).json({ message: 'Thiếu thông tin bắt buộc!' });
        }

        // Tìm các mục với giá cả phù hợp
        const clothes = await Clothes.findOne().sort({ price: 1 });
        const invitation = await Invitation.findOne().sort({ price: 1 });
        const lobby = await Lobby.findOne({ SoLuongKhach: { $gte: guestCount } }).sort({ price: 1 });
        const catering = await Catering.findOne().sort({ price: 1 });
        const flower = await Flower.findOne().sort({ price: 1 });

        if (!clothes || !invitation || !lobby || !catering || !flower) {
            return res.status(404).json({ message: 'Không tìm thấy các mục phù hợp!' });
        }

        // Tính tổng giá tiền
        const totalPrice = clothes.price + invitation.price + lobby.price + catering.price + flower.price;
        if (totalPrice > budget) {
            return res.status(400).json({ message: 'Ngân sách không đủ để tạo Plan!' });
        }

        // Tạo kế hoạch mới
        const newPlan = new Plan({
            clothesId: clothes._id,
            invitationId: invitation._id,
            lobbyId: lobby._id,
            cateringId: catering._id,
            flowerId: flower._id,
            totalPrice,
            planprice: totalPrice,
            plansoluongkhach: guestCount,
            planlocation: location,
        });
        await newPlan.save();

        res.status(201).json({ message: 'Tạo Plan thành công!', plan: newPlan });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ!', error: error.message });
    }
});

router.get('/plans', async (req, res) => {
    try {
        const plans = await Plan.find()
            .populate('clothesId')
            .populate('invitationId')
            .populate('lobbyId')
            .populate('cateringId')
            .populate('flowerId')
            .sort({ createdAt: -1 });

        res.status(200).json(plans);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ!', error: error.message });
    }
});

//tạo plan
router.post('/create', async (req, res) => {
    const { clothesId, invitationId, hallId, cateringId, flowerId, totalPrice, planprice, plansoluongkhach, planlocation } = req.body;
    const plan = new Plan({
        clothesId,
        invitationId,
        hallId,
        cateringId,
        flowerId,
        totalPrice,
        planprice,
        plansoluongkhach,
        planlocation
    });
    try {
        await plan.save();
        res.status(201).json({ status: true, message: 'tạo kế hoạch thành công', data: plan });
    } catch (error) {

        res.status(400).json({ status: false, message: "tạo kế hoạch thất bại" });
    }
});

//lấy tất cả plan
router.get('/all', async (req, res) => {
    try {
        const plans = await Plan.find()
            .populate('clothesId')
            .populate('invitationId')
            .populate('hallId')
            .populate('cateringId')
            .populate('flowerId');
        res.status(200).json({ status: true, message: "lấy danh sách plan thành công", data: plans });
    } catch (error) {
        res.status(500).json({ status: false, message: 'lấy danh sách plan thất bại' });
    }
});

//lấy plan theo id
router.get('/getbyid/:id', async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id)
            .populate('clothesId')
            .populate('invitationId')
            .populate('hallId')
            .populate('cateringId')
            .populate('flowerId');
        if (!plan) {
            return res.status(404).json({ status: false, message: 'không tìm thấy id plan' });
        }
        res.status(200).json({ status: true, message: "lấy plan theo id thành công", data: plan });
    } catch (error) {

        res.status(500).json({ status: false, message: 'lấy plan theo id thất bại' });
    }
});

//cập nhật plan
router.put('/update/:id', async (req, res) => {
    const { totalPrice, planprice, plansoluongkhach, planlocation } = req.body;
    try {
        const Updateplan = await Plan.findByIdAndUpdate(req.params.id, { totalPrice, planprice, plansoluongkhach, planlocation }, { new: true });
        if (!Updateplan) {
            return res.status(404).send({ status: false, message: 'không tìm thấy id' });
        }
        res.status(200).json({ status: true, message: "update plan thành công", data: Updateplan });
    } catch (error) {

        res.status(500).json({ status: false, message: 'update plan thất bại' });
    }
});

//xóa plan
router.delete('/delete/:id', async (req, res) => {
    try {
        const Deleteplan = await Plan.findByIdAndDelete(req.params.id);
        if (!Deleteplan) {
            return res.status(404).json({status:false, message: 'Plan not found' });
        }
        res.status(200).json({status:true, message: 'Plan deleted successfully' });
    } catch (error) {
        res.status(500).json({status:false, message: 'Error deleting plan' });
    }
});

module.exports = router;
