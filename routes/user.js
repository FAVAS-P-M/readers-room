var express = require("express");
var router = express.Router();
const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const paypal = require("paypal-rest-sdk");

paypal.configure({
  mode: "sandbox",
  client_id:
    "AdloDndjYRRRK0N4hTdY4HvjJcH0coASlaDqmHoKLbYUVAjQm03zNWOmAmVKxHzkY9xL_aNYd46__Pkv",
  client_secret:
    "EKmiR9DC7GFDjD0CvXd6Kjn2MVIf6iEDJDVS-w5diQGqXXQ-f9UI5git1Q1HTGGq1McGXh27PV7FgyhX",
});

// const serviceSID = process.env.TWILIO_SERVICEID;
const serviceSID = process.env.SERVICESID
const accountnSID = process.env.ACCOUNTNSID
const authToken = process.env.AUTHTOKEN
const client = require("twilio")(accountnSID, authToken);
var db = require("../config/connection");
const collections = require("../config/collections");
const { ObjectId } = require("mongodb");
const { response } = require("../app");


const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    res.render("user/login");
  }
};

/* GET home page. */
router.get("/", async function (req, res, next) {
  let user = req.session.user;
  console.log(user);
  let coupon=req.session.coupon
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }

  productHelpers.getAllProducts().then(async (products) => {

  
    let categories = await userHelpers.getCategories();
    res.render("user/view-products", { products, user, cartCount, categories,coupon });
  });
});

router.get("/category-products/:name", async function (req, res, next) {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  userHelpers.getAllCategoryProducts(req.params.name).then(async (products) => {
    let categories = await userHelpers.getCategories();
    res.render("user/view-products", { products, user, cartCount, categories });
  });
});

router.get("/login", (req, res) => {
  if (req.session.loggedIn) {
    res.redirect("/");

  } else {
    res.render("user/login", { loginErr: req.session.loginErr });
    req.session.loginErr = false;
  }
});
  
let message2;

router.get("/signup/:id", (req, res) => { let referral=""
  if(req.params.id){
   referral=req.params.id
  }else{
     referral=""
  }
  res.render("user/signup",{referral,message2});
  message2=""
});

router.post("/signup/:id", (req, res) => { 
  let refer=""
  if(req.params.id){
     refer=req.params.id
  }else{
     refer=null
  }
  userHelpers.doSignup(req.body,refer).then((response) => {
    if (response) {
      req.session.user = response;
      req.session.loggedIn = true;
res.redirect('/')
    } else {
      res.redirect("/signup/null");
    }
  }).catch(()=>{
     message2="user already exists"
    res.redirect("/signup/null");
  })
});

router.post("/login",(req, res) => {   
  userHelpers.doLogin(req.body).then(async(response) => {
    if (response.status && response.status != "blocked") {

      let coupon=await userHelpers.getCoupon()
      let Coupon=coupon[0] ? coupon[0]:""
      req.session.coupon=Coupon.Coupon

      req.session.user = response.user;
      req.session.loggedIn = true;
      console.log(response.user);

      res.redirect("/");
    } else {
      if (response.status == "blocked") {
        Message = "User is Blocked";
      } else {
        Message = "invalid UserName or Password";
      }
      res.render("user/login", { Message });
      Message = "";
    }
  });
});

router.get("/logout", (req, res) => {
  req.session.user = null;
  req.session.LoggedIn = false;
  req.session.destroy();
  res.redirect("/");
});

//---------------------------otp department--------------------------------

router.get("/otp-login", (req, res) => {
  res.render("user/otp-login");
});

router.post("/otp-login", (req, res) => {
  req.session.number = req.body.number;
  console.log("number", req.body.number);
  userHelpers.findUser(req.body.number).then((resolve) => {
    console.log("resolve");
    if (resolve) {
      client.verify
        .services(serviceSID)
        .verifications.create({
          to: `+91${req.body.number}`,
          channel: "sms",
        })
        .then(() => {
          res.render("user/otp-submit");
        });
    } else {
      message = "number is not valid";
      res.render("user/otp-login", { message });
    }
  });
});

