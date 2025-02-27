const mongoose = require('mongoose');

const Plan_ClothesSchema = new mongoose.Schema({
    PlanId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Plan', 
        required: true 
    },
    ClothesId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Clothes', 
        required: true 
    },
}, { timestamps: true });

module.exports = mongoose.model('Plan_Clothes', Plan_ClothesSchema);
