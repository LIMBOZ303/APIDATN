var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

// Route cho trang chat của admin
router.get('/admin-chat', function(req, res, next) {
  res.render('admin-chat');
});

module.exports = router;
