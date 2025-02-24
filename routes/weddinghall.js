const express = require('express');
const router = express.Router();
const WeddingHall = require('../models/hallModel');


//thêm hội trường
router.post('/add', async (req, res) => {
    const { name, soluongkhach, location, sanh, dateevent, imageUrl } = req.body;
    const weddinghall = new WeddingHall({ name, soluongkhach, location, sanh, dateevent, imageUrl });
    try {
        await weddinghall.save();
        return res.status(200).json({ message: "Thêm hội trường thành công", data: weddinghall });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Lỗi khi thêm hội trường" });
    }
});

// Lấy tất cả Wedding Halls (GET)
router.get('/all', async (req, res) => {
    try {
        const weddingHalls = await WeddingHall.find();
        return res.status(200).json({status: true, data: weddingHalls });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Thất Bại" });
    }
});

// Lấy Wedding Hall theo ID (GET)
router.get('/:id', async (req, res) => {
    try {
        const weddingHall = await WeddingHall.findById(req.params.id);
        if (!weddingHall) return res.status(404).json({ error: 'Wedding hall not found' });
        return res.status(200).json(weddingHall);
    } catch (error) {
        return res.status(500).json({ error: 'Error fetching wedding hall' });
    }
});

// Cập nhật Wedding Hall (PUT)
router.put('/:id', async (req, res) => {
    const { name, soLuongKhach, location, sanh, dateEvent, imageUrl } = req.body;

    try {
        const updatedWeddingHall = await WeddingHall.findByIdAndUpdate(
            req.params.id,
            { name, soLuongKhach, location, sanh, dateEvent, imageUrl },
            { new: true }
        );
        if (!updatedWeddingHall) return res.status(404).json({ error: 'Wedding hall not found' });
        return res.status(200).json(updatedWeddingHall);
    } catch (error) {
        console.error('Error updating wedding hall:', error);
        return res.status(400).json({ error: 'Error updating wedding hall' });
    }
});

// Xóa Wedding Hall (DELETE)
router.delete('/:id', async (req, res) => {
    try {
        const deletedWeddingHall = await WeddingHall.findByIdAndDelete(req.params.id);
        if (!deletedWeddingHall) return res.status(404).json({ error: 'Wedding hall not found' });
        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ error: 'Error deleting wedding hall' });
    }
});


module.exports = router;