// otp enterring form

router.get("/otp-submit", (req, res) => {
  res.render("user/otp-submit");
});

router.post("/otp-submit", (req, res) => {
  let otp = req.body.otp;
  let number = req.session.number;
  console.log("thyyyy", number, otp);
  client.verify
    .services(serviceSID)
    .verificationChecks.create({
      to: `+91${number}`,
      code: otp,
    })
    .then((resp) => {
      if (resp.valid) {
        userHelpers.findUser(number).then((resolve) => {
          req.session.user = resolve;
          req.session.loggedIn = true;

          res.redirect("/"); 
        });
      } else {
        message = "Invalid OTP";
        res.render("user/otp-submit", { message });
      }
    });
});

//---------------------showing details page of books------------------------------------

router.get("/alldetails/:id", function (req, res, next) {
  let proid = req.params.id;
  userHelpers.getAlldetails(proid).then((product) => {
    res.render("user/template", { product });
  });
});

//------------------------------------cart department---------------------------------------------

router.get("/cart", verifyLogin, async (req, res, next) => {
  let products = await userHelpers.getCartProducts(req.session.user._id);
  let totalValue = await userHelpers.getTotalAmount(req.session.user._id);

  let userid = req.session.user._id;
  let user = req.session.user;
  req.session.product = products;
  cartCount = await userHelpers.getCartCount(req.session.user._id);
  res.render("user/cart", { products, totalValue, userid, cartCount, user});
});

router.get("/add-to-cart/:id", (req, res) => {

  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true });
  });
});
router.post("/change-product-quantity", (req, res) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user);
    res.json(response);
  });
});

router.get("/delete-cart-item/:id", verifyLogin, (req, res) => {
  userHelpers.deleteCartItem(req.params.id, req.session.user._id).then(() => {
    res.redirect("/cart");
  });
});

//-------------------------------place-order department-----------------------------------

router.get("/place-order", verifyLogin, async (req, res) => {
  let userId = req.session.user._id;
  let todayDate = new Date().toISOString().slice(0, 10);
  let discount=await userHelpers.getTotalDiscount(userId,todayDate)
  discount=discount/100;
  let user = req.session.user;
  let total = await userHelpers.getTotalAmount(userId);
  req.session.total = total;
  let finalPrice;
  if(discount){
    finalPrice=total-discount;
  }else{
    finalPrice=total;
  }

   req.session.discount=discount
  req.session.final=finalPrice
  let userDetails = await userHelpers.getUserData(req.session.user._id);
  const products = req.session.product;
  res.render("user/place-order", { products, total, user, userDetails,finalPrice,discount});
});



