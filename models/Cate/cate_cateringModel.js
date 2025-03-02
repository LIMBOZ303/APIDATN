const mongoose = require('mongoose');

const cate_cateringModel = new mongoose.Schema({
    name: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('cate_catering', cate_cateringModel);
