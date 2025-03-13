const mongoose = require('mongoose');
const Plan_catering = require('../models/PlanWith/Plan-Catering');
const Plan_decorate = require('../models/PlanWith/Plan-Decorate');
const Plan_present = require('../models/PlanWith/Plan-Present');
const Sanh = require('../models/Sanh');

const planSchema = new mongoose.Schema({
    name: { type: String, required: false },
    SanhId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sanh', required: true },
    UserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    totalPrice: { type: Number, required: false, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
    planprice: { type: Number, required: false },
    plansoluongkhach: { type: Number, required: true },
    plandateevent: { type: Date, required: true },
    caterings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plan_Catering' }],
    decorates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plan_decorate' }],
    presents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plan_PresentSchema' }]
}, { timestamps: true });

// Middleware để đặt tên theo UserId
planSchema.pre('save', async function (next) {
    if (!this.name) {
        const userPlanCount = await mongoose.model('Plan').countDocuments({ UserId: this.UserId });
        this.name = `Plan số ${userPlanCount + 1}`;
    }
    if (this.isNew || this.isModified('SanhId')) {
        await this.calculateTotalPrice();
    }
    next();
});

// Middleware cập nhật totalPrice khi update
planSchema.pre('findOneAndUpdate', async function (next) {
    const update = this.getUpdate();
    const planId = this.getQuery()._id;
    if (!planId) return next();
    
    const plan = await mongoose.model('Plan').findById(planId);
    if (plan) {
        await plan.calculateTotalPrice();
        await plan.save();
    }
    next();
});

// Hàm tính tổng tiền
planSchema.methods.calculateTotalPrice = async function () {
    if (!this.SanhId) return;
    
    const sanh = await Sanh.findById(this.SanhId, 'price');
    const caterings = await Plan_catering.find({ PlanId: this._id }).populate('CateringId', 'price');
    const decorates = await Plan_decorate.find({ PlanId: this._id }).populate('DecorateId', 'price');
    const presents = await Plan_present.find({ PlanId: this._id }).populate('PresentId', 'price');
    
    const totalPrice = (sanh?.price || 0) +
        caterings.reduce((sum, item) => sum + (item.CateringId?.price || 0), 0) +
        decorates.reduce((sum, item) => sum + (item.DecorateId?.price || 0), 0) +
        presents.reduce((sum, item) => sum + (item.PresentId?.price || 0), 0);
    
    this.totalPrice = totalPrice;
};

const Plan = mongoose.model('Plan', planSchema);
module.exports = Plan;
