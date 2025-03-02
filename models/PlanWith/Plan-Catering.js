const mongoose = require('mongoose');

const Plan_CateringSchema = new mongoose.Schema({
    PlanId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Plan', 
        required: true 
    },
    CateringId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Catering', 
        required: true 
    },
}, { timestamps: true });

module.exports = mongoose.model('Plan_Catering', Plan_CateringSchema);
