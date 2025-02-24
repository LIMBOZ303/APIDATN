const express = require('express');
const router = express.Router();
const Flower = require('../models/flowerModel');


//thêm hoa
router.post('/add', async (req, res) => {
    const { name, price, description, status, imageUrl } = req.body;
    const flower = new Flower({ name, price, description, status, imageUrl });
    try {
        await flower.save();
        return res.status(200).json({status:true, message: "Thêm hoa thành công", data: flower });
    } catch (error) {
        console.log(error);
        return res.status(500).json({status:false, message: "Lỗi khi thêm hoa", error: error });
    }
});

//lấy danh sách tất cả hoa
router.get('/all', async (req, res) => {
    try {
        const flowers = await Flower.find();
        return res.status(200).json({status:true, message: "Lấy danh sách tất cả hoa thành công", data: flowers });
    } catch (error) {
        console.log(error);
        return res.status(500).json({status:false, message: "Lỗi khi lấy danh sách tất cả hoa", error: error });
    }
});

//lấy hoa theo id
router.get('/getbyid/:id', async (req, res) => {
    try {
        const flower = await Flower.findById(req.params.id);
        if (!flower) {
            return res.status(404).json({status:false, message: "Không tìm thấy hoa" });
        }
        return res.status(200).json({status:true, message: "Lấy hoa theo id thành công", data: flower });
    } catch (error) {
        console.log(error);
        return res.status(500).json({status:false, message: "Lỗi khi lấy hoa theo id", error: error });
    }
});

//cập nhật hoa
router.put('/update/:id', async (req, res) => {
    const { name, price, description, status, imageUrl } = req.body;
    try {
        const flower = await Flower.findByIdAndUpdate(req.params.id, { name, price, description, status, imageUrl }, { new: true });
        if (!flower) {
            return res.status(404).json({status:false, message: "Không tìm thấy hoa" });
        }
        return res.status(200).json({ status:true,message: "Cập nhật hoa thành công", data: flower });
    } catch (error) {
        console.log(error);
        return res.status(500).json({status:false, message: "Lỗi khi cập nhật hoa", error: error });
    }
});

//xóa hoa
router.delete('/delete/:id', async (req, res) => {
    try {
        const flower = await Flower.findByIdAndDelete(req.params.id);
        if (!flower) {
            return res.status(404).json({status:false, message: "Không tìm thấy hoa" });
        }
        return res.status(200).json({status:true, message: "Xóa hoa thành công", data: flower });
    } catch (error) {
        console.log(error);
        return res.status(500).json({status:false, message: "Lỗi khi xóa hoa", error: error });
    }
});
module.exports = router;
