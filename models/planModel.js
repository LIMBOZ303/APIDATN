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
    status: { 
        type: String, 
        enum: ['Đã đặt cọc', 'Đang chờ', 'Chưa đặt cọc', 'Đã hủy', 'Đang chờ xác nhận'], 
        default: 'Đang chờ xác nhận' 
    },
    planprice: { type: Number, required: false },
    plansoluongkhach: { type: Number, required: false },
    plandateevent: { type: Date, required: false, index: true },
    caterings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plan_Catering' }],
    decorates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plan_decorate' }],
    presents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plan_PresentSchema' }],
    priceDifference: { type: Number, default: 0 },
    originalPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
    isTemporary: { type: Boolean, default: false },
    lockedData: { 
        type: {
            sanh: { type: Object, default: null }, // Lưu thông tin sảnh cố định
            caterings: [{ type: Object, default: null }], // Lưu danh sách catering cố định
            decorates: [{ type: Object, default: null }], // Lưu danh sách decorate cố định
            presents: [{ type: Object, default: null }], // Lưu danh sách present cố định
            totalPrice: { type: Number, default: 0 }, // Lưu totalPrice cố định
            plansoluongkhach: { type: Number, default: 0 }, // Lưu số lượng khách cố định
            plandateevent: { type: Date, default: null }, // Lưu ngày sự kiện cố định
            name: { type: String, default: null } // Lưu tên kế hoạch cố định
        },
        default: null 
    }
}, { timestamps: true });


// Middleware để lưu dữ liệu cố định khi chuyển sang trạng thái "Đã đặt cọc"
planSchema.pre('save', async function (next) {
    try {
        // Nếu trạng thái chuyển sang "Đã đặt cọc" và chưa có lockedData
        if (this.isModified('status') && this.status === 'Đã đặt cọc' && !this.lockedData) {
            const populatedPlan = await mongoose.model('Plan').findById(this._id)
                .populate('SanhId', 'name price imageUrl SoLuongKhach')
                .populate({
                    path: 'caterings',
                    populate: { path: 'CateringId', select: 'name price imageUrl cate_cateringId' }
                })
                .populate({
                    path: 'decorates',
                    populate: { path: 'DecorateId', select: 'name price imageUrl Cate_decorateId' }
                })
                .populate({
                    path: 'presents',
                    populate: { path: 'PresentId', select: 'name price imageUrl Cate_presentId' }
                });

            this.lockedData = {
                sanh: populatedPlan.SanhId ? {
                    _id: populatedPlan.SanhId._id,
                    name: populatedPlan.SanhId.name,
                    price: populatedPlan.SanhId.price,
                    imageUrl: populatedPlan.SanhId.imageUrl,
                    SoLuongKhach: populatedPlan.SanhId.SoLuongKhach
                } : null,
                caterings: populatedPlan.caterings.map(item => ({
                    _id: item.CateringId?._id,
                    name: item.CateringId?.name,
                    price: item.CateringId?.price,
                    imageUrl: item.CateringId?.imageUrl,
                    cate_cateringId: item.CateringId?.cate_cateringId
                })),
                decorates: populatedPlan.decorates.map(item => ({
                    _id: item.DecorateId?._id,
                    name: item.DecorateId?.name,
                    price: item.DecorateId?.price,
                    imageUrl: item.DecorateId?.imageUrl,
                    Cate_decorateId: item.DecorateId?.Cate_decorateId
                })),
                presents: populatedPlan.presents.map(item => ({
                    _id: item.PresentId?._id,
                    name: item.PresentId?.name,
                    price: item.PresentId?.price,
                    imageUrl: item.PresentId?.imageUrl,
                    quantity: item.quantity || 1,
                    Cate_presentId: item.PresentId?.Cate_presentId
                })),
                totalPrice: this.totalPrice,
                plansoluongkhach: this.plansoluongkhach,
                plandateevent: this.plandateevent,
                name: this.name
            };
        }

        // Tính totalPrice nếu không ở trạng thái "Đã đặt cọc"
        if (this.status !== 'Đã đặt cọc') {
            await this.calculateTotalPrice();
            this.priceDifference = (this.planprice || 0) - (this.totalPrice || 0);
        }

       

        next();
    } catch (error) {
        console.error(`Lỗi trong middleware pre('save') cho plan ${this._id}:`, error);
        next(error);
    }
});

