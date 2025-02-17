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
        planlocation });
    try {
        await plan.save();
        res.status(201).json({message: 'Plan created successfully'});
    } catch (error) {
        console.error('Error creating plan', error);
        res.status(400).json({ error: error.message });
    }
});

//lấy tất cả plan
router.get('/getall', async (req, res) => {
    try {
        const plans = await Plan.find()
        .populate('clothesId')
        .populate('invitationId')
        .populate('hallId')
        .populate('cateringId')
        .populate('flowerId');
        res.status(200).json(plans);
    } catch (error) {
        console.error('Error getting plans', error);
        res.status(500).json({ error: 'Error getting plans' });
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
            return res.status(404).send({ message: 'Plan not found' });
        }
        res.status(200).send(plan);
    } catch (error) {
        console.error('Error getting plan', error);
        res.status(500).send({ message: 'Error getting plan' });
    }
});

//cập nhật plan
router.put('/update/:id', async (req, res) => {
    const {totalPrice, planprice, plansoluongkhach, planlocation} = req.body;
    try {
        const Updateplan = await Plan.findByIdAndUpdate(req.params.id, {totalPrice, planprice, plansoluongkhach, planlocation}, { new: true });
        if (!Updateplan) {
            return res.status(404).send({ message: 'Plan not found' });
        }
        res.status(200).send(Updateplan);
    } catch (error) {
        console.error('Error updating plan', error);    
        res.status(500).send({ message: 'Error updating plan' });
    }
});

//xóa plan
router.delete('/delete/:id', async (req, res) => {
    try {
        const Deleteplan = await Plan.findByIdAndDelete(req.params.id);
        if (!Deleteplan) {
            return res.status(404).send({ message: 'Plan not found' });
        }
        res.status(200).send({ message: 'Plan deleted successfully' });
    } catch (error) {
        console.error('Error deleting plan', error);
        res.status(500).send({ message: 'Error deleting plan' });
    }
});

module.exports = router;
