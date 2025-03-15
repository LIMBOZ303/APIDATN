const mongoose = require('mongoose');

const Plan_lobbySchema = new mongoose.Schema({
    PlanId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Plan', 
        required: true 
    },
    SanhId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Sanh', 
        required: true 
    },
}, { timestamps: true });

module.exports = mongoose.model('Plan_lobby', Plan_lobbySchema);
