var express = require('express');
var router = express.Router();
const User = require('../models/userModel');


/* GET users listing. */
router.get('/', function(req, res, next) {
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
     const users = await User.find(); // Lấy tất cả người dùng từ database
     res.status(200).json(users); // Trả về danh sách người dùng dưới dạng JSON
  } catch (err) {
     res.status(500).json({ message: 'Lỗi khi lấy danh sách người dùng', error: err });
  }
});

//register user
//http://localhost:2025/users/register
// router.post('/register', async (req, res) => {
//   const { name, email, password, phone, address, role, avatar } = req.body;
  
//   try {
//     const newUser = new User ({name, email, password, phone, address, role, avatar});
//     await newUser.save();
//     res.status(201).send('User created successfully');
//   } catch (error) {
//     res.status(400).send('Error creating user');
//   }
// });

//login user
//http://localhost:2025/users/login
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
              populate: { path: 'CateringId' } // Populate từ bảng trung gian đến Catering
          })
          .populate({
              path: 'Decorate_orders',
              populate: { path: 'DecorateId' } // Populate từ bảng trung gian đến Decorate
          })
          .populate({
              path: 'Lobby_orders',
              populate: { path: 'LobbyId' } // Populate từ bảng trung gian đến Sanh
          })
          .populate({
              path: 'Present_orders',
              populate: { path: 'PresentId' } // Populate từ bảng trung gian đến Present
          });

      if (!user) {
          return res.status(404).json({ status: false, message: "Không tìm thấy user" });
      }

      res.status(200).json({ status: true, message: "Lấy thông tin user thành công", data: user });
  } catch (error) {
      res.status(500).json({ status: false, message: "Lỗi server", error: error.message });
  }
});

// PATCH /users/update/:id
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
      if (user.password !== oldPassword) { // Lưu ý: Trong môi trường production, nên dùng bcrypt để so sánh hash
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
      // Trong production, bạn nên hash mật khẩu mới (ví dụ sử dụng bcrypt)
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



module.exports = router;
