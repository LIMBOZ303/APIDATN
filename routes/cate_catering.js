const express = require('express');
const router = express.Router();
const Cate_catering = require('../models/cate_cateringModel');

router.post('/add', async (req, res) => {
    const { name } = req.body;
    const cate_catering = new Cate_catering({ name });
    try {
        await cate_catering.save();
        res.status(201).json({ status: true, message: "Thêm loại thành công", data: cate_catering });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Lỗi khi thêm loại" });
    }
});

router.get('/all', async (req, res) => {
    try {
        const catecCateringEntries = await Cate_catering.find();
        res.status(200).json({ status: true, message:"lấy danh sách thành công", data: catecCateringEntries });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Thất Bại" });
    }
});

//cập nhật
router.put('/update/:id', async (req, res) => {
    const { name } = req.body;
    try {
        const updateCate_catering = await Cate_catering.findByIdAndUpdate(req.params.id, { name }, { new: true });
        if (!updateCate_catering) {
            return res.status(404).send("Không tìm thấy");
        }
        res.status(200).json({status:true, message:"done", data: updateCate_catering});
    } catch (error) {
        console.log(error);
        res.status(500).json({status:false, message:"False"});
    }
});

module.exports = router;