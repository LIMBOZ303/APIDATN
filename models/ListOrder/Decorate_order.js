const mongoose = require('mongoose');

const Decorate_orderSchema = new mongoose.Schema({
    DecorateId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'decorate', 
        required: true 
    },
    UserId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
}, { timestamps: true });

module.exports = mongoose.model('Decorate_order', Decorate_orderSchema);
