const express = require('express');
const router = express.Router();
const Lobby = require('../models/Sanh');

// Thêm một phòng mới
router.post('/add', async (req, res) => {
    const { name, price, SoLuongKhach, imageUrl } = req.body;

    const lobby = new Lobby({
        name,
        price,
        SoLuongKhach,
        imageUrl
    });

    try {
        await lobby.save();
        res.status(201).json({ status: true, message: "Thêm phòng thành công", data: lobby });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Lỗi khi thêm phòng" });
    }
});

// Lấy tất cả phòng
router.get('/all', async (req, res) => {
    try {
        const lobbies = await Lobby.find();
        res.status(200).json({ status: true, message: "Lấy danh sách phòng thành công", data: lobbies });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Thất bại khi lấy danh sách phòng" });
    }
});

// Lấy phòng theo ID
router.get('/:id', async (req, res) => {
    try {
        const lobby = await Lobby.findById(req.params.id);
        if (!lobby) {
            return res.status(404).json({ status: false, message: "Không tìm thấy phòng" });
        }
        res.status(200).json({ status: true, message: "Lấy phòng thành công", data: lobby });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Lỗi khi lấy phòng" });
    }
});

// Cập nhật phòng theo ID
router.put('/update/:id', async (req, res) => {
    const { name, price, SoLuongKhach, imageUrl } = req.body;

    try {
        const updatedLobby = await Lobby.findByIdAndUpdate(
            req.params.id,
            { name, price, SoLuongKhach, imageUrl },
            { new: true }
        );
        if (!updatedLobby) {
            return res.status(404).send("Phòng không tồn tại");
        }

        res.status(200).json({ status: true, message: "Cập nhật phòng thành công", data: updatedLobby });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Lỗi khi cập nhật phòng" });
    }
});

// Xóa phòng theo ID
router.delete('/delete/:id', async (req, res) => {
    try {
        const deletedLobby = await Lobby.findByIdAndDelete(req.params.id);
        if (!deletedLobby) {
            return res.status(404).json({ status: false, message: "Phòng không tồn tại" });
        }
        res.status(200).json({ status: true, message: "Xóa phòng thành công", data: deletedLobby });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Lỗi khi xóa phòng" });
    }
});

module.exports = router;
