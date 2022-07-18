var express = require("express");
const { render } = require("../app");
var router = express.Router();
var productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
var db = require("../config/connection");
var collection = require("../config/collections");
var Handlebars = require("handlebars");
const store = require("../middleware/multer");
const { order } = require("paypal-rest-sdk");

Handlebars.registerHelper("inc", function (value, options) {
  return parseInt(value) + 1;
});

/* GET users listing. */

const verifyLogin = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    next();
  } else {
    res.redirect("admin-login");
  }
};

router.get("/", verifyLogin, async function (req, res, next) {
  let users = productHelpers.getAllUsers();
  let productCount = await db
    .get()
    .collection(collection.PRODUCT_COLLECTION)
    .find()
    .count();
  console.log(productCount);
  let usersCount = await db
    .get()
    .collection(collection.USER_COLLECTION)
    .find(users)
    .count();
  let orderCount = await db
    .get()
    .collection(collection.ORDER_COLLECTION)
    .find()
    .count();
  let active = await db
    .get()
    .collection(collection.USER_COLLECTION)
    .find({ blockStatus: true })
    .count();

  res.render("admin/dashboard", {
    admin: true,
    users,
    usersCount,
    orderCount,
    productCount,
    active,
  });
});
router.get("/admin-login", (req, res) => {
  res.render("admin/admin-login");
});

var Credential = {
  email: "admin@gmail.com",
  password: "12345",
};
router.post("/admin-login", function (req, res, next) {
  if (
    req.body.email == Credential.email &&
    req.body.password == Credential.password
  ) {
    req.session.adminLoggedIn = true;
    res.redirect("/admin");
   } else {
    req.session.loginErr = "Invalid username or password";
    res.redirect("admin-login");
  }
});

router.get("/admin-logout", verifyLogin, (req, res) => {
  req.session.adminLoggedIn = false;
  res.redirect("/admin");
});

router.get("/products", verifyLogin, function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    res.render("admin/view-products", { admin: true, products });
  });
});
router.get("/add-product", verifyLogin, async function (req, res) {
  let category = await db
    .get()
    .collection(collection.CATEGORY_COLLECTION)
    .find()
    .toArray();
  res.render("admin/add-product", { admin: true, category });
});

router.post("/add-product", verifyLogin,store.array("image", 4),(req, res) => {
    productHelpers.addProduct(req.body, (id) => {
      const files = req.files;
      console.log(files);
      if (!files) {
        const err=new Error("please add image")
        return next(err)
      }
        let result = files.map(async (src, index) => {
          let productImg = {
            filename: files[index].filename
          };
          productHelpers.addImages(id, productImg)
        });
        Promise.all(result).then((msg)=>{
          res.redirect('/admin/view-products')
        })
       });
  }
);

router.get("/delete-product/:id", verifyLogin, (req, res) => {
  let proId = req.params.id;
  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect("/admin/view-products");
  });
});
 
router.get("/edit-product/:id", verifyLogin, async (req, res) => {
  let item = await productHelpers.getProductDetails(req.params.id);
  let categories = await productHelpers.getCategory();
  res.render("admin/edit-product", {item, categories,admin:true });
});

router.post("/edit-product/:id",verifyLogin, (req, res) => {
 let id = req.params.id;
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    if (req.files?.Image) {
      let image = req.files.Image;
      image.mv("./public/uploads/" + id + ".jpg");
    }
    res.redirect("/admin/view-products");
  });
});

router.get("/edit-user", verifyLogin, function (req, res, next) {
  productHelpers.getAllUsers().then((users) => {
    res.render("admin/edit-user", { admin: true, users });
  });
});

router.get("/view-products", verifyLogin, (req, res) => {
  productHelpers.getAllProducts().then((products) => {
   res.render("admin/view-products", { admin: true, products });
  });
});

router.get("/block-user/:id", verifyLogin, (req, res) => {
  let id = req.params.id;
  userHelpers.blockUser(id).then(() => {
    res.redirect("/admin/edit-user");
  });
});

router.get("/unblock-user/:id", verifyLogin, (req, res) => {
  let id = req.params.id;
  userHelpers.unblockUser(id).then(() => {
    res.redirect("/admin/edit-user");
  });
});

router.get("/all-category", verifyLogin, async (req, res) => {
  let categories = await productHelpers.getCategory();
  res.render("admin/all-category", { admin: true, categories });
});

router.get("/add-category", verifyLogin, (req, res) => {
  res.render("admin/add-category", { admin: true });
});

router.post("/add-category", (req, res) => {
  productHelpers.addCategory(req.body).then(() => {
    res.redirect("/admin/all-category");
  });
});

router.get("/edit-category/:id", verifyLogin, async function (req, res, next) {
  let id = req.params.id;
  let data = await productHelpers.editCategory(id);
  console.log(data);
  res.render("admin/edit-category", { admin: true, data });
});

router.post("/edit-category/:id", async function (req, res, next) {
  let id = req.params.id;
  productHelpers.updateCategory(id, req.body).then(() => {
    res.redirect("/admin/all-category");
  });
});

