const express = require('express');
const router = express.Router();
const Invitation = require('../models/invitationModel');

//tạo lời mời
router.post('/add', async (req, res) => {
    const { name, style, price, status, description, imageUrl } = req.body;
    const invitation = new Invitation({ name, style, price, status, description, imageUrl });
    try {
        await invitation.save();
        return res.status(201).json({message: "Thêm lời mời thành công",
            data: invitation
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: "Lỗi khi thêm lời mời"});
    }
});

//lấy tất cả lời mời
router.get('/getall', async (req, res) => {
    try {
        const invitations = await Invitation.find();
        return res.status(200).json({message: "Lấy tất cả lời mời thành công"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: "Lỗi khi lấy tất cả lời mời"});
    }
});

//lấy lời mời theo id
router.get('/get/:id', async (req, res) => {
    try {
        const invitation = await Invitation.findById(req.params.id);
        if (!invitation) {
            return res.status(404).json({error: "Không tìm thấy lời mời"});
        }
        return res.status(200).json({message: "Lấy lời mời thành công",});
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: "Lỗi khi lấy lời mời theo id"});
    }
});

//cập nhật lời mời
router.put('/update/:id', async (req, res) => {
    const { name, style, price, status, description, imageUrl } = req.body;
    try {
        const updateinvitation = await Invitation.findByIdAndUpdate(req.params.id, { name, style, price, status, description, imageUrl }, {new: true});
        if (!updateinvitation) {
            return res.status(404).json(updateinvitation);
        }
        return res.status(200).json({message: "Cập nhật lời mời thành công",});
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: "Lỗi khi cập nhật lời mời"});
    }
});

//xóa lời mời
router.delete('/delete/:id', async (req, res) => {
    try {
        const deleteinvitation = await Invitation.findByIdAndDelete(req.params.id);
        if (!deleteinvitation) {
            return res.status(404).json({error: "Không tìm thấy lời mời"});
        }
        return res.status(200).json({message: "Xóa lời mời thành công",});
    } catch (error) {
        console.log(error);
    }
});



module.exports = router;
