const mongoose = require('mongoose');

const clothes_orderSchema = new mongoose.Schema({
    ClothesId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Clothes', 
        required: true 
    },
    FavoriteId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'favorite', 
        required: true 
    },
}, { timestamps: true });

module.exports = mongoose.model('clothes_order', clothes_orderSchema);