router.get("/delete-category/:id", verifyLogin, (req, res) => {
  let id = req.params.id;
  productHelpers.deleteCategory(id).then((response) => {
    res.redirect("/admin/all-category");
  });
});

//----------admin-orders department------------------------------

router.get("/admin-orders", verifyLogin, async (req, res) => {
  let orderDetails = await productHelpers.getOrders();
  res.render("admin/admin-orders", { orderDetails, admin: true });
});

router.post("/change-status/:id", (req, res) => {
  productHelpers
    .orderStatus(req.params.id, req.body.status)
    .then((response) => {
      res.redirect("/admin/admin-orders");
    });
});




//-----------------------coupen.........................
router.get("/coupon-offer", verifyLogin, async (req, res) => {
  coupon = await productHelpers.getAllCoupon();
  res.render("admin/coupon-offer", { admin: true, coupon });
});

router.post("/coupon-offer", verifyLogin, (req, res) => {
  productHelpers.addCoupon(req.body).then(() => {
    res.redirect("/admin/coupon-offer");
  });
});

router.get("/delete-coupon/:id", verifyLogin, (req, res) => {
  productHelpers.deleteCoupon(req.params.id).then(() => {
    res.redirect("/admin/coupon-offer");
  });
});

// ............................

router.get("/view-order/:id", async (req, res) => {
  let products = await userHelpers.getOrderProducts(req.params.id);
  console.log("eeeeeeee",products);
  res.render("admin/view-orders", { admin: true, products });
});

//-----------------------------add offer---------------------------------

router.get("/add-offer/:id", (req, res) => {
  let pro = req.params.id;
  res.render("admin/add-offer", { pro });
});

router.post("/add-offer/:id", (req, res) => {

  productHelpers.addProductOffers(req.body, req.params.id).then((response) => {
    res.render("admin/dashboard",{admin:true});
  });
});

//------------------------------report---------------------------------

const WEEK_SECONDS = 7 * 24 * 60 * 60 * 100;
const MONTH_SECONDS = 30 * 24 * 60 * 60 * 100;
const YEAR_SECONDS = 365.25 * 24 * 60 * 60 * 1000;

router.get("/weekly-report", function (req, res) {
  let nowDate = new Date();
  let previousWeek = new Date(nowDate - WEEK_SECONDS);
  productHelpers.getWeekReport(previousWeek).then(async (response) => {
    let total = await productHelpers.salesTotal(previousWeek, nowDate);
    orderDetails = response;
    res.render("admin/sales-report", { admin: true, orderDetails, total });
  });
});

router.get("/monthly-report", function (req, res) {
  let nowDate = new Date();
  let previousMonth = new Date(nowDate - MONTH_SECONDS);
  productHelpers.getMonthReport(previousMonth).then(async (response) => {
    let total = await productHelpers.salesTotal(previousMonth, nowDate);
    orderDetails = response;
    res.render("admin/sales-report", { admin: true, orderDetails, total });
  });
});

router.get("/yearly-report", function (req, res) {
  let nowDate = new Date();
  let previousYear = new Date(nowDate - YEAR_SECONDS);
  productHelpers.getYearReport(previousYear).then(async (response) => {
    let total = await productHelpers.salesTotal(previousYear, nowDate);
    orderDetails = response;
    res.render("admin/sales-report", { admin: true, orderDetails, total });
  });
});

router.get("/sales-report", (req, res) => {
  res.render("admin/sales-report", { admin: true });
});
router.post("/sales-report", (req, res) => {
  let start = new Date(req.body.start);
  let end = new Date(req.body.end);
  productHelpers.getSalesReport(start, end).then(async (response) => {
    let orderDetails = response;
    let total = await productHelpers.salesTotal(start, end);
    res.render("admin/sales-report", { admin: true, orderDetails, total });
  });
});

//=======================================================
router.get("/category-offer",async(req,res)=>{
  let categories = await userHelpers.getCategories();
  res.render("admin/category-offer",{admin:true,categories})
})

router.post("/category-offer",verifyLogin,(req,res)=>{
  let start=req.body.start
  let end=req.body.end
  let offer=req.body.offer
  let Category=req.body.Category
  productHelpers.addCategoryOffer(start,end,Category,offer).then(()=>{
    res.redirect("/admin/category-offer")
  })
})

router.post('/edit-images/:id',store.array("image", 4),(req,res,next)=>{
const files = req.files;
  let Id=req.params.id
     if (!files) {
        const err=new Error("please add image")
        return next(err)
      }
        let result = files.map(async (src, index) => {
          let productImg = {
            filename: files[index].filename
          };
          productHelpers.updateImages(Id, productImg)
        });
        Promise.all(result).then((msg)=>{
          res.redirect('/admin/view-products')
        })

})


router.post('/statusupdate',(req,res)=>{

})

router.get("/coupon-history",(req,res)=>{
  productHelpers.getCouponHistory().then((details)=>{
    res.render('admin/coupon-history',{details,admin:true})
  })
})
 





module.exports = router;
