const express = require('express');
const router = express.Router();
const Catering = require('../models/cateringModel');

//tạo dịch vụ catering
router.post('/add', async (req, res) => {
    const { name, price, cate_cateringId, description, imageUrl } = req.body;
    const catering = new Catering({ name, price, cate_cateringId, description, imageUrl });
    try {
        await catering.save();
        return res.status(200).json({status: true, message: "Thêm dịch vụ catering thành công", data: catering });
    } catch (error) {
        console.log(error);
        return res.status(500).json({status: false, message: "Lỗi khi thêm dịch vụ catering", error: error });
    }
});

//lấy danh sách tất cả dịch vụ catering
router.get('/all', async (req, res) => {
    try {
        const catering = await Catering.find().populate('cate_cateringId', 'name');
        return res.status(200).json({status:true, message: "Lấy danh sách tất cả dịch vụ catering thành công", data: catering });
    } catch (error) {
        console.log(error);
        return res.status(500).json({status:false, message: "Lỗi khi lấy danh sách tất cả dịch vụ catering", error: error });
    }
});

//lấy dịch vụ catering theo id
router.get('/getbyid/:id', async (req, res) => {
    try {
        const catering = await Catering.findById(req.params.id);
        if (!catering) {
            return res.status(404).json({status:false, message: "Không tìm thấy dịch vụ catering" });
        }
        return res.status(200).json({status:true, message: "Lấy dịch vụ catering theo id thành công", data: catering });
    } catch (error) {
        console.log(error);
        return res.status(500).json({status:false, message: "Lỗi khi lấy dịch vụ catering theo id", error: error });
    }
});

//cập nhật dịch vụ catering
router.put('/update/:id', async (req, res) => {
    const { name, price, cate_cateringId, description, imageUrl } = req.body;
    try {
        const catering = await Catering.findByIdAndUpdate(req.params.id, { name, price, cate_cateringId, description, imageUrl }, { new: true });
        if (!catering) {
            return res.status(404).json({status: false, message: "Không tìm thấy dịch vụ catering" });
        }
        return res.status(200).json({status: true, message: "Cập nhật dịch vụ catering thành công", data: catering });
    } catch (error) {
        console.log(error);
        return res.status(500).json({status: false, message: "Lỗi khi cập nhật dịch vụ catering", error: error });
    }
});

//xóa dịch vụ catering
router.delete('/delete/:id', async (req, res) => {
    try {
        const catering = await Catering.findByIdAndDelete(req.params.id);
        if (!catering) {
            return res.status(404).json({status:false, message: "Không tìm thấy dịch vụ catering" });
        }
        return res.status(200).json({status:true, message: "Xóa thành công", data: catering });
    } catch (error) {
        console.log(error);
        return res.status(500).json({status:false, message: "Lỗi khi xóa dịch vụ catering", error: error });
    }
});

module.exports = router;

