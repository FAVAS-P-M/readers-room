var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require("dotenv").config();

var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');

var hbs = require('express-handlebars')
var bodyParser = require('body-parser');
bodyParser.json()

var app = express();
// var fileUpload = require('express-fileupload')
var db = require('./config/connection')
var session = require('express-session')


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({
  extname: 'hbs', helpers: {
    amount: (price, qty) => (price * qty), counter: (index) => index + 1,
    findDisc(disc,price){
      let final=price*(100-disc)/100;
      return final
    },
    offerCheck(date){
let today=new Date()
if(today<=date){
  return true
}else{
  return false
}
    },
    showOffer:function(offerStart,offerEnd,offer){
      let today=new Date()
      let start=new Date(offerStart)
      let end=new Date(offerEnd)
      if(today>=start&&today<=end && offer>0){
        let show="  " + offer+" %off"
return show
      }else{
        return ""
      }
    },
    showPrice:function(offerStart,offerEnd,offer,Price){
      let today=new Date()
      let start=new Date(offerStart)
      let end=new Date(offerEnd)
      if(today>=start&&today<=end && offer>0){
        return `Rs: ${Price}`
          }else{
        return ""
      }
    },

    showDiscount:function(offerStart,offerEnd,offer,Price){
      let today=new Date()
      let start=new Date(offerStart)
      let end=new Date(offerEnd)
      if(today>=start&&today<=end && offer>0){
        let discPrice=Price*(100-offer)/100;
      
      
        return `Discount Price: Rs: ${discPrice}`
          }else{
        return ""
      }
    }
  }, defaultLayout: 'layout', layoutsDir: __dirname + '/views/layout/', partialsDir: __dirname + '/views/partials/'
}))

// app.use(logger('dev'));
// app.use(express.json());
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser());
// app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));
// app.use(fileUpload())

app.use(logger('dev'));
app.use(express.json({limit:"50mb"}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
// app.use(fileUpload())
app.use(session({ secret: "KEY", cookie: { maxAge: 600000 } }))
db.connect((err) => {
  if (err)
    console.log('Connection error' + err)
  else
    console.log('database connected')
})
// app.use(function (req, res, next) {
//   res.set('Cache-Control', 'no-cache,private,no-Store,must-revalidate,max-stale=0,post-check=0,pre-check=0')
//   next();
// })


app.use((req,res,next)=>{
  if((!req,res)){
    res.header("cache-control","private,no-cache,no-store,must revalidate");
    res.header("Express","-3");
  }
  next();
})



app.use('/', userRouter);
app.use('/admin', adminRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
