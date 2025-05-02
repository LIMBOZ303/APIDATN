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



planSchema.pre('save', async function (next) {
    try {
        // Chỉ xử lý khi trạng thái chuyển sang 'Đã đặt cọc'
        if (this.isModified('status') && this.status === 'Đã đặt cọc') {
            const [caterings, decorates, presents] = await Promise.all([
                Plan_catering.find({ PlanId: this._id }).populate('CateringId', 'name price imageUrl'),
                Plan_decorate.find({ PlanId: this._id }).populate('DecorateId', 'name price imageUrl'),
                Plan_present.find({ PlanId: this._id }).populate('PresentId', 'name price imageUrl'),
            ]);

            // Cập nhật thông tin tĩnh cho caterings
            await Promise.all(caterings.map(async (catering) => {
                if (catering.CateringId) {
                    catering.name = catering.CateringId.name;
                    catering.price = catering.CateringId.price;
                    catering.imageUrl = catering.CateringId.imageUrl;
                    await catering.save();
                }
            }));

            // Cập nhật thông tin tĩnh cho decorates
            await Promise.all(decorates.map(async (decorate) => {
                if (decorate.DecorateId) {
                    decorate.name = decorate.DecorateId.name;
                    decorate.price = decorate.DecorateId.price;
                    decorate.imageUrl = decorate.DecorateId.imageUrl;
                    await decorate.save();
                }
            }));

            // Cập nhật thông tin tĩnh cho presents
            await Promise.all(presents.map(async (present) => {
                if (present.PresentId) {
                    present.name = present.PresentId.name;
                    present.price = present.PresentId.price;
                    present.imageUrl = present.PresentId.imageUrl;
                    await present.save();
                }
            }));
        }

        // Tính totalPrice và priceDifference
        await this.calculateTotalPrice();
        this.priceDifference = (this.planprice || 0) - (this.totalPrice || 0);

        next();
    } catch (error) {
        console.error(`Lỗi trong middleware pre('save') cho plan ${this._id}:`, error);
        next(error);
    }
});

// Middleware tính toán priceDifference
planSchema.pre('save', async function (next) {
    try {
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
    if (!this.name) {
        const userPlanCount = await mongoose.model('Plan').countDocuments({ UserId: this.UserId });
        this.name = `Plan số ${userPlanCount + 1}`;
    }
    next();
});

// Phương thức tính totalPrice dựa trên plansoluongkhach
planSchema.methods.calculateTotalPrice = async function (plansoluongkhach = this.plansoluongkhach) {
    try {
        if (!this.SanhId) {
            console.warn(`SanhId không tồn tại cho plan ${this._id}`);
            this.totalPrice = 0;
            return this.totalPrice;
        }

        if (!plansoluongkhach || plansoluongkhach <= 0) {
            console.warn(`plansoluongkhach không hợp lệ cho plan ${this._id}: ${plansoluongkhach}`);
            plansoluongkhach = 0;
        }

        const soLuongBan = plansoluongkhach ? Math.ceil(plansoluongkhach / 10) : 0;

        const [sanh, caterings, decorates, presents] = await Promise.all([
            Sanh.findById(this.SanhId, 'price').lean(),
            Plan_catering.find({ PlanId: this._id }).populate('CateringId', 'price').lean(),
            Plan_decorate.find({ PlanId: this._id }).populate('DecorateId', 'price').lean(),
            Plan_present.find({ PlanId: this._id }).populate('PresentId', 'price').lean(),
        ]);

        // Kiểm tra trạng thái để quyết định lấy giá từ đâu
        const isDeposited = this.status === 'Đã đặt cọc';

        // Tính tổng giá catering
        const totalCateringPrice = soLuongBan > 0
            ? caterings.reduce((sum, item) => {
                  const price = isDeposited && item.price ? item.price : (item.CateringId?.price || 0);
                  return sum + (price * soLuongBan);
              }, 0)
            : 0;

        // Tính tổng giá decorate
        const totalDecoratePrice = decorates.reduce((sum, item) => {
            const price = isDeposited && item.price ? item.price : (item.DecorateId?.price || 0);
            return sum + price;
        }, 0);

        // Tính tổng giá presents
        const totalPresentPrice = presents.reduce((sum, item) => {
            const price = isDeposited && item.price ? item.price : (item.PresentId?.price || 0);
            const quantity = item.quantity || 1;
            return sum + (price * quantity);
        }, 0);

        // Tính totalPrice
        this.totalPrice = (sanh?.price || 0) + totalCateringPrice + totalDecoratePrice + totalPresentPrice;

        console.log(`Calculated totalPrice for plan ${this._id}:`, {
            sanhPrice: sanh?.price || 0,
            totalCateringPrice,
            totalDecoratePrice,
            totalPresentPrice,
            totalPrice: this.totalPrice,
            plansoluongkhach,
            soLuongBan,
            isDeposited,
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