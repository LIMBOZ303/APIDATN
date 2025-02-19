const express = require('express');
const router = express.Router();
const Clothes = require('../models/clothesModel');

//thêm áo
router.post('/add', async (req, res) => {
    const { name, price, category, gender, description, imageUrl } = req.body;
    const clothes = new Clothes({ name, price, category, gender, description, imageUrl });
    try {
        await clothes.save();
        res.status(201).send("Thêm áo thành công");
    } catch (error) {
        console.log(error);
        res.status(500).send("Lỗi khi thêm áo");
    }
});

//lấy tất cả áo
router.get('/all', async (req, res) => {
    try {
        const clothesEntries = await Clothes.find();
        res.status(200).send(clothesEntries);
    } catch (error) {
        console.log(error);
        res.status(500).send("Lỗi khi lấy tất cả áo");
    }
});

//lấy áo theo id
router.get('/get/:id', async (req, res) => {
    try {
        const clothesEntry = await Clothes.findById(req.params.id);
        if (!clothesEntry) {
            return res.status(404).send("Không tìm thấy áo");
        }
        res.status(200).send(clothesEntry);
    } catch (error) {
        console.log(error);
        res.status(500).send("Lỗi khi lấy áo theo id");
    }
});

//cập nhật áo
router.put('/update/:id', async (req, res) => {
    const { name, price, category, gender, description, imageUrl } = req.body;
    try {
        const updateclothes = await Clothes.findByIdAndUpdate(req.params.id, { name, price, category, gender, description, imageUrl }, { new: true });
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
