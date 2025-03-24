const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  planId: {
    type: mongoose.Schema.Types.ObjectId, // Sửa thành ObjectId
    ref: 'Plan', // Liên kết với model Plan
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Liên kết với model User
    required: true,
  },
  depositAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['inactive', 'pending', 'active'],
    default: 'inactive',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Transaction', TransactionSchema);