// Ngăn chặn cập nhật dữ liệu nếu ở trạng thái "Đã đặt cọc"
planSchema.pre('save', async function (next) {
    if (this.status === 'Đã đặt cọc' && this.isModified() && !this.isModified('status')) {
        return next(new Error('Không thể chỉnh sửa dữ liệu của kế hoạch đã đặt cọc.'));
    }
    next();
});


// Sử dụng lockedData nếu kế hoạch đã đặt cọc
planSchema.methods.getLockedData = async function () {
    if (this.status === 'Đã đặt cọc' && this.lockedData) {
        return {
            ...this.toObject(),
            SanhId: this.lockedData.sanh,
            caterings: this.lockedData.caterings,
            decorates: this.lockedData.decorates,
            presents: this.lockedData.presents,
            totalPrice: this.lockedData.totalPrice,
            plansoluongkhach: this.lockedData.plansoluongkhach,
            plandateevent: this.lockedData.plandateevent,
            name: this.lockedData.name
        };
    }
    // Nếu không phải "Đã đặt cọc", lấy dữ liệu mới từ server
    const populatedPlan = await mongoose.model('Plan').findById(this._id)
        .populate('SanhId', 'name price imageUrl SoLuongKhach')
        .populate('UserId', 'name email')
        .populate({
            path: 'caterings',
            populate: { path: 'CateringId', select: 'name price imageUrl cate_cateringId' }
        })
        .populate({
            path: 'decorates',
            populate: { path: 'DecorateId', select: 'name price imageUrl Cate_decorateId' }
        })
        .populate({
            path: 'presents',
            populate: { path: 'PresentId', select: 'name price imageUrl Cate_presentId' }
        });

    return {
        ...populatedPlan.toObject(),
        caterings: populatedPlan.caterings.map(item => item.CateringId),
        decorates: populatedPlan.decorates.map(item => item.DecorateId),
        presents: populatedPlan.presents.map(item => ({
            ...item.PresentId?.toObject(),
            quantity: item.quantity || 1
        }))
    };
};

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
// Cập nhật phương thức calculateTotalPrice
planSchema.methods.calculateTotalPrice = async function (plansoluongkhach = this.plansoluongkhach) {
    if (this.status === 'Đã đặt cọc' && this.lockedData) {
        this.totalPrice = this.lockedData.totalPrice;
        return this.totalPrice;
    }

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

        const [sanh, caterings, decorates, presents] = await Promise.all([
            Sanh.findById(this.SanhId, 'price').lean(),
            Plan_catering.find({ PlanId: this._id }).populate('CateringId', 'price').lean(),
            Plan_decorate.find({ PlanId: this._id }).populate('DecorateId', 'price').lean(),
            Plan_present.find({ PlanId: this._id }).populate('PresentId', 'price').lean(),
        ]);

        const soLuongBan = plansoluongkhach ? Math.ceil(plansoluongkhach / 10) : 0;

        const totalCateringPrice = soLuongBan > 0
            ? caterings.reduce((sum, item) => {
                  const price = item.CateringId?.price || 0;
                  return sum + (price * soLuongBan);
              }, 0)
            : 0;

        const totalDecoratePrice = decorates.reduce((sum, item) => {
            const price = item.DecorateId?.price || 0;
            return sum + price;
        }, 0);

        const totalPresentPrice = presents.reduce((sum, item) => {
            const price = item.PresentId?.price || 0;
            const quantity = item.quantity || 1;
            return sum + (price * quantity);
        }, 0);

        this.totalPrice = (sanh?.price || 0) + totalCateringPrice + totalDecoratePrice + totalPresentPrice;

        console.log(`Calculated totalPrice for plan ${this._id}:`, {
            sanhPrice: sanh?.price || 0,
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