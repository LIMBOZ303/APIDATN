const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    invitationId:{type: mongoose.Schema.Types.ObjectId, ref: 'Invitation',required: true},
    lobbyId:{type: mongoose.Schema.Types.ObjectId, ref: 'Lobby',required: true},
    cateringId:{type: mongoose.Schema.Types.ObjectId, ref: 'Catering',required: true},
    flowerId: {type: mongoose.Schema.Types.ObjectId, ref: 'Flower',required: true},
    UserId: {type: mongoose.Schema.Types.ObjectId, ref: 'User',required: true},
    totalPrice:{type: Number,required: true},
    status:{type: String,enum:['active','inactive'],default:'active'},
    planprice:{type: Number,required: true},
    plansoluongkhach:{type: Number,required: true},
    plandateevent:{type: Date,required: true},
    planlocation:{type: String,required: true},
},{timestamps: true});

const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan;
