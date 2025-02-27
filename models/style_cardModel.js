const mongoose = require('mongoose');

const Style_cardModel = new mongoose.Schema({
    name: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Style_card', Style_cardModel);
