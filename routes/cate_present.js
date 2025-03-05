const express = require('express');
const router = express.Router();
const Cate_present = require('../models/Cate/Cate_present');  // Đảm bảo đường dẫn đúng

// Thêm một danh mục quà tặng mới
router.post('/add', async (req, res) => {
    const { name } = req.body;
    const cate_present = new Cate_present({ name });
    try {
        await cate_present.save();
        res.status(201).json({ status: true, message: "Thêm danh mục quà tặng thành công", data: cate_present });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Lỗi khi thêm danh mục quà tặng" });
    }
});

// Lấy tất cả danh mục quà tặng
router.get('/all', async (req, res) => {
    try {
        const catePresentEntries = await Cate_present.find();
        res.status(200).json({ status: true, message: "Lấy danh sách thành công", data: catePresentEntries });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Thất bại khi lấy danh sách quà tặng" });
    }
});

// Cập nhật danh mục quà tặng theo ID
router.put('/update/:id', async (req, res) => {
    const { name } = req.body;
    try {
        const updateCatePresent = await Cate_present.findByIdAndUpdate(req.params.id, { name }, { new: true });
        if (!updateCatePresent) {
            return res.status(404).send("Không tìm thấy danh mục quà tặng");
        }
        res.status(200).json({ status: true, message: "Cập nhật thành công", data: updateCatePresent });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Lỗi khi cập nhật danh mục quà tặng" });
    }
});

// Xóa danh mục quà tặng theo ID
router.delete('/delete/:id', async (req, res) => {
    try {
        const deleteCatePresent = await Cate_present.findByIdAndDelete(req.params.id);
        if (!deleteCatePresent) {
            return res.status(404).json({ status: false, message: "Danh mục quà tặng không tồn tại" });
        }
        res.status(200).json({ status: true, message: "Xóa thành công", data: deleteCatePresent });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Lỗi khi xóa danh mục quà tặng" });
    }
});



module.exports = router;
