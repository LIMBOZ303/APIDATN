var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var weddingorderRouter = require('./routes/weddingorder');
var planRouter = require('./routes/plan');
var clothesRouter = require('./routes/clothes');
var invitationRouter = require('./routes/invitation');
var hallRouter = require('./routes/weddinghall');
var cateringRouter = require('./routes/catering');
var flowerRouter = require('./routes/flower');
var CateClothesRouter = require('./routes/category_clothes')
var lobbyRouter = require('./routes/lobby')
var style_cardRouter = require('./routes/Style_card');
var cate_cateringRouter = require('./routes/cate_catering');
var plan_clothesRouter = require('./routes/plan_clothes');
var clothes_orderRouter = require('./routes/clothes_order')
var invitationCard_orderRouter = require('./routes/invitationCard_order')
var weddingHall_orderRouter = require('./routes/weddingHall_order')
var catering_orderRouter = require('./routes/catering_order')
var weddingFlower_orderRouter = require('./routes/weddingFlower_order')


var app = express();
app.use(express.json());//xử lý json

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/weddingorder', weddingorderRouter);
app.use('/plan', planRouter);
app.use('/clothes', clothesRouter);
app.use('/invitation', invitationRouter);
app.use('/hall',hallRouter );
app.use('/catering', cateringRouter);
app.use('/flower', flowerRouter);
app.use('/cate_clothes', CateClothesRouter);
app.use('/lobby', lobbyRouter);
app.use('/style_card',style_cardRouter);
app.use('/cate_catering',cate_cateringRouter);
app.use('/plan_clothes', plan_clothesRouter)
app.use('/clothes_order', clothes_orderRouter)
app.use('/invitationCard_order', invitationCard_orderRouter)
app.use('/weddingHall_order', weddingHall_orderRouter)
app.use('/catering_order', catering_orderRouter)
app.use('/weddingFlower_order', weddingFlower_orderRouter)



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
