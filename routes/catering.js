const express = require('express');
const router = express.Router();
const Catering = require('../models/clothesModel');

//tạo dịch vụ catering
router.post('/add', async (req, res) => {
    const { name, price, type, category, description, imageUrl } = req.body;
    const catering = new Catering({ name, price, type, category, description, imageUrl });
    try {
        await catering.save();
        return res.status(200).json({ message: "Thêm dịch vụ catering thành công", data: catering });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Lỗi khi thêm dịch vụ catering", error: error });
    }
});

//lấy danh sách tất cả dịch vụ catering
router.get('/getall', async (req, res) => {
    try {
        const catering = await Catering.find();
        return res.status(200).json({ message: "Lấy danh sách tất cả dịch vụ catering thành công", data: catering });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Lỗi khi lấy danh sách tất cả dịch vụ catering", error: error });
    }
});

//lấy dịch vụ catering theo id
router.get('/getbyid/:id', async (req, res) => {
    try {
        const catering = await Catering.findById(req.params.id);
        if (!catering) {
            return res.status(404).json({ message: "Không tìm thấy dịch vụ catering" });
        }
        return res.status(200).json({ message: "Lấy dịch vụ catering theo id thành công", data: catering });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Lỗi khi lấy dịch vụ catering theo id", error: error });
    }
});

//cập nhật dịch vụ catering
router.put('/update/:id', async (req, res) => {
    const { name, price, type, category, description, imageUrl } = req.body;
    try {
        const catering = await Catering.findByIdAndUpdate(req.params.id, { name, price, type, category, description, imageUrl }, { new: true });
        if (!catering) {
            return res.status(404).json({ message: "Không tìm thấy dịch vụ catering" });
        }
        return res.status(200).json({ message: "Cập nhật dịch vụ catering thành công", data: catering });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Lỗi khi cập nhật dịch vụ catering", error: error });
    }
});

//xóa dịch vụ catering
router.delete('/delete/:id', async (req, res) => {
    try {
        const catering = await Catering.findByIdAndDelete(req.params.id);
        if (!catering) {
            return res.status(404).json({ message: "Không tìm thấy dịch vụ catering" });
        }
        return res.status(200).json({ message: "Xóa dịch vụ catering thành công", data: catering });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Lỗi khi xóa dịch vụ catering", error: error });
    }
});

module.exports = router;

