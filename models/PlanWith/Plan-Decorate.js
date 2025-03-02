const mongoose = require('mongoose');

const Plan_decorateSchema = new mongoose.Schema({
    PlanId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Plan', 
        required: true 
    },
    DecorateId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'decorate', 
        required: true 
    },
}, { timestamps: true });

module.exports = mongoose.model('Plan_decorate', Plan_decorateSchema);
