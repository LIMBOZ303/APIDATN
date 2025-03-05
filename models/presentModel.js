const mongoose = require("mongoose");

const presentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    Cate_presentId: { type: mongoose.Schema.Types.ObjectId, ref: "cate_present", required: true },
    Description: { type: String, required: false },
    Status: { type: String, required: false },
    imageUrl: { type: String, required: true },
    
}, { timestamps: true });

const Present = mongoose.model("present", presentSchema);

module.exports = Present;