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

      //clear data
      viewModalList.innerHTML = null;
    
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

function fillIcons(element, ids, isShared = false) {

  let id = element['id'];

  let ret = "";

  if(element['shared']){
    ret += "<button id='btnParticipate" + id + "' class='participate icon'>" + icons.users + "</button>";
    ids.push({
      buttonId: 'btnParticipate' + id,
      obj: element,
      type: "participate",
      id: id
    });
  }

  ret += "<button id='btnEdit" + id + "' class='edit icon'>" + icons.edit + "</button>";
  
  if(element['hasProducts']){
    ret += "<button id='btnView" + id + "' class='view icon'>" + icons.view + "</button>";
    ids.push({
      buttonId: 'btnView' + id,
      obj: element,
      type: "view",
      id: id
    });
  }
  if(isShared){

    ret += "<button id='btnDel" + id + "' class='del icon'>" + icons.trash + "</button>";

      ids.push({
        buttonId: 'btnDel' + id,
        type: "delete",
        id: id,
        obj: element
      });
  }else{
    ret += "<button id='btnDel" + id + "' class='del icon'>" + icons.trash + "</button>";
    ids.push({
      buttonId: 'btnDel' + id,
      obj: element,
      type: "delete",
      id: id
    });
  }
 
  
  
  
 
  ids.push({
    buttonId: 'btnEdit' + id,
    obj: element,
    type: "edit",
    id: id
  });
  

  return "<div>" + ret + "</div>"

}

function addEventListeners(ids,shared = false) {
  ids.forEach(elem => {
    if (elem.type == "edit") {
      document.getElementById(elem['buttonId']).addEventListener("click", function () {
        //edit
        let url = "/edit/?id=" + elem['id'];
        if(shared){
          url += "&shared=true";
        }
        window.location.href = url;
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
    }else if(elem.type == "participate"){
      document.getElementById(elem['buttonId']).addEventListener("click", function () {
        //show
        fillModalInvitats(elem, shared);
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
      console.log(response['wishlists']);
      let ids = [];
      // Manipular la respuesta de la solicitud GET de wishlists
      response['wishlists'].forEach(element => {
        let name = "<td>" + element["name"] + "</td>";
        let shared = "<td>" + (element["shared"] ? 'Si' : 'No') + "</td>";
        let actions = "<td>" + fillIcons(element, ids) + "</td>";
        tableWishlists.innerHTML += "<tr>" + name + shared + actions + "</tr>";

      });
      addEventListeners(ids);

      ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
        let actions = "<td>" + fillIcons(element, ids, true) + "</td>";
        //let actions = "<td><button id='btnDelShared" + element['id'] + "' class='delbutton icon'>" + icons.trash + "</button></td>";
        tableSharedWishlists.innerHTML += "<tr>" + name + shared + actions + "</tr>";
        
      });
      addEventListeners(ids,true);
      /*ids.forEach(elem => {
        document.getElementById(elem['id']).addEventListener("click", function () {
          deleteModalClick(elem['obj']);
        });
      });*/
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

  document.getElementById('deleteWishlistFormButton').onclick = function () {
    deleteElement(element['id']);
  };

}
function fillModalInvitats(elem, shared = false){
  
  const viewModalList = document.getElementById("viewModalList2");
  const viewModalTitle = document.getElementById("viewModalTitle2");
  const willAttend = document.getElementById("willAttend");
  viewModalList.innerHTML = null;
  const willAssist = document.getElementById("willAssist");
  const willNotAssist = document.getElementById("willNotAssist");
  willAssist.innerHTML = icons.check;
  willNotAssist.innerHTML = icons.cross;
  willAssist.onclick = function(){
    updateAssist(elem.id,true);
  }
  willNotAssist.onclick = function(){
    updateAssist(elem.id,false);
  }
  getWithAuthorization('/wishlists/' + elem.id + '/shared-users')
    .done(function (response) {

      const modalView = document.getElementById("viewModalInvitats");
      
      
      viewModalTitle.innerText = elem.obj['name'];
      modalView.style.display = "block";
      let usuarios = [];
      console.log(response);

      console.log(shared);
      if(shared){
        willAttend.style.display = "flex";
        console.log("block");
      }else{
        willAttend.style.display = "none";
        console.log("none");
      }
        

      // Manipular la respuesta de la solicitud GET de wishlists
      response['sharedUsers'].forEach(element => {
        
          usuarios.push(element);
       
      });

      //clear data
      usuarios.forEach(element => {
          let iconAttend = "";
          if(element['attend'] != null && element['attend']){
            iconAttend = icons.check;
          }else if(element['attend'] != null && !element['attend']){ 
            iconAttend = icons.cross;
          }

          viewModalList.innerHTML += '<div class="attendElem"><span>' + element['email'] + '</span>' + iconAttend  +'</div>';
        });

    })
    .fail(function (error) {
      checkError(error);
    });

    function updateAssist(id,assist){
      let data = {
        assist: assist
      }
      putData('/wishlists/' + id + '/attend/',data)
      .done(function (response) {
        refresh();
      })
      .fail(function (error) {
        checkError(error);
      });
    }
}