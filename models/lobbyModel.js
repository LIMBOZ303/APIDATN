const mongoose = require("mongoose");

const lobbySchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    weddingHallId: { type: mongoose.Schema.Types.ObjectId, ref: "WeddingHall", required: true },
}, { timestamps: true });

const Lobby = mongoose.model("Lobby", lobbySchema);

module.exports = Lobby;
