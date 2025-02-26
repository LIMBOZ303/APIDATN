const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
    name: {type: String, required: true},
    Style_cardId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Style_card', 
        required: true 
    },
    price: {type: Number, required: true},
    status: {type: String, enum: ['active', 'inactive'], default: 'active'},
    description: {type: String},
    imageUrl: {type: String},
}, {timestamps: true});

const Invitation = mongoose.model('Invitation', invitationSchema);

module.exports = Invitation;

