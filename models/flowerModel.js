const mongoose = require('mongoose');

const flowerSchema = new mongoose.Schema({
    name: {type: String, required: true},
    price: {type: Number, required: true},
    description: {type: String},
    status: {type: String, enum: ['available', 'unavailable'], default: 'available'},
    imageUrl: {type: String},
}, {timestamps: true});

const Flower = mongoose.model('Flower', flowerSchema);

module.exports = Flower;

