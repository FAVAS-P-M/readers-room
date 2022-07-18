const multer= require('multer')
const path=require('path')


  

var storage=multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,'public/uploads')
    },

    


       
     filename:function(req,file,cb){
        var ext=file.originalname.substring(file.originalname.lastIndexOf("."))
        cb(null,file.fieldname+'-'+Date.now()+ext);
    }
})


store=multer({storage:storage});
module.exports=store;