router.post("/place-order", async (req, res) => {
  var totalPrice;
  if (req.session.couponTotal || req.session.walletTotal) {
    if (req.session.couponTotal) {
      var totalPrice = req.session.couponTotal;
    } else {
      var totalPrice = req.session.walletTotal;
    }
  } else {
    totalPrice = await userHelpers.getTotalAmount(req.session.user._id);
  }
 let details = req.body;
  const id = req.body.id;
  let user = req.session.user;
  let products = await userHelpers.getCartProductList(id);
   let oldPrice=req.session.total            
  if (req.body["paymentMethod"] == "COD") {
    var orderId = await userHelpers.placeOrder(
      id,
      details,
      products,
      totalPrice,
    );
    if (orderId) {
     req.session.orderId=orderId
      await  db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:req.session.orderId},{$set:{finalPrice:req.session.final}}).then((res)=>{
        })
       let details = await db
        .get()
        .collection(collections.ORDER_COLLECTION)
        .find({ userId: ObjectId(id) })
        .toArray();
       
      res.json({ codstatus: true });
      res.render("user/order-success", { details, user, totalPrice });
    }
  } else if (req.body["paymentMethod"] == "razorpay") {
    await userHelpers
      .placeOrder(id, details, products, totalPrice)
      .then(async (orderId) => {
        let details = await db
          .get()
          .collection(collections.ORDER_COLLECTION)
          .find({ userId: ObjectId(id) })
          .toArray();
        await userHelpers
          .generateRazorpay(orderId, totalPrice) 
          .then((response) => {
            res.json({ razstatus: true, response });
          });
      });
  } else if (req.body["paymentMethod"] == "paypal") {
    console.log("paypaaal...");
    await userHelpers
    .placeOrder(id, details, products, totalPrice)
    .then(async (orderId) => {
      let details = await db
        .get()
        .collection(collections.ORDER_COLLECTION)
        .find({ userId: ObjectId(id) })
        .toArray();
    })
    


    val = totalPrice / 74;
    totalPrice = val.toFixed(2);
    let totals = totalPrice.toString();
    req.session.total = totals;
    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: "http://localhost:3001/order-success",
        cancel_url: "http://localhost:3001/admin",
      },
      transactions: [
        {
          item_list: {
            items: [
              {
                name: "Cart items",
                sku: "001",
                price: totals,
                currency: "USD",
                quantity: 1,
              },
            ],
          },
          amount: {
            currency: "USD",
            total: totals,
          },
          description: "Hat for the best team ever",
        },
      ],
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
        throw error;
      } else {
        for (let i = 0; i < payment.links.length; i++) {
          if (payment.links[i].rel === "approval_url") {
            let url = payment.links[i].href;
            res.json({ url });
            // res.redirect(url);
          } else {
            console.log("errr");
          }
        }
      }
    });
  }

  console.log(details);
});

//---------------------------------------------------Coupons----------------------------------------

router.post("/couponApply", verifyLogin, (req, res) => {
  let id = req.session.user._id;
  userHelpers.couponValidate(req.body, id).then(async(response) => {
  req.session.couponTotal = response.total;

    if (response.success) {
      req.session.couponCode = req.body.Coupon;
      req.session.couponApplied = true;

     
      res.json({
        couponSuccess: true,
        total: response.total,
        oldTotal: response.oldTotal,
      });
    } else if (response.couponUsed) {
      res.json({ couponUsed: true });
    } else if (response.couponExpired) {
      res.json({ couponExpired: true });
    } else {
      res.json({ invalidCoupon: true });
    }
  });
});

router.post("/verify-payment", async function (req, res) {
  console.log("verify reached");
  console.log(req.body["order[receipt]"]);
  userHelpers
    .verifyPayment(req.body)
    .then(() => {
      userHelpers
        .changeOrderStatus(req.body["order[receipt]"])
        .then(() => {
          console.log("json true");
          res.json({ status: true });
        })
        .catch(() => {
          console.log("json errrrr");
          res.json({ status: false });
        });
    })
    .catch((err) => {
      console.log(err);
    });
});

//------------------------user-profile department-------------------------------------------

router.get("/user-profile", verifyLogin, async (req, res) => {
  let id = req.session.user._id;
  let user = await userHelpers.getUserDetails(id)
res.render("user/user-profile", { user });
});


router.post("/user-profile/:id", (req, res) => {
  console.log(req.body);
  userHelpers.updateProfile(req.body, req.params.id).then(async (response) => {
    let user = await userHelpers.getUserData(req.session.user._id);
    req.session.user = user;
    res.render("user/user-profile", { user });
  });
});

//-------------------------------order department------------------------------------------------

router.get("/order-success", verifyLogin, (req, res) => {
  if (req.session.couponApplied) {
    productHelpers
      .userAddCoupon(req.session.user._id, req.session.couponCode)
      .then(() => {});
  }
  userHelpers.clearCart(req.session.user._id).then(() => {
    res.render("user/order-success", { user: req.session.user });
  });
});

