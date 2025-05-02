const mongoose = require('mongoose');
const Plan = require('../planModel')
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
Plan_lobbySchema.post('save', async function () {
    await updatePlanTotalPrice(this.PlanId);
});

// 🛠 Middleware: Cập nhật khi xóa dịch vụ
Plan_lobbySchema.post('remove', async function () {
    await updatePlanTotalPrice(this.PlanId);
});
module.exports = mongoose.model('Plan_lobby', Plan_lobbySchema);
