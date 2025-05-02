const express = require('express');
const router = express.Router();
const Catering = require('../models/cateringModel');

//tạo catering
router.post('/add', async (req, res) => {
    const { name, price, cate_cateringId, description, imageUrl } = req.body;
    const catering = new Catering({ name, price, cate_cateringId, description, imageUrl });
    try {
        await catering.save();
        return res.status(200).json({ status: true, message: "Thêm dịch vụ catering thành công", data: catering });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: "Lỗi khi thêm dịch vụ catering", error: error });
    }
});

//lấy danh sách catering
router.get('/all', async (req, res) => {
    try {
        const catering = await Catering.find().populate('cate_cateringId', 'name');
        return res.status(200).json({ status: true, message: "Lấy danh sách tất cả dịch vụ catering thành công", data: catering });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: "Lỗi khi lấy danh sách tất cả dịch vụ catering", error: error });
    }
});



//cập nhật catering
router.put('/update/:id', async (req, res) => {
    const { name, price, cate_cateringId, Description, imageUrl } = req.body;
    try {
        const catering = await Catering.findByIdAndUpdate(req.params.id, { name, price, cate_cateringId, Description, imageUrl }, { new: true });
        if (!catering) {
            return res.status(404).json({ status: false, message: "Không tìm thấy dịch vụ catering" });
        }
        return res.status(200).json({ status: true, message: "Cập nhật dịch vụ catering thành công", data: catering });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: "Lỗi khi cập nhật dịch vụ catering", error: error });
    }
});

//xóa dịch vụ catering
router.delete('/delete/:id', async (req, res) => {
    try {
        const catering = await Catering.findByIdAndDelete(req.params.id);
        if (!catering) {
            return res.status(404).json({ status: false, message: "Không tìm thấy dịch vụ catering" });
        }
        return res.status(200).json({ status: true, message: "Xóa thành công", data: catering });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: "Lỗi khi xóa dịch vụ catering", error: error });
    }
});

router.get("/caterings/:cateringId", async function (req, res) {
    try {
        var list = await Catering.find({ cate_cateringId: req.params.cateringId });
        res.status(200).json({ status: true, data: list });
    } catch (err) {
        res.status(400).json({ status: false, message: "Thất Bại" });
    }
});


router.get("/:Id", async function (req, res) {
    try {
        var list = await Catering.find({ _id: req.params.Id });
        res.status(200).json({ status: true, data: list });
    } catch (err) {
        res.status(400).json({ status: false, message: "Thất Bại" });
    }
});

router.get('/cate_catering/:cateId', async (req, res) => {
    try {
        const cateId = req.params.cateId;
        const caterings = await Catering.find({ cate_cateringId: cateId }).populate('cate_cateringId');
        res.json(caterings);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router;

