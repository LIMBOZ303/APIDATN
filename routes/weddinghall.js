const express = require('express');
const router = express.Router();
const WeddingHall = require('../models/hallModel');


//thêm hội trường
router.post('/add', async (req, res) => {
    const { name, location, sanh, imageUrl } = req.body;
    const weddinghall = new WeddingHall({ name, location, sanh, imageUrl });
    try {
        await weddinghall.save();
        return res.status(200).json({status:true, message: "Thêm hội trường thành công", data: weddinghall });
    } catch (error) {
        console.log(error);
        return res.status(500).json({status: false, message: "Lỗi khi thêm hội trường" });
    }
});

// Lấy tất cả Wedding Halls (GET)
router.get('/all', async (req, res) => {
    try {
        const weddingHalls = await WeddingHall.find();
        return res.status(200).json({ status: true, message: "Thành công", data: weddingHalls });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Thất Bại" });
    }
});

// Lấy Wedding Hall theo ID (GET)
router.get('/:id', async (req, res) => {
    try {
        const weddingHall = await WeddingHall.findById(req.params.id);
        if (!weddingHall) return res.status(404).json({ error: 'Wedding hall not found' });
        return res.status(200).json({ status: true, message: "done", data: weddingHall });
    } catch (error) {
        return res.status(500).json({status:false, message: 'Error fetching wedding hall' });
    }
});

// Cập nhật Wedding Hall (PUT)
router.put('/:id', async (req, res) => {
    const { name, location, sanh, imageUrl } = req.body;

    try {
        const updatedWeddingHall = await WeddingHall.findByIdAndUpdate(
            req.params.id,
            { name, location, sanh, imageUrl },
            { new: true }
        );
        if (!updatedWeddingHall) return res.status(404).json({ error: 'Wedding hall not found' });
        return res.status(200).json({status:true, message:'update done', data: updatedWeddingHall});
    } catch (error) {
        return res.status(400).json({status:false, message:'false'});
    }
});

// Xóa Wedding Hall (DELETE)
router.delete('/:id', async (req, res) => {
    try {
        const deletedWeddingHall = await WeddingHall.findByIdAndDelete(req.params.id);
        if (!deletedWeddingHall) return res.status(404).json({ error: 'Wedding hall not found' });
        return res.status(204).json({status:true, message:' delete done'});
    } catch (error) {
        return res.status(500).json({ status: false, message:'false' });
    }
});


module.exports = router;
