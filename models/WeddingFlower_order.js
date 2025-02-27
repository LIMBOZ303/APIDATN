const mongoose = require('mongoose');

const WeddingFlower_orderSchema = new mongoose.Schema({
    WeddingFlowerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Flower', 
        required: true 
    },
    FavoriteId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'favorite', 
        required: true 
    },
}, { timestamps: true });

module.exports = mongoose.model('WeddingFlower_order', WeddingFlower_orderSchema);
