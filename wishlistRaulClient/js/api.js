let baseUrl = 'https://apiraul.ivanortegasensio.com';

let user = null;

// Función para realizar una solicitud POST
function postData(url, data, auth = true) {
  console.log(JSON.stringify(data));
    if(auth){
        return $.ajax({
            type: 'POST',
            url: baseUrl + url,
            beforeSend: setAuthorizationHeader,
            data: JSON.stringify(data),
            contentType: 'application/json',
            dataType: 'json'
          });
    }else{
        return $.ajax({
            type: 'POST',
            url: baseUrl + url,
            data: JSON.stringify(data),
            contentType: 'application/json',
            dataType: 'json'
          });
    }
  }
  // Función para realizar una solicitud PUT
  function putData(url, data){
    return $.ajax({
      type: 'PUT',
      url:  baseUrl + url,
      beforeSend: setAuthorizationHeader,
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify(data)
    });
  }
  // Función para realizar una solicitud DELETE
  function deleteData(url) {
    return $.ajax({
      type: 'DELETE',
      url: baseUrl + url,
      beforeSend: setAuthorizationHeader,
      dataType: 'json'
    });
  }

  function convertFormToJSON(form) {
    return $(form)
      .serializeArray()
      .reduce(function (json, { name, value }) {
        json[name] = value;
        return json;
      }, {});
  }

  // Función para manejar el envío del formulario de registro
  $('#registerForm').submit(function(e) {
    e.preventDefault();
    const url = '/register';
    const data = convertFormToJSON($(this));
    postData(url, data, false)
      .done(function(response) {
        loginform(data);
      })
      .fail(function(error) {
        alert(error.responseJSON.error);
      });
  });


  // Función para manejar el envío del formulario de inicio de sesión
  $('#loginForm').submit(function(e) {
    e.preventDefault();
    const data = convertFormToJSON($(this));
    loginform(data);
    
  });
  function loginform(data){
      const url = '/login';
        postData(url, data,false)
            .done(function(response) {
                // Guardar el token de acceso en el almacenamiento local o en una cookie
                const token = response.token;
                localStorage.setItem('accessToken', token);
                window.location.replace("/");
            })
            .fail(function(error) {
                alert(error.responseJSON.error);
        });
  }

  // Función para obtener el token de acceso almacenado
  function getAccessToken() {
      let at = localStorage.getItem('accessToken');
      if(!at){
          logout();
      }
    return at;
  }

  function isAutenticated(){
    let at = localStorage.getItem('accessToken');
    if(!at){
      return false;
    }else{
      return true;
    }
  }
  // Función para agregar el token de acceso a la cabecera de las solicitudes
  function setAuthorizationHeader(xhr) {
    const token = getAccessToken();
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
  }

  // Función para realizar una solicitud GET con autorización
  function getWithAuthorization(url) {
    return $.ajax({
      type: 'GET',
      url: baseUrl + url,
      beforeSend: setAuthorizationHeader,
      dataType: 'json'
    });
  }

  // Función para manejar el envío del formulario de creación de lista de deseos
  $('#createWishlistForm').submit(function(e) {
    e.preventDefault();

    const url = '/wishlists';
    const data = convertFormToJSON($(this));

    postData(url, data)
      .done(function(response) {
        //alert(response.message);
        refresh();
      })
      .fail(function(error) {
        
        checkError(error);
      });
  });

  // Función para manejar el envío del formulario de adición de producto a lista de deseos
  $('#addProductForm').submit(function(e) {
    e.preventDefault();

    const url = '/wishlists/' + $(this).find('input[name="wishlistId"]').val() + '/products';
    const data = convertFormToJSON($(this));

    postData(url, data)
      .done(function(response) {
        //alert(response.message);
        refresh();
      })
      .fail(function(error) {
        checkError(error);
      });
  });

  // Función para compartir la lista de deseos
  $('#shareWishList').submit(function(e) {
    e.preventDefault();
    const url = '/wishlists/' + $(this).find('input[name="wishlistId"]').val() + '/share';
    const data = convertFormToJSON($(this));

    postData(url, data)
      .done(function(response) {
        //alert(response.message);
        refresh();
      })
      .fail(function(error) {
        checkError(error);
      });
  });

  function comprar(wishlistId, productId, value){
    let url = '/wishlists/' + wishlistId + '/products/' + productId;
    if(value == false){
      url += '/unbuy'
    }else{
      url += '/buy'
    }
    const data = {};

    putData(url, data)
      .done(function(response) {
        //alert(response.message);
        refresh();
      })
      .fail(function(error) {
        checkError(error);
      });
  }
  // Función para manejar el envío del formulario de marca de producto como comprado
  $('#markProductPurchasedForm').submit(function(e) {
    e.preventDefault();

    const url = '/wishlists/' + $(this).find('input[name="wishlistId"]').val() + '/products/' + $(this).find('input[name="productId"]').val();
    const data = {};

    putData(url, data)
      .done(function(response) {
        //alert(response.message);
        refresh();
      })
      .fail(function(error) {
        checkError(error);
      });
    
  });

  // Función para manejar el envío del formulario de eliminación de lista de deseos
  $('#deleteWishlistForm').submit(function(e) {
    e.preventDefault();

    const url = '/wishlists/' + $(this).find('input[name="wishlistId"]').val();

    deleteData(url)
      .done(function(response) {
        //alert(response.message);
        refresh();
      })
      .fail(function(error) {
        checkError(error);
      });
  });


  function deleteElement(id){
    const url = '/wishlists/' + id;
    deleteData(url)
      .done(function(response) {
        //alert(response.message);
        refresh();
      })
      .fail(function(error) {
        checkError(error);
      });
  }
  function deleteProduct(idWishlist, idProduct){
    const url = '/wishlists/' + idWishlist + "/products/" + idProduct;
    
    deleteData(url)
      .done(function(response) {
        //alert(response.message);
        refresh();
      })
      .fail(function(error) {
        checkError(error);
      });
  }

  // Función para manejar el envío del formulario de eliminación de producto de lista de deseos
  $('#deleteProductForm').submit(function(e) {
    e.preventDefault();

    const url = '/wishlists/' + $(this).find('input[name="wishlistId"]').val() + '/products/' + $(this).find('input[name="productId"]').val();

    deleteData(url)
      .done(function(response) {
        //alert(response.message);
        refresh();
      })
      .fail(function(error) {
        checkError(error);
      });
  });

  
  if(isAutenticated()){
    
    getWithAuthorization('/me')
        .done(function (response) {
            user = response['user'][0];
        })
        .fail(function (error) {
        checkError(error);
    });
  }else{
    user = null;
  }


  function logout(){
    localStorage.removeItem("accessToken");
    window.location.replace("/login");
  }

  function refresh(){
    location.reload();
  }
  
  function checkError(error, alert = false){
    if(error.status == 401){
      logout();
    }
    else{
      if(alert){
        alert(error.responseJSON.error);
      }else{
        console.log(error.responseJSON.error);
      }
      
    }
  }

