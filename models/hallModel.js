const mongoose = require('mongoose');

const hallSchema = new mongoose.Schema({
    name: {type: String, required: true},
    location: {type: String, required: true},
    sanh: {type: Number},
    imageUrl: {type: String},
}, {timestamps: true});

const Hall = mongoose.model('WeddingHall', hallSchema);

module.exports = Hall;

