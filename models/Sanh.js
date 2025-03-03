const mongoose = require("mongoose");

const SanhSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    SoLuongKhach: { type: Number, required: true },
    imageUrl: { type: String, required: true },
}, { timestamps: true });

const Lobby = mongoose.model("Sanh", SanhSchema);

module.exports = Lobby;