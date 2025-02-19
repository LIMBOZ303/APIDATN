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

module.exports = router;