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
    caterings: [{
        CateringId: { type: mongoose.Schema.Types.ObjectId, ref: 'Catering' },
        price: { type: Number } // Lưu giá tại thời điểm thêm
    }],
    decorates: [{
        DecorateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Decorate' },
        price: { type: Number } // Lưu giá tại thời điểm thêm
    }],
    presents: [{
        PresentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Present' },
        price: { type: Number }, // Lưu giá tại thời điểm thêm
        quantity: { type: Number, default: 1 }
    }],
    sanhPrice: { type: Number }, // Lưu giá của Sanh tại thời điểm thêm
    priceDifference: { type: Number, default: 0 },
    originalPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
    isTemporary: { type: Boolean, default: false },
}, { timestamps: true });


// Middleware tính toán priceDifference
planSchema.pre('save', async function (next) {
    try {
        // Nếu kế hoạch đã đặt cọc, bỏ qua tính toán
        if (this.status === 'Đã đặt cọc') {
            return next();
        }

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
    } catch (error) {
        console.error(`Lỗi trong middleware pre('save') cho plan ${this._id}:`, error);
        next(error);
    }
});

// Middleware đặt tên Plan tự động nếu chưa có
planSchema.pre('save', async function (next) {
    // Nếu kế hoạch đã đặt cọc, bỏ qua đặt tên
    if (this.status === 'Đã đặt cọc') {
        return next();
    }

    if (!this.name) {
        const userPlanCount = await mongoose.model('Plan').countDocuments({ UserId: this.UserId });
        this.name = `Plan số ${userPlanCount + 1}`;
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

// Phương thức tính totalPrice dựa trên plansoluongkhach
// Phương thức tính totalPrice dựa trên plansoluongkhach
planSchema.methods.calculateTotalPrice = async function (plansoluongkhach = this.plansoluongkhach) {
    try {
        // Nếu kế hoạch đã đặt cọc, trả về totalPrice hiện tại
        if (this.status === 'Đã đặt cọc') {
            console.log(`Plan ${this._id} đã đặt cọc, không tính lại totalPrice`);
            return this.totalPrice || 0;
        }

        if (!this.SanhId) {
            console.warn(`SanhId không tồn tại cho plan ${this._id}`);
            this.totalPrice = 0;
            return this.totalPrice;
        }

        // Kiểm tra plansoluongkhach
        if (!plansoluongkhach || plansoluongkhach <= 0) {
            console.warn(`plansoluongkhach không hợp lệ cho plan ${this._id}: ${plansoluongkhach}`);
            plansoluongkhach = 0;
        }

        // Lấy thông tin từ các collection liên quan
        const [sanh, caterings, decorates, presents] = await Promise.all([
            Sanh.findById(this.SanhId, 'price').lean(),
            Plan_catering.find({ PlanId: this._id }).populate('CateringId', 'price').lean(),
            Plan_decorate.find({ PlanId: this._id }).populate('DecorateId', 'price').lean(),
            Plan_present.find({ PlanId: this._id }).populate('PresentId', 'price').lean(),
        ]);

        // Lưu giá vào document
        this.sanhPrice = sanh?.price || 0;
        this.caterings = caterings.map(item => ({
            CateringId: item.CateringId?._id,
            price: item.CateringId?.price || 0
        }));
        this.decorates = decorates.map(item => ({
            DecorateId: item.DecorateId?._id,
            price: item.DecorateId?.price || 0
        }));
        this.presents = presents.map(item => ({
            PresentId: item.PresentId?._id,
            price: item.PresentId?.price || 0,
            quantity: item.quantity || 1
        }));

        // Tính số bàn dựa trên plansoluongkhach
        const soLuongBan = plansoluongkhach ? Math.ceil(plansoluongkhach / 10) : 0;

        // Tính tổng giá catering
        const totalCateringPrice = soLuongBan > 0
            ? this.caterings.reduce((sum, item) => sum + (item.price * soLuongBan), 0)
            : 0;

        // Tính tổng giá decorate
        const totalDecoratePrice = this.decorates.reduce((sum, item) => sum + item.price, 0);

        // Tính tổng giá presents
        const totalPresentPrice = this.presents.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Tính totalPrice
        this.totalPrice = this.sanhPrice + totalCateringPrice + totalDecoratePrice + totalPresentPrice;

        // Ghi log để kiểm tra
        console.log(`Calculated totalPrice for plan ${this._id}:`, {
            sanhPrice: this.sanhPrice,
            totalCateringPrice,
            totalDecoratePrice,
            totalPresentPrice,
            totalPrice: this.totalPrice,
            plansoluongkhach,
            soLuongBan,
        });

        return this.totalPrice;
    } catch (error) {
        console.error(`Lỗi tính totalPrice cho plan ${this._id}:`, error);
        this.totalPrice = 0;
        return this.totalPrice;
    }
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