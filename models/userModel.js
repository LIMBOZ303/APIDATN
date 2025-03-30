const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
   name: { type: String, required: true },
   email: { type: String, required: true, unique: true },
   password: { type: String, required: true },
   phone: { type: String },
   address: { type: String },
   role: { type: String, default: 'user' },
   avatar: { type: String, default: 'https://static-00.iconduck.com/assets.00/user-icon-2046x2048-9pwm22pp.png' },
   isVerified: { type: Boolean, default: false },
   
    // Trạng thái hoạt động của người dùng
    lastActive: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false },
    
   // Danh sách đơn hàng đã đặt
   Catering_orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Catering_order' }],
   Decorate_orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Decorate_order' }],
   Lobby_orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lobby_order' }],
   Present_orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Present_order' }],

   // 💖 Danh sách đơn hàng yêu thích từ các bảng trung gian
   Favorite_Catering: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Catering_order' }],
   Favorite_Decorate: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Decorate_order' }],
   Favorite_Lobby: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lobby_order' }],
   Favorite_Present: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Present_order' }]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;
