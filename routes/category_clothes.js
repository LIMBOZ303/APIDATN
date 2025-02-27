const express = require('express');
const router = express.Router();
const Category_clothes = require('../models/category_ClothesModel');

router.post('/add', async (req, res) => {
    const { name } = req.body;
    const category_clothes = new Category_clothes({ name });
    try {
        await category_clothes.save();
        res.status(201).json({ status: true, message: "Thêm loại thành công", data: category_clothes });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Lỗi khi thêm loại" });
    }
});

router.get('/all', async (req, res) => {
    try {
        const cateclothesEntries = await Category_clothes.find();
        res.status(200).json({ status: true, message:"lấy danh sách thành công", data: cateclothesEntries });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Thất Bại" });
    }
});

//cập nhật
router.put('/update/:id', async (req, res) => {
    const { name } = req.body;
    try {
        const updateCateclothes = await Category_clothes.findByIdAndUpdate(req.params.id, { name }, { new: true });
        if (!updateCateclothes) {
            return res.status(404).send("Không tìm thấy áo");
        }
        res.status(200).json({status:true, message:"done", data: updateCateclothes});
    } catch (error) {
        console.log(error);
        res.status(500).json({status:false, message:"False"});
    }
});

module.exports = router;