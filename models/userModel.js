const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
   name: {
    type: String,
    required: true,
   },
   email: {
    type: String,
    required: true,
    unique: true,
   },
   password: {
    type: String,
    required: true,
   },
   phone: {
    type: String,
   },
   address: {
    type: String,
   },
   role: {
    type: String,
    default: 'user',
   },
   avatar: {
    type: String,
    default: 'https://via.placeholder.com/150',
   },
}, {timestamps: true});

const User = mongoose.model('User', userSchema);

module.exports = User;