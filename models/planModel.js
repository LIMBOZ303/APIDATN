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
    status: { type: String, enum: ['Đã đặt cọc', 'Đang chờ', 'Chưa đặt cọc','Đã hủy', 'Đang chờ xác nhận'], default: 'Đang chờ xác nhận' },
    planprice: { type: Number, required: false },
    plansoluongkhach: { type: Number, required: false },
    plandateevent: { type: Date, required: false, index: true },
    caterings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plan_Catering' }],
    decorates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plan_decorate' }],
    presents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plan_PresentSchema' }],
    priceDifference: { type: Number, default: 0 },
    originalPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
    isTemporary: { type: Boolean, default: false },
}, { timestamps: true });

// Middleware tính toán priceDifference
planSchema.pre('save', async function (next) {
    // Chuyển đổi plandateevent nếu cần
    if (typeof this.plandateevent === 'string') {
        const [day, month, year] = this.plandateevent.split('/');
        this.plandateevent = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    }

    // Tính totalPrice
    await this.calculateTotalPrice();

    // Tính priceDifference
    this.priceDifference = (this.planprice || 0) - (this.totalPrice || 0);

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

// Phương thức tính totalPrice dựa trên plansoluongkhach
planSchema.methods.calculateTotalPrice = async function (plansoluongkhach = this.plansoluongkhach) {
    if (!this.SanhId) {
        this.totalPrice = 0;
        return this.totalPrice;
    }

    // Lấy thông tin từ các collection liên quan
    const sanh = await Sanh.findById(this.SanhId, 'price');
    const caterings = await Plan_catering.find({ PlanId: this._id }).populate('CateringId', 'price');
    const decorates = await Plan_decorate.find({ PlanId: this._id }).populate('DecorateId', 'price');
    const presents = await Plan_present.find({ PlanId: this._id }).populate('PresentId', 'price');

    // Tính số bàn dựa trên plansoluongkhach
    const soLuongBan = plansoluongkhach ? Math.ceil(plansoluongkhach / 10) : 0;

    // Tính tổng giá catering
    const totalCateringPrice = soLuongBan > 0
        ? caterings.reduce((sum, item) => sum + ((item.CateringId?.price || 0) * soLuongBan), 0)
        : 0;

    // Tính tổng giá decorate
    const totalDecoratePrice = decorates.reduce((sum, item) => sum + (item.DecorateId?.price || 0), 0);

    // Tính tổng giá presents (không phụ thuộc số lượng khách)
    const totalPresentPrice = presents.reduce((sum, item) => {
        const price = item.PresentId?.price || 0;
        const quantity = item.quantity || 1; // Mặc định quantity là 1 nếu không có
        return sum + (price * quantity);
    }, 0);

    // Tính totalPrice
    this.totalPrice = (sanh?.price || 0) + totalCateringPrice + totalDecoratePrice + totalPresentPrice;
    return this.totalPrice;
};

// Virtual field: Trả về plandateevent dạng dd/mm/yyyy
planSchema.virtual('plandateeventFormatted').get(function () {
    if (!this.plandateevent) return null;
    const date = new Date(this.plandateevent);
    return date.toLocaleDateString('vi-VN');
});

// Chuyển đổi khi xuất JSON
planSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        if (ret.plandateevent) {
            ret.plandateevent = doc.plandateeventFormatted;
        }
        return ret;
    }
});

const Plan = mongoose.model('Plan', planSchema);
module.exports = Plan;