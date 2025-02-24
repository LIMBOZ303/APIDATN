const express = require('express');
const router = express.Router();
const WeddingOrder = require('../models/weddingordermodel');

//tạo đơn
router.post('/create', async (req, res) => {
    const { userId, planId, totalPrice, location, eventDate } = req.body;
    const newWeddingOrder = new WeddingOrder({ userId, planId, totalPrice, location, eventDate });
    try {
        await newWeddingOrder.save();
        res.status(201).json({ status: true, message: 'tạo Order Wedding thành công', data: newWeddingOrder });
    } catch (error) {
        res.status(400).send({ status: false, message: 'tạo Order thất bại' });
    }
});

//lấy danh sách tất cả đơn đặt hàng
router.get('/all', async (req, res) => {
    try {
        const orders = await WeddingOrder.find().populate('userId').populate('planId');
        res.status(200).json({ status: true, message: "lấy tất cả đơn hàng thành công", data: orders });
    } catch (error) {
        res.status(500).json({ status: false, message: 'Error getting wedding orders' });
    }
});

//lấy danh sách đơn đặt hàng theo userId
router.get('/getbyuserid/:userId', async (req, res) => {
    try {
        const orders = await WeddingOrder.findById(req.params.userId).populate('userId').populate('planId');
        if (!orders) {
            return res.status(404).json({ status: false, message: 'Wedding order not found' });
        }
        res.status(200).json({ status: true, message: "lấy danh sách theo Userid thành công", data: orders });
    } catch (error) {
        res.status(500).json({ status: false, message: 'lấy danh sách theo Userid thất bại' });
    }
});



//cập nhật trạng thái đơn hàng
router.put('/:id', async (req, res) => {
    const { totalPrice, location, eventDate } = req.body;

    try {
        const updatedOrder = await WeddingOrder.findByIdAndUpdate(req.params.id, { totalPrice, location, eventDate }, { new: true });
        if (!updatedOrder) return res.status(404).json({ status: false, message: 'Wedding order not found.' });
        res.status(200).json({ status: true, message: "cập nhật trạng thái thành công", data: updatedOrder });
    } catch (error) {
        res.status(400).json({ status: false, message: 'Error updating wedding order.' });
    }
});

//xoá đơn hàng
router.delete('/:id', async (req, res) => {
    try {
        const deletedOrder = await WeddingOrder.findByIdAndDelete(req.params.id);
        if (!deletedOrder) return res.status(404).json({ status: false, message: 'Wedding order not found.' });
        res.status(200).json({ status: true, message: 'Wedding order deleted successfully.' });
    } catch (error) {
        res.status(400).json({ status: false, message: 'Error deleting wedding order.' });
    }
});

module.exports = router;
