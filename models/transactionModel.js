const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  planId: {
    type: String,
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
    enum: ['pending', 'deposit_confirmed', 'cancelled'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Transaction', TransactionSchema);