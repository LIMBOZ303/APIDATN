const mongoose = require('mongoose');

const hallSchema = new mongoose.Schema({
    name: {type: String, required: true},
    price: {type: Number, required: true},
    soluongkhach: {type: Number, required: true},
    location: {type: String},
    dateevent: {type: Date, required: false},
    imageUrl: {type: String},
}, {timestamps: true});

const Hall = mongoose.model('Hall', hallSchema);

module.exports = Hall;

