var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
const { response } = require('../app')
const { CART_COLLECTION } = require('../config/collections')
var objectId=require('mongodb').ObjectId
const Razorpay=require('razorpay')
const { log } = require('console')
const { resolve } = require('path')
const moment =require("moment")

var instance = new Razorpay({
    key_id: 'rzp_test_qJD9MniKhMYbZy',
   key_secret: 'yto7PZXKbbGBoLEUTqK1GiTQ',
  });


  module.exports={
    doSignup:(userData,refer)=>{
        console.log("",userData)
        return new Promise(async(resolve,reject)=>{ 
            let oldUser=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
if(oldUser){
    reject()
}
            userData.password=await bcrypt.hash(userData.password,10)
            user={
                Name:userData.Name,
                Email:userData.Email,
                numbers:userData.numbers,
                password:userData.password,
                wallet:userData.wallet?userData.wallet:0
}
            db.get().collection(collection.USER_COLLECTION).insertOne(user).then(async(data)=>{

                let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id:data.insertedId });
                //   response.user = user;
                console.log(user);
                resolve(user)
            //     if(refer){
            //         console.log(refer,"rrrrrrrrrrrrrrrrrrr")
            //         db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(refer)},{$inc:{wallet:500}}).then(()=>{
            //             resolve(user)
            //         })
            //     }else{
            //     resolve(data)
            // }
            })
         })
      },
    
    
    
      doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}                            
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.email})
            if(user){
                bcrypt.compare(userData.password,user.password).then((status)=>{
                     if(user.blockStatus){
                        resolve({status:"blocked"})
                     }else{
                        if(status){
                            console.log("login success")
                            response.user=user
                            response.status=true
                            resolve(response)
                        }else{
                             console.log("login failed")
                             resolve({status:false})
                            }
                        }
                    })
                }else{
                console.log("login failed")
                resolve({status:false})
            }
        })
   },
   
   
   
   getAllUsers:()=>{
    return new Promise(async(resolve,reject)=>{
        let users=await db.get().collection(collection.USER_COLLECTION).find().toArray()
        resolve(users)
      })
},




deleteUser:(userId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.USER_COLLECTION).removeOne({_id:objectId(userId)}).then((response)=>{
           console.log(response);
            resolve(response)
        })
    })
},




getUserDetails:(userId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)}).then((user)=>{
            resolve(user)
        })
    })
},





updateUser:(userId,userDetails)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{
            $set:{
                Name:userDetails.Name,
                Email:userDetails.Email    
            }
        }).then((response)=>{
            resolve()
        })
   })
},





blockUser:(id)=>{
    console.log(id)
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(id)},{
            $set:{
                blockStatus:true
            }
        }).then(()=>{
            resolve()
        })
    })
},






unblockUser:(id)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(id)},{
            $set:{
                blockStatus:false
            }
        }).then(()=>{
            resolve()
        })
    })
},






getAlldetails:(proid)=>{
    return new Promise( async(resolve,reject)=>{
        await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proid)}).then((response)=>{
           console.log(response);
            resolve(response)
        
        })
    })
},

 




addToCart:(proId,userId)=>{
    
    let proObj={
        item:objectId(proId),
        quantity:1
    }
     return new Promise(async(resolve,reject)=>{
        let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
    if(userCart){
        let proExist=userCart.products.findIndex(product=>product.item==proId)
        if(proExist!=-1){
db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId),'products.item':objectId(proId)},
{
    $inc:{'products.$.quantity':1}
}
).then(()=>{
    resolve()
})

        }else{
  db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},
  {

        $push:{products:proObj}
    }
    ).then((response)=>{
        resolve()
    })
}
    }else{
        let cartObj={
            user:objectId(userId),
            products:[proObj]
        }
        db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
            resolve()
        })
    }
    })
},



