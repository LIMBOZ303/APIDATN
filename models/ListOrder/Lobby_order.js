const mongoose = require('mongoose');

const Lobby_orderSchema = new mongoose.Schema({
    SanhId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Sanh', 
        required: true 
    },
    UserId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
}, { timestamps: true });

module.exports = mongoose.model('Lobby_order', Lobby_orderSchema);
