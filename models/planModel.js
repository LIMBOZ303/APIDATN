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
    status: { type: String, enum: ['active','pending', 'inactive'], default: 'inactive' },
    planprice: { type: Number, required: false },
    plansoluongkhach: { type: Number, required: false },
    
    // Lưu `plandateevent` dưới dạng Date và tối ưu tìm kiếm
    plandateevent: { type: Date, required: false, index: true },

    caterings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plan_Catering' }],
    decorates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plan_decorate' }],
    presents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plan_PresentSchema' }],
    priceDifference: { type: Number, default: 0 }, // Thêm priceDifference
}, { timestamps: true });


// Middleware tính toán priceDifference
planSchema.pre('save', function (next) {
    if (typeof this.plandateevent === 'string') {
      const [day, month, year] = this.plandateevent.split('/');
      this.plandateevent = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    }
    this.priceDifference = (this.planprice || 0) - (this.totalPrice || 0); // Tính priceDifference
    next();
  });

// 🛠 Middleware: Chuyển `dd/mm/yyyy` thành Date trước khi lưu
planSchema.pre('save', function (next) {
    if (typeof this.plandateevent === 'string') {
        const [day, month, year] = this.plandateevent.split('/');
        this.plandateevent = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    }
    next();
});

// Middleware đặt tên Plan tự động nếu chưa có
planSchema.pre('save', async function (next) {
    if (!this.name) {
        const userPlanCount = await mongoose.model('Plan').countDocuments({ UserId: this.UserId });
        this.name = `Plan số ${userPlanCount + 1}`;
    }
    next();
});

// Middleware cập nhật totalPrice và priceDifference khi update
planSchema.pre('findOneAndUpdate', async function (next) {
    const update = this.getUpdate();
    const planId = this.getQuery()._id;
    if (!planId) return next();
  
    const plan = await mongoose.model('Plan').findById(planId);
    if (plan) {
      await plan.calculateTotalPrice();
      plan.priceDifference = (plan.planprice || 0) - (plan.totalPrice || 0); // Cập nhật priceDifference
      await plan.save();
    }
    next();
  });
  planSchema.methods.calculateTotalPrice = async function () {
    if (!this.SanhId) {
        this.totalPrice = 0;
        return;
    }

    // Lấy thông tin từ các collection liên quan
    const sanh = await Sanh.findById(this.SanhId, 'price');
    const caterings = await Plan_catering.find({ PlanId: this._id }).populate('CateringId', 'price pricePerTable');
    const decorates = await Plan_decorate.find({ PlanId: this._id }).populate('DecorateId', 'price');
    const presents = await Plan_present.find({ PlanId: this._id }).populate('PresentId', 'price');

    // Tính số bàn
    const soLuongBan = this.plansoluongkhach ? Math.ceil(this.plansoluongkhach / 10) : 0;

    // Tính tổng giá catering
    let totalCateringPrice = 0;
    caterings.forEach(item => {
        if (item.CateringId) {
            if (item.CateringId.pricePerTable) {
                const priceEntry = item.CateringId.pricePerTable.find(p => p.numberOfTables === soLuongBan);
                totalCateringPrice += priceEntry ? priceEntry.price : Math.max(...item.CateringId.pricePerTable.map(p => p.price), 0);
            } else {
                totalCateringPrice += (item.CateringId.price || 0) * soLuongBan;
            }
        }
    });

    // Tính tổng giá presents dựa trên quantity
    const totalPresentPrice = presents.reduce((sum, item) => {
        const price = item.PresentId?.price || 0; // Giá của PresentId
        const quantity = item.quantity || 0; // Số lượng từ Plan_PresentSchema
        return sum + (price * quantity); // Nhân giá với số lượng
    }, 0);

    // Tính totalPrice
    this.totalPrice = (sanh?.price || 0) +
        totalCateringPrice +
        decorates.reduce((sum, item) => sum + (item.DecorateId?.price || 0), 0) +
        totalPresentPrice; // Sử dụng totalPresentPrice đã tính dựa trên quantity
};


// 🛠 Virtual field: Trả về `plandateevent` dạng `dd/mm/yyyy`
planSchema.virtual('plandateeventFormatted').get(function () {
    if (!this.plandateevent) return null;
    const date = new Date(this.plandateevent);
    return date.toLocaleDateString('vi-VN'); // Format thành dd/mm/yyyy
});

// 🛠 Chuyển đổi khi xuất JSON
planSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        if (ret.plandateevent) {
            const date = new Date(ret.plandateevent);
            ret.plandateevent = date.toLocaleDateString('vi-VN'); // Format thành dd/mm/yyyy
        }
        return ret;
    }
});



const Plan = mongoose.model('Plan', planSchema);
module.exports = Plan;