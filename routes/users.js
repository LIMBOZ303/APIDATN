var express = require('express');
var router = express.Router();
const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');

const Plan = require('../models/planModel'); // Import Plan model


/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

router.post('/add', async function (req, res, next) {
  try {
    const { name, email, password } = req.body;

    // Kiểm tra xem tài khoản đã tồn tại hay chưa
    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      // Nếu tài khoản đã tồn tại
      return res.status(400).json({
        status: false,
        message: "Email đã tồn tại. Vui lòng sử dụng email khác."
      });
    }

    // Nếu tài khoản chưa tồn tại, tạo tài khoản mới
    const addItem = { name, email, password };
    await User.create(addItem);

    res.status(200).json({
      status: true,
      message: "Thêm tài khoản thành công"
    });

  } catch (e) {
    console.error("Lỗi thêm tài khoản:", e);
    res.status(400).json({
      status: false,
      message: "Thất bại"
    });
  }
});

router.get('/all', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách người dùng', error: err });
  }
});

router.post("/login", async function (req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ status: false, message: "Sai email hoặc mật khẩu" });
    }

    // Kiểm tra mật khẩu
    if (password !== user.password) {
      return res
        .status(400)
        .json({ status: false, message: "Sai email hoặc mật khẩu" });
    }

    res.status(200).json({
      status: true,
      message: "Đăng nhập thành công",
      user,
    });
  } catch (e) {
    res
      .status(400)
      .json({ status: false, message: "Thất bại", error: e.message });
  }
});

router.get('/favorite/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate({
        path: 'Catering_orders',
        populate: { path: 'CateringId' }
      })
      .populate({
        path: 'Decorate_orders',
        populate: { path: 'DecorateId' }
      })
      .populate({
        path: 'Lobby_orders',
        populate: { path: 'LobbyId' }
      })
      .populate({
        path: 'Present_orders',
        populate: { path: 'PresentId' }
      });

    if (!user) {
      return res.status(404).json({ status: false, message: "Không tìm thấy user" });
    }

    res.status(200).json({ status: true, message: "Lấy thông tin user thành công", data: user });
  } catch (error) {
    res.status(500).json({ status: false, message: "Lỗi server", error: error.message });
  }
});


router.get('/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ status: false, message: "Không tìm tài khoản" });
        }
        res.status(200).json({ status: true, message: " thành công", data: user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Lỗi " });
    }
});

router.patch('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Lấy các trường có thể cập nhật từ request body
    const { name, email, password, oldPassword, phone, address, avatar } = req.body;

    // Tìm user theo id
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ status: false, message: 'Không tìm thấy người dùng' });
    }

    // Nếu cập nhật email hoặc mật khẩu, cần kiểm tra mật khẩu cũ
    if ((email && email !== user.email) || password) {
      if (!oldPassword) {
        return res.status(400).json({ status: false, message: 'Vui lòng nhập mật khẩu cũ để xác nhận thay đổi' });
      }
      if (user.password !== oldPassword) {
        return res.status(400).json({ status: false, message: 'Mật khẩu cũ không chính xác' });
      }
    }

    // Cập nhật các trường nếu có giá trị mới
    if (name) user.name = name;
    if (email && email !== user.email) user.email = email;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (avatar) user.avatar = avatar;
    if (password) {
      user.password = password;
    }

    await user.save();

    res.status(200).json({
      status: true,
      message: 'Cập nhật người dùng thành công',
      user
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
});

// API để lưu giao dịch

