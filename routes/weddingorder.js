const express = require('express');
const router = express.Router();
const WeddingOrder = require('../models/weddingordermodel');

//tạo đơn
router.post('/create', async (req, res) => {
    const { userId, planId, totalPrice, location, eventDate } = req.body;
    const newWeddingOrder = new WeddingOrder({ userId, planId, totalPrice, location, eventDate });
    try {
        await newWeddingOrder.save();
        res.status(201).send({message: 'Wedding order created successfully'});
    } catch (error) {
        console.error('Error creating wedding order', error);
        res.status(400).send({error: 'Error creating wedding order'});
    }
});

//lấy danh sách tất cả đơn đặt hàng
router.get('/getall', async (req, res) => {
    try {
        const orders = await WeddingOrder.find().populate('userId').populate('planId');
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).send('Error getting wedding orders');
    }
});

//lấy danh sách đơn đặt hàng theo userId
router.get('/getbyuserid/:userId', async (req, res) => {
    try {
        const orders = await WeddingOrder.findById(req.params.userId).populate('userId').populate('planId');
        if (!orders) {
            return res.status(404).send({error: 'Wedding order not found'});
        }
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).send({error: 'Error getting wedding orders'});
    }
});



//cập nhật trạng thái đơn hàng
router.put('/:id', async (req, res) => {
    const { totalPrice, location, eventDate } = req.body;

    try {
        const updatedOrder = await WeddingOrder.findByIdAndUpdate(req.params.id, { totalPrice, location, eventDate }, { new: true });
        if (!updatedOrder) return res.status(404).send({ error: 'Wedding order not found.' });
        res.status(200).send(updatedOrder);
    } catch (error) {
        res.status(400).send({ error: 'Error updating wedding order.' });
    }
});

//xoá đơn hàng
router.delete('/:id', async (req, res) => {
    try {
        const deletedOrder = await WeddingOrder.findByIdAndDelete(req.params.id);
        if (!deletedOrder) return res.status(404).send({ error: 'Wedding order not found.' });
        res.status(200).send({ message: 'Wedding order deleted successfully.' });
    } catch (error) {
        res.status(400).send({ error: 'Error deleting wedding order.' });
    }
});

module.exports = router;