getCartProducts:(userId)=>{
    return new Promise(async(resolve,reject)=>{
       let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
        {
            $match:{user:objectId(userId)}
        },
        {
            $unwind:'$products'
        },
        {
            $project:{
                item:"$products.item",
                quantity:'$products.quantity'
            }
        },
        {
            $lookup:{
                from:collection.PRODUCT_COLLECTION,
                localField:'item',
                foreignField:"_id",
                as:'product'
            }
        },
        {
           $project:{
            item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
           }
        }
     ]).toArray()
       resolve(cartItems)
    })
  }, 





  getCartCount:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let count=0
        let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
        if(cart){
         count=cart.products.length
        }
        resolve(count)
    })
},




changeProductQuantity:(details)=>{
    details.count=parseInt(details.count)
    details.quantity=parseInt(details.quantity)
    return new Promise((resolve,reject)=>{
        if(details.count==-1 && details.quantity==1){
        db.get().collection(collection.CART_COLLECTION)
        .updateOne({_id:objectId(details.cart)},
        {
            $pull:{products:{item:objectId(details.product)}}
        }
        ).then((response)=>{
            resolve({removeProduct:true})
        })

}else{
db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
    {
        $inc:{'products.$.quantity':details.count}
    }
    ).then((response)=>{
        resolve({status:true})
                 })
              }
 
        })
     },

     
     
     
     getTotalAmount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
 let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
            {
                $match:{user:objectId(userId)}
            },
     
            {
                $unwind:'$products'
            },
            {
                $project:{
                    item:"$products.item",
                    quantity:'$products.quantity'
                }
            },
            {
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:"_id",
                    as:'product'
                }
            },
            {
               $project:{
                item:1,quantity:1,product:{$arrayElemAt:['$product',0]}   
               }
            },
            {
                $group:{
                    _id:null,
                    total:{$sum:{$multiply:[{'$toInt':'$quantity'},{'$toInt':'$product.Price'}]}}
                }
            }
         
         
           ]).toArray()
           resolve(total[0]?.total)
          
        
        })
    } ,

    
    
    
    
    deleteCartItem: (id, userId) => {
        return new Promise((resolve, reject) => {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId) },
              { $pull: { products: { item: objectId(id) } } }
            )
            .then((response) => {
              resolve();
            });
        });
      },

    
    
    
getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            resolve(cart.products)
        })
    },

    
    
    
    
    addAddress: (address,userId) => {
        address.userId = objectId(userId);
        return new Promise((resolve, reject) => {
          db.get()
            .collection(collection.USER_COLLECTION)
            .updateOne({_id:objectId(userId)},{$push:{Address:{address}}})
            .then((data) => {
              resolve(data);
            });
        });
      },
      
      
      
      
      getAlladdress: (user) => {
        let userId = objectId(user._id);
        return new Promise(async (resolve, reject) => {
          let user = await db
            .get()
            .collection(collection.USER_COLLECTION)
            .find({ userId: userId })
            .toArray();
          resolve(user);
        });
      },
      
      
      
      
      getUserDetails: (userId) => {
        return new Promise(async (resolve, reject) => {
          let user = await db
            .get()
            .collection(collection.USER_COLLECTION)
            .findOne({ _id: objectId(userId) });
          resolve(user);
        });
      },
    
      
      
      
      
      getOneAddress: (addressId) => {
        return new Promise((resolve, reject) => {
          db.get()
            .collection(collection.ADDRESS_COLLECTION)
            .findOne({ _id: objectId(addressId) })
            .then((addressDetails) => {
              resolve(addressDetails);
            });
        });
      },
    
      
     
      
      updateProfile:(details,userId)=>{
            return new Promise((resolve, reject) => {
                let obj={address:details.Address,city:details.City,picode:details.Pincode,state:details.State}
                db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{
                    $set:{
                        Name:details.Name,
                        Email:details.Email,
                         numbers:details.Mobile,
                         Address:[obj]
                         }
                }).then(()=>{
                    resolve()
                })
             })
    },

            
            
            
            
            placeOrder:async(id,order,products,total,old)=>{
                return new Promise(async(resolve,reject)=>{
               console.log(order,products,total)
               if(order["paymentMethod"]=="COD"){
                   var status="placed"
               }else{
                 status="pending"
               }
                    let orderObj={
                    userId:objectId(id),
                    deliveryDetails:{
                    name:order.name,
                    email:order.email,
                    address:order.address,                               
                    paymentMethod:order["paymentMethod"],
                },
                products:products,
                totalAmount:total,
                oldAmount:old,
                status:status,
                date:new Date() 
            }
                await db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                    console.log(response,"result");
                    resolve(response.insertedId)

                })
        })
 },

 clearCart:(id)=>{
    return new Promise(async(resolve,reject)=>{
     await   db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(id)}).then(()=>{
        resolve()
     })
        
    })
 },


            
 
 getUserOrders:(userId)=>{
                return new Promise(async(resolve,reject)=>{
                    let orders=await db.get().collection(collection.ORDER_COLLECTION)
                    .find({user:userId}).toArray()
                    resolve(orders)
                })
            },

            
            
            getOrderProducts:(orderId)=>{
                return new Promise(async(resolve,reject)=>{
                    let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                        {
                            $match:{_id:objectId(orderId)}
                        },
                        {
                            $unwind:"$products"
                        },
                        {
                            $project:{
                                item:'$products.item',
                                quantity:'$products.quantity'
                            }
                        },
                        {
                            $lookup:{
                                from:collection.PRODUCT_COLLECTION,
                                localField:'item',
                                foreignField:'_id',
                                as:'product'
                            }
                        },
                        {
                            $project:{
                                item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                            }
                        }
                    ]).toArray()
                    resolve(orderItems)
                })
            },


          generateRazorpay:(orderId,total)=>{
        return new Promise((resolve,reject)=>{
         instance.orders.create
            ({  amount:total*100,  currency: "INR",  receipt:""+(orderId)}, function(err,order){
                if(err){
                   console.log(err)
                    }else{
                    resolve(order)
                }
               })
              })
     },


     verifyPayment:((details)=>{
        const {razorpay_payment_id,razorpay_order_id,razorpay_signature}=details.payment;
       return new Promise((resolve,reject)=>{
            const{
                createHmac,
                    }=require('crypto');
            let hmac=createHmac('sha256',"yto7PZXKbbGBoLEUTqK1GiTQ");
            hmac.update(razorpay_order_id+"|"+razorpay_payment_id);
   hmac=hmac.digest("hex")
   if(hmac==razorpay_signature){
    resolve()
   } 
   else{
    reject("cannot hash")
    }
            })
     }),


     changeOrderStatus:((orderId)=>{
        return new Promise((resolve,reject)=>{
          db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},{
            $set:{status:"placed"}
          }).then(()=>{
            resolve()
          })
        })
      }),



       getUserData:(userId)=>{
        return new Promise(async (resolve, reject) => {
            let user = await db
              .get()
              .collection(collection.USER_COLLECTION)
              .findOne({ _id: objectId(userId) });
            resolve(user);
          });
        },

            
     findUser : (mobile) => {
       return new Promise(async (resolve, reject) => {
          let user = await db
            .get()
            .collection(collection.USER_COLLECTION)
            .findOne({ numbers: mobile});
            if(user){
                 resolve(user);
            }else{
                resolve({status:false})
            }
          
        });
      },


      changePassword:(data,userId)=>{
        return new Promise(async(resolve,reject)=>{
            let hashedpwd=await bcrypt.hash(data,10)
             db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{
                $set:{
                    password:hashedpwd
                }
            }).then(()=>{
                resolve()
            })
        })
      },
      getCategories:()=>{
        return new Promise(async(resolve,reject)=>{
            let categories=await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(categories)
        
        })
       

      },

      getAllCategoryProducts

      :(data)=>{
        return new Promise(async(resolve,reject)=>{
           let products=await db.get().collection(collection.PRODUCT_COLLECTION).find({Category:data}).sort({_id:-1}).toArray()
           resolve(products)
        })
       },
      

    couponValidate: (data, user) =>  {
        return new Promise(async (res, rej) => {
            obj = {}
            let date = new Date()
            date = moment(date).format('YYYY-MM-DD')
            let coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({ Coupon: data.Coupon })
            console.log(coupon,"koooooooooop")
            if (coupon) {
                
                let users = coupon.Users
                // let userChecker = users.includes(objectId(user)) 
                let check = await db.get().collection(collection.COUPON_COLLECTION).findOne({ Users:objectId(user)},{Coupon: data.Coupon})

                if (check) {
                    obj.couponUsed = true;
                    res(obj)
                } else {
                    if (date <= coupon.Expiry) {
                        let total = parseInt(data.Total)
                        let percentage = parseInt(coupon.Offer)
                        let discountVal = ((total * percentage) / 100).toFixed()
                        obj.oldTotal=total
                        obj.total = total - discountVal
                        obj.success = true
                        res(obj)
                    } else {
                        obj.couponExpired = true
                        console.log("Expired");
                        res(obj)
                    }
                }
            } else {
                obj.invalidCoupon = true
                console.log("invalid");
                res(obj)

            }
        })
    },


    cancelOrder: (Id) => {
        return new Promise((res,rej)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(Id)},{
                $set:{
                   Status: 'Cancelled',
                   Cancelled: true
                }
            }).then((response)=>{
                res()

            })
        })

    },


    addWallet:(userId,total)=>{
        let Total=parseInt(total)
        return new Promise((res,rej)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{ $inc: { wallet: Total } }).then((response)=>{
                res(response)
            })
        })

    },

    applayWallet:(val,userId)=>{
        let value=parseInt(val)
      return new Promise((res,rej)=>{
          db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{ $inc: { wallet: -value }}).then((response)=>{
              res(response)
      })
      }) 

  },

  walletHistory:(id,msg)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.WALLET_COLLECTION).insertOne({
            userId:id,
            message:msg
        }).then((rs)=>{

            resolve(rs)
        })
    })

  },
  

  getWalletHistory:(id)=>{
return new Promise((resolve,reject)=>{
    db.get().collection(collection.WALLET_COLLECTION).find({userId:objectId(id)}).then
})
  },


  getCoupon:()=>{
    return new Promise(async(resolve,reject)=>{
        let data= await db.get().collection(collection.COUPON_COLLECTION).find().sort({ "$natural": -1 }).limit( 1 ).toArray()
            resolve(data)
        })
  },


  getTotalDiscount:(userId,today)=>{
   return new Promise(async(resolve,reject)=>{
let totalDiscount=await db.get().collection(collection.CART_COLLECTION).aggregate([
        {
            $match:{user:objectId(userId)}
        },
 
        {
            $unwind:'$products'
        },
        {
            $project:{
                item:"$products.item",
                quantity:'$products.quantity'
            }
        },
        {
            $lookup:{
                from:collection.PRODUCT_COLLECTION,
                localField:'item',
                foreignField:"_id",
                as:'product'
            }
        },
        {
           $project:{
            item:1,quantity:1,product:{$arrayElemAt:['$product',0]}   
           }
        },
             
        {$project:{
            item:1,
            quantity:1,
            product:1,
            discount:"$product.offer",
            price:"$product.Price",
            start:"$product.offerStart",
            end:"$product.offerEnd"
        }

        },
        {$match:{discount:{$gt:"0"}}},
       
        {
            $group:{
                _id:null,
                discount:{$sum:{"$multiply":[{$toInt:'$quantity'},{$toInt:'$product.offer'},{$toInt:"$product.Price"}]}}
            }
        }
     
     
       ]).toArray()
       resolve(totalDiscount[0]?.discount)
      
    
    })
} ,

}

      