router.post('/transactions', async (req, res) => {
  try {
    const { planId, userId, depositAmount, orderCode } = req.body; // Thêm orderCode nếu cần
    console.log('Dữ liệu nhận được:', { planId, userId, depositAmount, orderCode });

    // Kiểm tra dữ liệu đầu vào
    if (!planId || !userId || !depositAmount) {
      return res.status(400).json({ status: false, message: 'Thiếu thông tin bắt buộc' });
    }

    // Kiểm tra user có tồn tại
    const user = await User.findById(userId);
    if (!user) {
      console.log('Không tìm thấy user với ID:', userId);
      return res.status(404).json({ status: false, message: 'Không tìm thấy người dùng' });
    }

    // Kiểm tra plan có tồn tại
    const plan = await Plan.findById(planId);
    if (!plan) {
      console.log('Không tìm thấy plan với ID:', planId);
      return res.status(404).json({ status: false, message: 'Không tìm thấy kế hoạch' });
    }

    // Tạo transaction mới với status: 'pending'
    const transaction = new Transaction({
      planId,
      userId,
      depositAmount,
      orderCode, // Lưu orderCode từ PayOS nếu có
      status: 'pending', // Đặt status là 'pending' vì đã đặt cọc
    });
    await transaction.save();

    // Cập nhật status của Plan thành 'pending'
    plan.status = 'pending';
    await plan.save();

    res.status(201).json({
      status: true,
      message: 'Giao dịch đã được tạo và đang chờ xác nhận',
      data: transaction,
    });
  } catch (error) {
    console.error('Lỗi chi tiết khi lưu giao dịch:', error.stack);
    res.status(500).json({
      status: false,
      message: 'Lỗi server',
      error: error.message,
    });
  }
});
// API để lấy danh sách giao dịch (chỉ admin mới có quyền truy cập)
router.get('/get/transactions', async (req, res) => {
  try {
    // Lấy userId và role từ header
    const userId = req.headers['user-id'];
    const role = req.headers['user-role'];

    if (!userId || !role) {
      return res.status(401).json({ status: false, message: 'Thiếu thông tin userId hoặc role' });
    }

    // Kiểm tra xem user có tồn tại và role có đúng không
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: false, message: 'Không tìm thấy người dùng' });
    }

    if (role !== user.role || role !== 'admin') {
      return res.status(403).json({ status: false, message: 'Chỉ admin mới có quyền truy cập' });
    }

    const transactions = await Transaction.find().populate('userId', 'name email');
    res.status(200).json({
      status: true,
      message: 'Lấy danh sách giao dịch thành công',
      data: transactions,
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách giao dịch:', error);
    res.status(500).json({
      status: false,
      message: 'Lỗi server',
      error: error.message,
    });
  }
});

// API để admin xác nhận giao dịch

router.patch('/transactions/:id/confirm', async (req, res) => {
  try {
    const userId = req.headers['user-id'];
    const role = req.headers['user-role'];

    if (!userId || !role) {
      return res.status(401).json({ status: false, message: 'Thiếu thông tin userId hoặc role' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: false, message: 'Không tìm thấy người dùng' });
    }

    if (role !== user.role || role !== 'admin') {
      return res.status(403).json({ status: false, message: 'Chỉ admin mới có quyền truy cập' });
    }

    const { id } = req.params;

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ status: false, message: 'Không tìm thấy giao dịch' });
    }

    // Cập nhật status của Transaction
    transaction.status = 'active';
    await transaction.save();

    // Đồng bộ status của Plan
    const plan = await Plan.findById(transaction.planId);
    if (plan) {
      plan.status = 'active';
      await plan.save();
      console.log(`Đã cập nhật status của Plan ${plan._id} thành active`);
    } else {
      console.warn(`Không tìm thấy Plan với ID ${transaction.planId}`);
    }

    res.status(200).json({
      status: true,
      message: 'Giao dịch đã được xác nhận',
      transaction,
    });
  } catch (error) {
    console.error('Lỗi khi xác nhận giao dịch:', error);
    res.status(500).json({
      status: false,
      message: 'Lỗi server',
      error: error.message,
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra user có tồn tại không
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ status: false, message: "Không tìm thấy người dùng" });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({ status: true, message: "Xóa người dùng thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa người dùng:", error);
    res.status(500).json({ status: false, message: "Lỗi server", error: error.message });
  }
});


module.exports = router;