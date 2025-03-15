const express = require('express');
const router = express.Router();
const Present = require('../models/presentModel');  // Đảm bảo đường dẫn đúng
const Cate_present = require('../models/Cate/Cate_present');  // Để tham chiếu Cate_present

// Thêm một sản phẩm quà tặng mới
router.post('/add', async (req, res) => {
    const { name, price, Cate_presentId, Description, Status, imageUrl } = req.body;

    // Kiểm tra xem Cate_presentId có hợp lệ không
    const cate_present = await Cate_present.findById(Cate_presentId);
    if (!cate_present) {
        return res.status(400).json({ status: false, message: "Danh mục quà tặng không hợp lệ" });
    }

    const present = new Present({
        name,
        price,
        Cate_presentId,
        Description,
        Status,
        imageUrl
    });

    try {
        await present.save();
        res.status(201).json({ status: true, message: "Thêm sản phẩm quà tặng thành công", data: present });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Lỗi khi thêm sản phẩm quà tặng" });
    }
});

// Lấy tất cả sản phẩm quà tặng
router.get('/all', async (req, res) => {
    try {
        const presents = await Present.find().populate('Cate_presentId', 'name');
        res.status(200).json({ status: true, message: "Lấy danh sách sản phẩm quà tặng thành công", data: presents });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Thất bại khi lấy danh sách sản phẩm quà tặng" });
    }
});

// Lấy sản phẩm quà tặng theo ID
router.get('/:id', async (req, res) => {
    try {
        const present = await Present.findById(req.params.id).populate('Cate_presentId', 'name');
        if (!present) {
            return res.status(404).json({ status: false, message: "Không tìm thấy sản phẩm quà tặng" });
        }
        res.status(200).json({ status: true, message: "Lấy sản phẩm quà tặng thành công", data: present });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Lỗi khi lấy sản phẩm quà tặng" });
    }
});

// Cập nhật sản phẩm quà tặng theo ID
router.put('/update/:id', async (req, res) => {
    const { name, price, Cate_presentId, Description, Status, imageUrl } = req.body;

    try {
        // Kiểm tra xem Cate_presentId có hợp lệ không
        const cate_present = await Cate_present.findById(Cate_presentId);
        if (!cate_present) {
            return res.status(400).json({ status: false, message: "Danh mục quà tặng không hợp lệ" });
        }

        const updatedPresent = await Present.findByIdAndUpdate(
            req.params.id,
            { name, price, Cate_presentId, Description, Status, imageUrl },
            { new: true }
        );
        if (!updatedPresent) {
            return res.status(404).send("Sản phẩm quà tặng không tồn tại");
        }

        res.status(200).json({ status: true, message: "Cập nhật sản phẩm quà tặng thành công", data: updatedPresent });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Lỗi khi cập nhật sản phẩm quà tặng" });
    }
});

// Xóa sản phẩm quà tặng theo ID
router.delete('/delete/:id', async (req, res) => {
    try {
        const deletedPresent = await Present.findByIdAndDelete(req.params.id);
        if (!deletedPresent) {
            return res.status(404).json({ status: false, message: "Sản phẩm quà tặng không tồn tại" });
        }
        res.status(200).json({ status: true, message: "Xóa sản phẩm quà tặng thành công", data: deletedPresent });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Lỗi khi xóa sản phẩm quà tặng" });
    }
});
router.get("/presents/:presentId", async function (req, res) {
    try {
        var list = await Present.find({ Cate_presentId: req.params.presentId });
        res.status(200).json({ status: true, data: list });
    } catch (err) {
        res.status(400).json({ status: false, message: "Thất Bại" });
    }
});

router.get("/:Id",  async function (req, res) {
    try {
        var list = await Present.find({ _id: req.params.Id });
        res.status(200).json({ status: true, data: list });
    } catch (err) {
        res.status(400).json({ status: false, message: "Thất Bại" });
    }
});

module.exports = router;
