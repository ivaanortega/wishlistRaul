$(function() {
    fillDivsWithData();
});
 

  function fillDivsWithData() {
        
      const tableWishlists = document.getElementById('table-list').getElementsByTagName("tbody")[0];
      const div3 = document.getElementById('firstWishListProducts');

      getWithAuthorization('/addProductForm')
      
          .done(function(response) {
              let ids = [];
            // Manipular la respuesta de la solicitud GET de wishlists
            response['wishlists'].forEach(element => {
              let name = "<td>" + element["name"] + "</td>";
              let shared = "<td>" + element["shared"] + "</td>";
              let actions = "<td><button id='btnDel"+element['id'] +"' class='delbutton'>del</button></td>";
              tableWishlists.innerHTML += "<tr>" + name + shared + actions + "</tr>";
              ids.push({id:'btnDel'+element['id'], obj: element });
            });
            ids.forEach(elem => {
                document.getElementById(elem['id']).addEventListener("click", function() {
                    deleteModalClick(elem['obj']);
                  });
            });
            
            //Ejemplo para rellenar la lista de productos obteniendo el valor de la wishlist
            let rt = response['wishlists'];
            if(rt && rt.length > 0){
              getWithAuthorization('/wishlists/' + rt[0].id + '/products')
                .done(function(response) {div3.textContent = JSON.stringify(response);})
                .fail(function(error) {checkError(error);});
            }
          })
          .fail(function(error) {
              checkError(error);
          });

      getWithAuthorization('/shared-wishlists')
          .done(function(response) {
            let ids = [];
            response['sharedWishlists'].forEach(element => {
                let name = "<td>" + element["name"] + "</td>";
                let shared = "<td>" + element["moderator_id"] + "</td>";
                let actions = "<td><button id='btnDelShared"+element['id'] +"' class='delbutton'>del</button></td>";
                tableSharedWishlists.innerHTML += "<tr>" + name + shared + actions + "</tr>";
                ids.push({id:'btnDelShared'+element['id'], obj: element });
            });
            ids.forEach(elem => {
                document.getElementById(elem['id']).addEventListener("click", function() {
                    deleteModalClick(elem['obj']);
                  });
            });
          })
          .fail(function(error) {
            checkError(error);
          });
  }

  function deleteModalClick(element) {
   
    console.log(element)
    let modalDelete = document.getElementById("modalConfirmDelete");
    modalDelete.style.display = "block";
    document.getElementById("deleteText").textContent = "The list " + element['name'] + " will be deleted";

    document.getElementById('deleteWishlistFormButton').addEventListener("click", function() {
        deleteElement(element['id']);
      });

  }
  