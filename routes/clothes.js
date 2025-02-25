const express = require('express');
const router = express.Router();
const Clothes = require('../models/clothesModel');

//thêm áo
router.post('/add', async (req, res) => {
    const { name, price, Category_ClothesId, gender, Silhouette, fabrics, color, neckline, sleeve, imageUrl } = req.body;
    const clothes = new Clothes({ name, price, Category_ClothesId, gender, Silhouette, fabrics, color, neckline, sleeve, imageUrl });
    try {
        await clothes.save();
        res.status(201).json({ status: true, message: "Thêm áo thành công", data: clothes });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Lỗi khi thêm áo" });
    }
});


//lấy tất cả áo
router.get('/all', async (req, res) => {
    try {
        const clothesEntries = await Clothes.find().populate('Category_ClothesId', 'name');
        res.status(200).json({ status: true, message:"lấy danh sách thành công", data: clothesEntries });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Thất Bại" });
    }
});

//lấy áo theo id
router.get('/get/:id', async (req, res) => {

    try {
        var list = await Clothes.find({ _id: req.params.id });
        res.status(200).json({ status: true, message: "thành công", data: list });

    } catch (err) {
        res.status(400).json({ status: false, message: "Thất Bại" });
    }
});

//cập nhật áo
router.put('/update/:id', async (req, res) => {
    const { name, price, Category_ClothesId, gender, Silhouette, fabrics, color, neckline, sleeve, imageUrl } = req.body;
    try {
        const updateclothes = await Clothes.findByIdAndUpdate(req.params.id, { name, price, Category_ClothesId, gender, Silhouette, fabrics, color, neckline, sleeve, imageUrl }, { new: true });
        if (!updateclothes) {
            return res.status(404).send("Không tìm thấy áo");
        }
        res.status(200).send("Cập nhật áo thành công");
    } catch (error) {
        console.log(error);
        res.status(500).send("Lỗi khi cập nhật áo");
    }
});

//xóa áo
router.delete('/delete/:id', async (req, res) => {
    try {
        const deleteclothes = await Clothes.findByIdAndDelete(req.params.id);
        if (!deleteclothes) {
            return res.status(404).send("Không tìm thấy áo");
        }
        res.status(200).send("Xóa áo thành công");
    } catch (error) {
        console.log(error);
        res.status(500).send("Lỗi khi xóa áo");
    }
});


module.exports = router;
