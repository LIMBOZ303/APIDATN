const mongoose = require('mongoose');

const Present_orderSchema = new mongoose.Schema({
    PresentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'present', 
        required: true 
    },
    UserId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
}, { timestamps: true });

module.exports = mongoose.model('Present_order', Present_orderSchema);
