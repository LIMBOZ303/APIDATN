const mongoose = require('mongoose');

const Category_ClothesModel = new mongoose.Schema({
    name: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Category_Clothes', Category_ClothesModel);
