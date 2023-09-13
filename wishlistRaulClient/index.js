$(function () {
  fillDivsWithData();
});



function callView(elem) {

  getWithAuthorization('/wishlists/' + elem.id + '/products')
    .done(function (response) {

      const modalView = document.getElementById("viewModal");
      const viewModalTitle = document.getElementById("viewModalTitle");
      const viewModalList = document.getElementById("viewModalList");
      viewModalTitle.innerText = elem.obj['name'];
      modalView.style.display = "block";
      let prodNoComprados = [];
      // Manipular la respuesta de la solicitud GET de wishlists
      response['products'].forEach(element => {
        if (element['purchased'] == 0) {
          prodNoComprados.push(element);
        }
      });

    
      if (prodNoComprados.length <= 0) {
        viewModalList.innerHTML = '<li>No products</li>';
      }else{
        prodNoComprados.forEach(element => {
          
          viewModalList.innerHTML += '<li>' + element['name'] +'</li>';
        });
      }
    })
    .fail(function (error) {
      checkError(error);
    });
}

function fillIcons(element, ids) {

  let id = element['id'];
  let ret = "<button id='btnDel" + id + "' class='del icon'>" + icons.trash + "</button>";
  ret += "<button id='btnEdit" + id + "' class='edit icon'>" + icons.edit + "</button>";
  ret += "<button id='btnView" + id + "' class='view icon'>" + icons.view + "</button>";

  ids.push({
    buttonId: 'btnDel' + id,
    obj: element,
    type: "delete",
    id: id
  });
  ids.push({
    buttonId: 'btnEdit' + id,
    obj: element,
    type: "edit",
    id: id
  });
  ids.push({
    buttonId: 'btnView' + id,
    obj: element,
    type: "view",
    id: id
  });

  return "<div>" + ret + "</div>"

}

function addEventListeners(ids) {
  ids.forEach(elem => {
    if (elem.type == "edit") {
      document.getElementById(elem['buttonId']).addEventListener("click", function () {
        //edit
        window.location.href = "/edit/?id=" + elem['id'];
      });
    } else if (elem.type == "delete") {
      document.getElementById(elem['buttonId']).addEventListener("click", function () {
        deleteModalClick(elem['obj']);
      });
    } else if (elem.type == "view") {
      document.getElementById(elem['buttonId']).addEventListener("click", function () {
        //show
        callView(elem);
      });
    }

  });
}

function fillDivsWithData() {

  const tableWishlists = document.getElementById('table-wishlist').getElementsByTagName("tbody")[0];
  const tableSharedWishlists = document.getElementById('table-sharedWishlist').getElementsByTagName("tbody")[0];
  const div3 = document.getElementById('firstWishListProducts');

  getWithAuthorization('/wishlists')

    .done(function (response) {

      //////////////////////////////////    Add content to wishlist  ////////////////////////////////////////////////////////

      let ids = [];
      // Manipular la respuesta de la solicitud GET de wishlists
      response['wishlists'].forEach(element => {
        let name = "<td>" + element["name"] + "</td>";
        let shared = "<td>" + element["shared"] + "</td>";
        let actions = "<td>" + fillIcons(element, ids) + "</td>";
        tableWishlists.innerHTML += "<tr>" + name + shared + actions + "</tr>";

      });
      addEventListeners(ids);

      ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


      //Ejemplo para rellenar la lista de productos obteniendo el valor de la wishlist
      let rt = response['wishlists'];
      if (rt && rt.length > 0) {
        getWithAuthorization('/wishlists/' + rt[0].id + '/products')
          .done(function (response) {
            div3.textContent = JSON.stringify(response);
          })
          .fail(function (error) {
            checkError(error);
          });
      }
    })
    .fail(function (error) {
      checkError(error);
    });

  getWithAuthorization('/shared-wishlists')
    .done(function (response) {
      let ids = [];
      response['sharedWishlists'].forEach(element => {
        let name = "<td>" + element["name"] + "</td>";
        let shared = "<td>" + element["moderator_id"] + "</td>";
        let actions = "<td><button id='btnDelShared" + element['id'] + "' class='delbutton icon'>" + icons.trash + "</button></td>";
        tableSharedWishlists.innerHTML += "<tr>" + name + shared + actions + "</tr>";
        ids.push({
          id: 'btnDelShared' + element['id'],
          obj: element
        });
      });
      ids.forEach(elem => {
        document.getElementById(elem['id']).addEventListener("click", function () {
          deleteModalClick(elem['obj']);
        });
      });
    })
    .fail(function (error) {
      checkError(error);
    });
}

function deleteModalClick(element) {

  console.log(element)
  let modalDelete = document.getElementById("modalConfirmDelete");
  modalDelete.style.display = "block";
  document.getElementById("deleteText").textContent = "The list " + element['name'] + " will be deleted";

  document.getElementById('deleteWishlistFormButton').addEventListener("click", function () {
    deleteElement(element['id']);
  });

}