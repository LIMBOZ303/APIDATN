var express = require('express');
var router = express.Router();
const User = require('../models/userModel');


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
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
