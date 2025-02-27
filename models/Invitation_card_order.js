const mongoose = require('mongoose');

const invitationCard_orderSchema = new mongoose.Schema({
    InvitationId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Invitation', 
        required: true 
    },
    FavoriteId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'favorite', 
        required: true 
    },
}, { timestamps: true });

module.exports = mongoose.model('invitationCard_order', invitationCard_orderSchema);
