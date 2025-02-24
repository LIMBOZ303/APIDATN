
const mongoose = require("mongoose");

const lobbySchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    weddingHallId: { type: mongoose.Schema.Types.ObjectId, ref: "WeddingHall", required: true },
}, { timestamps: true });

const Lobby = mongoose.model("Lobby", lobbySchema);

module.exports = Lobby;

// const mongoose = require('mongoose');

// const lobbySchema = new mongoose.Schema({
//     hallId:{type: mongoose.Schema.Types.ObjectId, ref: 'Hall',required: true},
//     name: {type: String, required: true},
//     price: {type: Number, required: true},
//     dateevent: {type: Date, required: false},
//     description: {type: String, required: false,},
//     imageUrl: {type: String},
// }, {timestamps: true});

// const Lobby = mongoose.model('Lobby', lobbySchema);

// module.exports = Lobby;


