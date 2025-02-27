const mongoose = require('mongoose');

const WeddingHall_orderSchema = new mongoose.Schema({
    WeddingHallId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'WeddingHall', 
        required: true 
    },
    FavoriteId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'favorite', 
        required: true 
    },
}, { timestamps: true });

module.exports = mongoose.model('WeddingHall_order', WeddingHall_orderSchema);
