const mongoose = require('mongoose');
const Plan = require('../planModel')
const Plan_decorateSchema = new mongoose.Schema({
    PlanId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Plan', 
        required: true 
    },
    DecorateId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Decorate', 
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
Plan_decorateSchema.post('save', async function () {
    await updatePlanTotalPrice(this.PlanId);
});

// 🛠 Middleware: Cập nhật khi xóa dịch vụ
Plan_decorateSchema.post('remove', async function () {
    await updatePlanTotalPrice(this.PlanId);
});
module.exports = mongoose.model('Plan_decorate', Plan_decorateSchema);
