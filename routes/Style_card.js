const express = require('express');
const router = express.Router();
const Style_card = require('../models/style_card');

router.post('/add', async (req, res) => {
    const { name } = req.body;
    const style_card = new Style_card({ name });
    try {
        await style_card.save();
        res.status(201).json({ status: true, message: "Thêm loại thành công", data: style_card });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Lỗi khi thêm loại" });
    }
});

router.get('/all', async (req, res) => {
    try {
        const style_card = await Style_card.find();
        res.status(200).json({ status: true, message:"lấy danh sách thành công", data: style_card });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Thất Bại" });
    }
});

router.put('/update/:id', async (req, res) => {
    const { name } = req.body;
    try {
        const updateStylecard = await Style_card.findByIdAndUpdate(req.params.id, { name }, { new: true });
        if (!updateStylecard) {
            return res.status(404).send("Không tìm thấy áo");
        }
        res.status(200).json({status:true, message:"done", data: updateStylecard});
    } catch (error) {
        console.log(error);
        res.status(500).json({status:false, message:"False"});
    }
});

module.exports = router;
