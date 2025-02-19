const express = require('express');
const router = express.Router();
const Lobby = require('../models/lobbyModel');

//thêm
router.post('/add', async (req, res) => {
    const { hallId, name, price, description, imageUrl } = req.body;
    const lobby = new Lobby({ hallId, name, price, description, imageUrl });
    try {
        await lobby.save();
        res.status(200).json({message: "Thêm thành công", data:lobby} );
    } catch (error) {
        console.log(error);
        res.status(500).send("Lỗi khi thêm");
    }
});

//lấy tất
router.get('/all', async (req, res) => {
    try {
        const lobbyEntries = await Lobby.find();
        res.status(200).json(lobbyEntries);
    } catch (error) {
        console.log(error);
        res.status(500).json({error: "Lỗi khi lấy tất cả áo"});
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
        if (!updatedLobby) return res.status(404).json({ error: 'Lobby not found' });
        return res.status(200).json(updatedLobby);
    } catch (error) {
        console.error('Error updating Lobby:', error);
        return res.status(400).json({ error: 'Error updating Lobby' });
    }
});

module.exports = router;