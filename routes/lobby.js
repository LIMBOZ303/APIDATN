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
//thêm
router.post('/add', async (req, res) => {
    const { hallId, name, price, description, imageUrl } = req.body;
    const lobby = new Lobby({ hallId, name, price, description, imageUrl });
    try {
        await lobby.save();
        res.status(200).json({ status: true, message: "Thêm thành công", data: lobby });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "thêm thất bại" });
    }
});

//lấy tất
router.get('/all', async (req, res) => {
    try {
        const lobbyEntries = await Lobby.find();
        res.status(200).json({status: true, message:"lấy thành công danh sách", data:lobbyEntries});
    } catch (error) {
        console.log(error);
        res.status(500).json({status: false, message: "Lỗi khi lấy tất cả áo" });
    }
});

// Cập nhật Wedding Hall (PUT)
router.put('/:id', async (req, res) => {
    const { hallId, name, price, description, imageUrl } = req.body;

    try {
        const updatedLobby = await Lobby.findByIdAndUpdate(
            req.params.id,
            { hallId, name, price, description, imageUrl },
            { new: true }
        );
        if (!updatedLobby) return res.status(404).json({status: false, message: 'Lobby not found' });
        return res.status(200).json({status: true, message:"update thành công" ,data:updatedLobby});
    } catch (error) {
        
        return res.status(400).json({ status: false, message: 'Error updating Lobby' });
    }
});

module.exports = router;
