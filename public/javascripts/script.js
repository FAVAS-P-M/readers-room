
function onclicksx(catId,catName){
    console.log("deleeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") 
    Swal.fire({
  title: 'Are you sure?',
  text: "Do You want to delete category-  "+catName,
  icon: 'warning',
  showCancelButton: true,
  confirmButtonColor: '#3085d6',
  cancelButtonColor: '#d33',
  confirmButtonText: 'Yes'
}).then(async(result) => {
  if (result.isConfirmed) {
   window.location.href='/admin/delete-category/'+catId
  }
})
  }


  