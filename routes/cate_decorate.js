const express = require('express');
const router = express.Router();
const Cate_decorate = require('../models/Cate/Cate_decorate');  // Đảm bảo đường dẫn đúng

// Thêm một danh mục mới
router.post('/add', async (req, res) => {
    const { name } = req.body;
    const cate_decorate = new Cate_decorate({ name });
    try {
        await cate_decorate.save();
        res.status(201).json({ status: true, message: "Thêm danh mục thành công", data: cate_decorate });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Lỗi khi thêm danh mục" });
    }
});

// Lấy tất cả danh mục
router.get('/all', async (req, res) => {
    try {
        const cateDecorateEntries = await Cate_decorate.find();
        res.status(200).json({ status: true, message: "Lấy danh sách thành công", data: cateDecorateEntries });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Thất bại khi lấy danh sách" });
    }
});

// Cập nhật danh mục theo ID
router.put('/update/:id', async (req, res) => {
    const { name } = req.body;
    try {
        const updateCateDecorate = await Cate_decorate.findByIdAndUpdate(req.params.id, { name }, { new: true });
        if (!updateCateDecorate) {
            return res.status(404).send("Không tìm thấy danh mục");
        }
        res.status(200).json({ status: true, message: "Cập nhật thành công", data: updateCateDecorate });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Lỗi khi cập nhật danh mục" });
    }
});

// Xóa danh mục theo ID
router.delete('/delete/:id', async (req, res) => {
    try {
        const deleteCateDecorate = await Cate_decorate.findByIdAndDelete(req.params.id);
        if (!deleteCateDecorate) {
            return res.status(404).json({ status: false, message: "Danh mục không tồn tại" });
        }
        res.status(200).json({ status: true, message: "Xóa thành công", data: deleteCateDecorate });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Lỗi khi xóa danh mục" });
    }
});

module.exports = router;
