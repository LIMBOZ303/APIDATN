const mongoose = require('mongoose');
const Plan = require('../models/planModel'); // Import Plan model

const transactionSchema = new mongoose.Schema({
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  depositAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'deposit_confirmed', 'cancelled'], default: 'pending' },
}, { timestamps: true });




// Middleware: Đồng bộ status của Plan khi Transaction được cập nhật
transactionSchema.post('findOneAndUpdate', async function (doc) {
  if (doc && doc.status === 'deposit_confirmed') {
    try {
      const plan = await Plan.findById(doc.planId);
      if (plan) {
        plan.status = 'active';
        await plan.save();
        console.log(`Đã cập nhật status của Plan ${plan._id} thành active`);
      } else {
        console.warn(`Không tìm thấy Plan với ID ${doc.planId}`);
      }
    } catch (error) {
      console.error('Lỗi khi đồng bộ status của Plan:', error);
    }
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;