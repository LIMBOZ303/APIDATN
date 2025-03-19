const mongoose = require('mongoose');
const Plan = require('../planModel')

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

// 🔄 Hàm cập nhật totalPrice
async function updatePlanTotalPrice(planId) {
    if (!planId) return;
    const plan = await Plan.findById(planId);
    if (plan) {
        await plan.calculateTotalPrice();
        await plan.save();
    }
}

// 🛠 Middleware: Cập nhật khi thêm dịch vụ
Plan_CateringSchema.post('save', async function () {
    await updatePlanTotalPrice(this.PlanId);
});

// 🛠 Middleware: Cập nhật khi xóa dịch vụ
Plan_CateringSchema.post('remove', async function () {
    await updatePlanTotalPrice(this.PlanId);
});

module.exports = mongoose.model('Plan_Catering', Plan_CateringSchema);
