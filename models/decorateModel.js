const mongoose = require("mongoose");

const decorateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    Cate_decorateId: { type: mongoose.Schema.Types.ObjectId, ref: "cate_decorate", required: true },
    Description: { type: String, required: false },
    Status: { type: String, required: false },
    imageUrl: { type: String, required: true },
    
}, { timestamps: true });

const Decorate = mongoose.model("decorate", decorateSchema);

module.exports = Decorate;