const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    
}, { timestamps: true });

const Catering = mongoose.model('favorite', favoriteSchema);

module.exports = Catering;
