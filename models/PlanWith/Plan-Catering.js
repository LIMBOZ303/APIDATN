const mongoose = require('mongoose');
const Plan = require('../planModel');
const Catering = require('../cateringModel');

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

// Sử dụng phương thức calculateTotalPrice từ Plan thay vì tính lại
Plan_CateringSchema.post('save', async function () {
    const plan = await Plan.findById(this.PlanId);
    if (plan) {
        await plan.calculateTotalPrice();
        await plan.save();
    }
});

Plan_CateringSchema.post('remove', async function () {
    const plan = await Plan.findById(this.PlanId);
    if (plan) {
        await plan.calculateTotalPrice();
        await plan.save();
    }
});

module.exports = mongoose.model('Plan_Catering', Plan_CateringSchema);