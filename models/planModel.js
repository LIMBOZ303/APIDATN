const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    clothesId:{type: mongoose.Schema.Types.ObjectId, ref: 'Clothes',required: true},
    invitationId:{type: mongoose.Schema.Types.ObjectId, ref: 'Invitation',required: true},
    lobbyId:{type: mongoose.Schema.Types.ObjectId, ref: 'Lobby',required: true},
    cateringId:{type: mongoose.Schema.Types.ObjectId, ref: 'Catering',required: true},
    flowerId: {type: mongoose.Schema.Types.ObjectId, ref: 'Flower',required: true},
    totalPrice:{type: Number,required: true},
    status:{type: String,enum:['active','inactive'],default:'active'},
    planprice:{type: Number,required: true},
    plansoluongkhach:{type: Number,required: true},
    planlocation:{type: String,required: true},
},{timestamps: true});

const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan;
