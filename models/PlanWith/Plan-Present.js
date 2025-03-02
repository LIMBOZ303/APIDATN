const mongoose = require('mongoose');

const Plan_PresentSchema = new mongoose.Schema({
    PlanId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Plan', 
        required: true 
    },
    PresentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'present', 
        required: true 
    },
}, { timestamps: true });

module.exports = mongoose.model('Plan_PresentSchema', Plan_PresentSchema);
