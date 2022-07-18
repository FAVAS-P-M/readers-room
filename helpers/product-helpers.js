var db=require('../config/connection')
var collection=require('../config/collections')
const { ObjectID } = require('bson');
const { AuthTokenPromotionInstance } = require('twilio/lib/rest/accounts/v1/authTokenPromotion');
var objectId=require('mongodb').ObjectId
const moment = require('moment');
const collections = require('../config/collections');
module.exports={


    addProduct:(product,callback)=>{
   db.get().collection('product').insertOne(product).then((data)=>{
        callback(data.insertedId)
        })
    },


    getAllProducts:()=>{
     return new Promise(async(resolve,reject)=>{
        let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().sort({_id:-1}).toArray()
        resolve(products)
     })
    },
    
    
    
    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).remove({_id:objectId(proId)}).then((response)=>{
                resolve(response)
            })
        })
    },

    
    
    
    getProductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
               resolve(product)
            })
        })
    },

    
    
    
    
    updateProduct:(proId,proDetails)=>{
        return new Promise(async(resolve,reject)=>{
            let details=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)})
db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{
                $set:{
                    Name:proDetails.Name,
                    Description:proDetails.Description,
                    Price:proDetails.Price,
                    Category:proDetails.Category
                     }
                
            }).then((response)=>{
                resolve()
            })
        })
    },

    
    
    
    
    getAllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
            let users=await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
          })
    },
    
    
    
    
    addCategory:(data)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne(data).then(()=>{
                resolve()
            })
        })
    },

    
    
    
    getCategory:()=>{
        return new Promise(async(resolve,reject)=>{
         let data=await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
         resolve(data)
                })
    },

    
    
    
    
    editCategory:(id)=>{
        return new Promise(async(resolve,reject)=>{
         let data=await db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:objectId(id)})
         resolve(data)
                })
    },


    
    
    
    
    updateCategory:(id,data)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION)
            .updateOne({_id:objectId(id)},{
                $set:{
                    
                    category:data.category
                     }
                }).then((response)=>{
                resolve()
            })
        })
    },


    
    
    
    deleteCategory:(id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).remove({_id:objectId(id)}).then((response)=>{
                resolve(response)
            })
        })
    },

    
    
    
    
    addImages:(id,productImg)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:id},{
                $push:{
                    productImages:productImg
                }
            }).then((response)=>{
              resolve(response)
            })
        })
    },
    

    
    
    
    
    orderList:(data,id)=>{
       return new Promise(async(resolve,reject)=>{
        let obj={
            user:id,
            name:data.name,
            email:data.email,
            address:data.address,
            amount:data.amount,
            paymentMethod:data.paymentMethod,
            date:new Date()
                }
     await db.get().collection(collection.ORDER_COLLECTION).insertOne(obj)
       })
    },

   
   
    getOrders:(()=>{
        return new Promise(async(resolve,reject)=>{
            let details=db.get().collection(collection.ORDER_COLLECTION).find().sort({date:-1}).toArray()
            resolve(details)
        })
    }),


   
   
    orderStatus:(id,data)=>{
        return new Promise(async(resolve,reject)=>{
            let Status=db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(id)},{$set:{status:data}}).then((response)=>{
              resolve()
            })
        })
    },


    
    
    addCoupon: (data) => {
        return new Promise(async (res, rej) => {
            let startDateIso = new Date(data.Starting)
            let endDateIso = new Date(data.Expiry)
            let expiry = await moment(data.Expiry).format('YYYY-MM-DD')
            let starting = await moment(data.Starting).format('YYYY-MM-DD')
            let dataobj = await {
                Coupon: data.Coupon,
                Offer: parseInt(data.Offer),
                Starting: starting,
                Expiry: expiry,
                startDateIso: startDateIso,
                endDateIso: endDateIso,
                Users: []
            }
            db.get().collection(collection.COUPON_COLLECTION).insertOne(dataobj).then(() => {
                res()
            }).catch((err) => {
                res(err)
            })

        })
    },
    
    
    getAllCoupon: () => {
        return new Promise((res, rej) => {
            let coupon = db.get().collection(collection.COUPON_COLLECTION).find().toArray()
            res(coupon)
        })
    },

    
    
    deleteCoupon: (id) => {
        return new Promise((res, rej) => {
            db.get().collection(collection.COUPON_COLLECTION).deleteOne({ _id: objectId(id) }).then(() => {
                res()
            })
        })
    },




    addProductOffers:(data,proid)=>{
return new Promise((resolve,reject)=>{
    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proid)},{$set:{offerStart:data.offerStart,offerEnd:data.offerEnd,offer:data.offer}}).then(()=>{
    resolve()
    })
})
    },

   
   
    userAddCoupon:(user,code)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.COUPON_COLLECTION).updateOne({Coupon:code},{$push:{Users:objectId(user)}}).then(()=>{
            resolve()
        })
    })
        
},


getSalesReport:(start,end)=>{
    return new Promise(async(resolve,reject)=>{
    let reports=await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end}}).toArray()
  if(reports){
        resolve(reports)
    } 
    else{
        resolve(false)
       
    }
    })
},

salesTotal:((start,end)=>{
    return new Promise(async(resolve,reject)=>{
        let count=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match:{date:{$gte:start,$lte:end}}
            },
            {
                $match:{$or:[{status:"shipped"},{status:"placed"}]}
            },
            {$group:{
                _id:null,
                total:{$sum:{$toDouble:"$totalAmount"}}
            }
            }
        ]).toArray()
        if(count){
           resolve(count[0]?.total)
        }else{
            resolve(0)
        }
    })
}),



getWeekReport:((previousWeek)=>{
    return new Promise(async(resolve,reject)=>{
        let weeklyReport=await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:previousWeek}}).toArray()
        resolve(weeklyReport)
    })
  }),

  getMonthReport:((previousMonth)=>{
    return new Promise(async(resolve,reject)=>{
        let monthlyReport=await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:previousMonth}}).toArray()
        resolve(monthlyReport)
    })
  }),

  getYearReport:((previousYear)=>{
    return new Promise(async(resolve,reject)=>{
        let yearlyReport=await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:previousYear}}).toArray()
        resolve(yearlyReport)
    })
  }),


  addCategoryOffer:((start,end,categoryName,offer)=>{
    return new Promise(async(resolve,reject)=>{
        await db.get().collection(collection.PRODUCT_COLLECTION).updateMany({Category:categoryName},{$set:{offerStart:start,offerEnd:end,offer:offer}}).then(()=>{
            resolve()
        })
    })
  }),


  
  updateImages:(id,productImg)=>{
  return new Promise(async(resolve,reject)=>{
       await db.get().collection(collection.PRODUCT_COLLECTION).updateMany({_id:objectId(id)},{$unset:{"productImages":""}})
      await  db.get().collection(collection.PRODUCT_COLLECTION).updateMany({_id:objectId(id)},{
            $push:{
                productImages:productImg
            }
        }).then((response)=>{
          resolve(response)
        })
    })
},

getCouponHistory:()=>{
   return new Promise(async(resolve,reject)=>{
    let history=    await db.get().collection(collections.COUPON_COLLECTION).aggregate([
            {
                $unwind:'$Users'
            },
          
            {
                $lookup:{
                    from:"user",
                    localField:'Users',
                    foreignField:"_id",
                    as:'user'
                }
            },
            {
               $project:{
                user:{$arrayElemAt:['$user',0]},
                Coupon:1,Offer:1
               }
            }

        ]).toArray()
    resolve(history)
    })

}


  }

    