router.get("/orders", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let id = req.session.user._id;
  let total = req.session.total;
  console.log("checktotal",total)
  let discount=req.session.discount
  let finalPrice=req.session.final
  let details = await db
    .get()
    .collection(collections.ORDER_COLLECTION)
    .find({ userId: ObjectId(id) })
    .sort({ date: -1 })
    .toArray();
   console.log();
  res.render("user/orders", { details, total, user,discount,finalPrice });
});

router.get("/view-order-products/:id", verifyLogin, async (req, res) => {
 let products = await userHelpers.getOrderProducts(req.params.id);
  console.log(products);
  res.render("user/view-order-products", { user: req.session.user, products });
});

//------------------------------Address department----------------------------------------------------

router.get("/add-addresses", verifyLogin, (req, res) => {
  let user = req.session.user;
  res.render("user/add-addresses", { user });
});

router.post("/add-addresses/:id", (req, res) => {
console.log(req.body.Address);
  userHelpers.addAddress(req.body.Address, req.params.id).then(async () => {
    let user = await userHelpers.getUserData(req.session.user._id);
    req.session.user = user;
    res.redirect("/place-order");
  });
});

//--------------password change department---------------------------------------

router.get("/password-change", (req, res) => {
  res.render("user/password-change");
});

router.post("/password-change", (req, res) => {
 req.session.number = req.body.number;
  userHelpers.findUser(req.body.number).then((resolve) => {
    req.session.user = resolve;
    if (resolve) {
      client.verify
        .services(serviceSID)
        .verifications.create({
          to: `+91${req.body.number}`,
          channel: "sms",
        })
        .then(() => {
          res.redirect("/passwordChange-otp");
        });
    } else {
      message = "number is not valid";
      res.render("user/password-change", { message });
    }
  });
});

router.get("/passwordChange-otp", (req, res) => {
  res.render("user/passwordChange-otp");
});

router.post("/passwordChange-otp", (req, res) => {
  console.log(req.body);
  let otp = req.body.otp;
  let number = req.session.user.numbers;
  client.verify
    .services(serviceSID)
    .verificationChecks.create({
      to: `+91${number}`,
      code: otp,
    })
    .then((resp) => {
     if (resp.valid) {
        res.redirect("/new-password");
      } else {
        message = "Invalid OTP";
        res.render("user/passwordChange-otp", { message });
      }
    });
});

router.get("/new-password", (req, res) => {
  res.render("user/new-password");
});

router.post("/new-password", async (req, res) => {
  await userHelpers.changePassword(req.body.password, req.session.user._id);
  let message = "password changed successfully";
  res.render("user/login", { message });
});

router.post("/cancel-order", (req, res) => {
let orderId = req.body.orderId;
  let Total = req.body.Total;
  var paymentMethod = req.body.Payment;
  var user = req.session.user._id;

  userHelpers.cancelOrder(orderId).then((response) => {
    if (paymentMethod == "razorpay"||"paypal") {
      userHelpers.addWallet(user, Total).then((res) => {
        var msg=`Cancelled Order${orderId} amount${Total}`
        userHelpers.walletHistory(user,msg
          ).then((res)=>{
           console.log("history",res);
          })
        });
    } else {
      console.log("error");
    }
  });
});

//-----------------------wallet--------------------------------------//
router.post("/applayWallet", async (req, res) => {
  var user = req.session.user._id;
  let ttl = parseInt(req.body.Total);
  let walletAmount = parseInt(req.body.wallet);
  let userDetails = await userHelpers.getUserData(user);
  if (userDetails.wallet >= walletAmount) {
    let total = ttl - walletAmount;
    userHelpers.applayWallet(walletAmount, user).then(() => {
      req.session.walletTotal = total;
     res.json({ walletSuccess: true, total });
    });
  } else {
    res.json({ valnotCurrect: true });
  }
});



router.get('/wallet-history',(req,res)=>{
  res.render('user/wallet-history');
})


router.get('/new-card',(req,res)=>{
  res.render('user/new-card')
})




module.exports = router;

//===================================================================================================
