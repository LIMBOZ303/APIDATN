const mongoose = require('mongoose');

const Catering_orderSchema = new mongoose.Schema({
    CateringId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Catering', 
        required: true 
    },
    UserId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
}, { timestamps: true });

module.exports = mongoose.model('Catering_order', Catering_orderSchema);
