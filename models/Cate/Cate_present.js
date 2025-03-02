const mongoose = require('mongoose');

const cate_presentModel = new mongoose.Schema({
    name: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('cate_present', cate_presentModel);
