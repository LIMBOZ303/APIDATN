const mongoose = require('mongoose');

const weddingorderSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    planId: {type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true},
    totalPrice: {type: Number, required: true},
    location: {type: String, required: true},
    eventDate: {type: Date, required: true},
    
}, {timestamps: true});

const WeddingOrder = mongoose.model('WeddingOrder', weddingorderSchema);

module.exports = WeddingOrder;
