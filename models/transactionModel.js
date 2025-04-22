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
    enum: ['Chưa đặt cọc', 'Đang chờ', 'Đã đặt cọc' ,'Đã hủy','Đang chờ xác nhận'],
    default: 'Đang chờ xác nhận',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Transaction', TransactionSchema);