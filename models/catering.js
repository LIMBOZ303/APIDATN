const mongoose = require('mongoose');

const cateringSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    cate_cateringId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'cate_catering', 
        required: true 
    },
    description: { type: String },
    imageUrl: { type: String },
}, { timestamps: true });

const Catering = mongoose.model('Catering', cateringSchema);

module.exports = Catering;
