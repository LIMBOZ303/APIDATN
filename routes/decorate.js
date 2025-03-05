const express = require('express');
const router = express.Router();
const Decorate = require('../models/decorateModel');  // Đảm bảo đường dẫn đúng
const Cate_decorate = require('../models/Cate/Cate_decorate');  // Để tham chiếu Cate_decorate

// Thêm một sản phẩm trang trí mới
router.post('/add', async (req, res) => {
    const { name, price, Cate_decorateId, Description, Status, imageUrl } = req.body;

    // Kiểm tra xem Cate_decorateId có hợp lệ không
    const cate_decorate = await Cate_decorate.findById(Cate_decorateId);
    if (!cate_decorate) {
        return res.status(400).json({ status: false, message: "Danh mục trang trí không hợp lệ" });
    }

    const decorate = new Decorate({
        name,
        price,
        Cate_decorateId,
        Description,
        Status,
        imageUrl
    });

    try {
        await decorate.save();
        res.status(201).json({ status: true, message: "Thêm sản phẩm trang trí thành công", data: decorate });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Lỗi khi thêm sản phẩm trang trí" });
    }
});

// Lấy tất cả sản phẩm trang trí
router.get('/all', async (req, res) => {
    try {
        const decorations = await Decorate.find().populate('Cate_decorateId', 'name');
        res.status(200).json({ status: true, message: "Lấy danh sách sản phẩm trang trí thành công", data: decorations });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Thất bại khi lấy danh sách sản phẩm trang trí" });
    }
});

// Lấy sản phẩm trang trí theo ID
router.get('/:id', async (req, res) => {
    try {
        const decorate = await Decorate.findById(req.params.id).populate('Cate_decorateId', 'name');
        if (!decorate) {
            return res.status(404).json({ status: false, message: "Không tìm thấy sản phẩm trang trí" });
        }
        res.status(200).json({ status: true, message: "Lấy sản phẩm trang trí thành công", data: decorate });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Lỗi khi lấy sản phẩm trang trí" });
    }
});

// Cập nhật sản phẩm trang trí theo ID
router.put('/update/:id', async (req, res) => {
    const { name, price, Cate_decorateId, Description, Status, imageUrl } = req.body;

    try {
        // Kiểm tra xem Cate_decorateId có hợp lệ không
        const cate_decorate = await Cate_decorate.findById(Cate_decorateId);
        if (!cate_decorate) {
            return res.status(400).json({ status: false, message: "Danh mục trang trí không hợp lệ" });
        }

        const updatedDecorate = await Decorate.findByIdAndUpdate(
            req.params.id,
            { name, price, Cate_decorateId, Description, Status, imageUrl },
            { new: true }
        );
        if (!updatedDecorate) {
            return res.status(404).send("Sản phẩm trang trí không tồn tại");
        }

        res.status(200).json({ status: true, message: "Cập nhật sản phẩm trang trí thành công", data: updatedDecorate });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Lỗi khi cập nhật sản phẩm trang trí" });
    }
});

// Xóa sản phẩm trang trí theo ID
router.delete('/delete/:id', async (req, res) => {
    try {
        const deletedDecorate = await Decorate.findByIdAndDelete(req.params.id);
        if (!deletedDecorate) {
            return res.status(404).json({ status: false, message: "Sản phẩm trang trí không tồn tại" });
        }
        res.status(200).json({ status: true, message: "Xóa sản phẩm trang trí thành công", data: deletedDecorate });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Lỗi khi xóa sản phẩm trang trí" });
    }
});

router.get("/decorates/:cateId", async function (req, res) {
    try {
        var list = await Decorate.find({ Cate_decorateId: req.params.cateId });
        res.status(200).json({ status: true, data: list });
    } catch (err) {
        res.status(400).json({ status: false, message: "Thất Bại" });
    }
});

module.exports = router;
