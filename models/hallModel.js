const mongoose = require('mongoose');

const hallSchema = new mongoose.Schema({
    name: {type: String, required: true},
    soluongkhach: {type: Number, required: true},
    location: {type: String},
    sanh: {type: Number},
    imageUrl: {type: String},
}, {timestamps: true});

const Hall = mongoose.model('Hall', hallSchema);

module.exports = Hall;

