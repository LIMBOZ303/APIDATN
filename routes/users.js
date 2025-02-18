var express = require('express');
var router = express.Router();
const User = require('../models/userModel');


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
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
router.post('/register', async (req, res) => {
  const { name, email, password, phone, address, role, avatar } = req.body;
  
  try {
    const newUser = new User ({name, email, password, phone, address, role, avatar});
    await newUser.save();
    res.status(201).send('User created successfully');
  } catch (error) {
    res.status(400).send('Error creating user');
  }
});

//login user
//http://localhost:2025/users/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).send('Invalid email or password');
    }
    if (user.password !== password) {
      return res.status(401).send('Invalid email or password');
    }
    res.status(200).send('Login successful');
  } catch (error) {
    res.status(500).send('Error logging in');
  }
});

module.exports = router;
