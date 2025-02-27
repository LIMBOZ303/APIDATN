const mongoose = require('mongoose');

const clothesSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    Category_ClothesId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Category_Clothes',  // Kiểm tra chắc chắn rằng tên mô hình là đúng
        required: true 
    },
    gender: { type: String, enum: ['male', 'female', 'unisex'], required: true },
    Silhouette: { type: String, required: true },
    fabrics: { type: String, required: true },
    color: { type: String, required: true },
    neckline: { type: String, required: true },
    sleeve: { type: String, required: true },
    imageUrl: { type: [String], required: false }, 
}, { timestamps: true });

module.exports = mongoose.model('Clothes', clothesSchema);
