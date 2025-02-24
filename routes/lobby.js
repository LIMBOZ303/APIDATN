const express = require('express');
const router = express.Router();
const Lobby = require('../models/lobbyModel');

//thêm lobb
router.post('/add', async (req, res) => {
    const { name, price, imageUrl, weddingHallId } = req.body;
    const lobby = new Lobby({ name, price, imageUrl, weddingHallId });
    try {
        await lobby.save();
        return res.status(200).json({ message: "Thêm lobb thành công", data: lobby });
    } catch (error) {
        return res.status(500).json({ error: "Lỗi khi thêm lobb" });
    }
});

//lấy tất cả lobb
router.get('/getall', async (req, res) => {
    try {
        const lobbies = await Lobby.find().populate('weddingHallId');
        return res.status(200).json(lobbies);
    } catch (error) {
        return res.status(500).json({ error: "Lỗi khi lấy tất cả lobb" });
    }
});

//lấy lobb theo id
router.get('/:id', async (req, res) => {
    try {
        const lobby = await Lobby.findById(id).populate('weddingHallId');
        if (!lobby) {
            return res.status(404).json({ error: "Lobby không tồn tại" });
        }
        return res.status(200).json(lobby);
    } catch (error) {
        return res.status(500).json({ error: "Lỗi khi lấy lobb theo id" });
    }
});

//cập nhật lobb
router.put('/update/:id', async (req, res) => {
    const { name, price, imageUrl, weddingHallId } = req.body;
    try {
        const lobby = await Lobby.findByIdAndUpdate(req.params.id, { name, price, imageUrl, weddingHallId }, { new: true });
        if (!lobby) {
            return res.status(404).json({ error: "Lobby không tồn tại" });
        }
        return res.status(200).json({ message: "Cập nhật lobb thành công", data: lobby });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Lỗi khi cập nhật lobb" });
    }
});

//xóa lobb
router.delete('/:id', async (req, res) => {
    try {
        const lobby = await Lobby.findByIdAndDelete(req.params.id);
        if (!lobby) {
            return res.status(404).json({ error: "Lobby không tồn tại" });
        }
        return res.status(200).json({ message: "Xóa lobb thành công", data: lobby });
    } catch (error) {
        return res.status(500).json({ error: "Lỗi khi xóa lobb" });
    }
});

module.exports = router;
