const express = require('express');
const router = express.Router();
const Plan = require('../models/planModel');

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
