const mongoose = require('mongoose');
const Plan = require('../planModel')
const Plan_PresentSchema = new mongoose.Schema({
    PlanId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Plan', 
        required: true 
    },
    PresentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'present', 
        required: false
    },
    quantity : {type: Number, require: false, defautl : 0},
    
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
Plan_PresentSchema.post('save', async function () {
    await updatePlanTotalPrice(this.PlanId);
});

// 🛠 Middleware: Cập nhật khi xóa dịch vụ
Plan_PresentSchema.post('remove', async function () {
    await updatePlanTotalPrice(this.PlanId);
});

module.exports = mongoose.model('Plan_PresentSchema', Plan_PresentSchema);
