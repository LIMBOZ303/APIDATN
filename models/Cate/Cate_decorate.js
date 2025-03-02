const mongoose = require('mongoose');

const cate_decorateModel = new mongoose.Schema({
    name: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('cate_decorate', cate_decorateModel);
