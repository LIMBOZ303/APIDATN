var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');
const hbs = require('hbs'); 
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var planRouter = require('./routes/plan');
var cateringRouter = require('./routes/catering');
var lobbyRouter = require('./routes/lobby')
var cate_cateringRouter = require('./routes/cate_catering');
var catering_orderRouter = require('./routes/catering_order')
var cate_decorateRouter = require('./routes/cate_decorate')
var cate_presentRouter = require('./routes/cate_present')
var decorateRouter = require('./routes/decorate')
var presentRouter = require('./routes/present')
var favorteRouter = require('./routes/Favorite')
var authRouter = require('./routes/auth')

var app = express();
app.use(express.json());
const cors = require('cors');
require('dotenv').config();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

hbs.registerHelper('extend', function(name, context) {
    let out = context.fn(this);
    if (typeof this.blocks === 'undefined') {
        this.blocks = {};
    }
    this.blocks[name] = out;
    return null;
});

// Helper để render block
hbs.registerHelper('block', function(name) {
    return (this.blocks && this.blocks[name]) ? this.blocks[name] : '';
});

app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/plan', planRouter);
app.use('/catering', cateringRouter);
app.use('/lobby', lobbyRouter);
app.use('/cate_catering', cate_cateringRouter);
app.use('/catering_order', catering_orderRouter)
app.use('/cate_decorate', cate_decorateRouter)
app.use('/cate_present', cate_presentRouter)
app.use('/decorate', decorateRouter)
app.use('/present', presentRouter)
app.use('/favorite', favorteRouter)
app.use('/auth', authRouter)



// mongodb+srv://tran07hieu:beVLTEzrT7C0eCzZ@cluster0.tnems.mongodb.net/userDB
// mongoose.connect('mongodb://localhost:27017/userDB')
mongoose.connect('mongodb+srv://tran07hieu:beVLTEzrT7C0eCzZ@cluster0.tnems.mongodb.net/userDB')
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.error('Error connecting to MongoDB:', err);
    });

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;