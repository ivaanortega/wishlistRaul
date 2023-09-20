const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
// Habilitar CORS
app.use(cors());

app.use(express.json());

// Configuración de la base de datos
const db = mysql.createConnection({
  host: process.env.HOST || 'localhost',
  user: process.env.USER ||'root',
  password: process.env.PASSWORD ||'root',
  database: process.env.DATABASE  ||'wishlist_raul'
});


app.get("/getMysqlStatus", (req, res) => {
  
  db.connect((err) => {
    if (err) {
      console.log("Database Connection Failed !!!", err);
    } else {
      console.log("connected to Database");
    }
    });
  db.ping((err) => {
    if(err) return res.status(500).send("MySQL Server is Down " + process.env.USER );
      
    res.send("MySQL Server is Active");
  })
});

// Ruta para registrar un usuario
app.post('/register', (req, res) => {
    console.log(req.body);
  const { username, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
  db.query(sql, [username, hashedPassword], (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error al registrar el usuario' });
    } else {
      res.status(200).json({ message: 'Usuario registrado exitosamente' });
    }
  });
});

// Ruta para iniciar sesión
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const sql = 'SELECT * FROM users WHERE username = ?';
  db.query(sql, [username], (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error al iniciar sesión' });
    } else if (results.length === 0) {
      res.status(401).json({ error: 'Nombre de usuario o contraseña incorrectos' });
    } else {
      const user = results[0];
      const passwordMatch = bcrypt.compareSync(password, user.password);

      if (passwordMatch) {
        const token = jwt.sign({ id: user.id, username: user.username }, '?we=w232asdkle394AD', { expiresIn: '3h' });
        res.status(200).json({ token });
      } else {
        res.status(401).json({ error: 'Nombre de usuario o contraseña incorrectos' });
      }
    }
  });
});


// Ruta para crear una lista de deseos
app.post('/wishlists', verifyToken, (req, res) => {

    const { name } = req.body;
    const moderator_id = req.user.id;
    
    const sql = 'INSERT INTO wishlists (name, moderator_id) VALUES (?, ?)';
    db.query(sql, [name, moderator_id], (err, result) => {
      if (err) {
        res.status(500).json({ error: 'Error al crear la lista de deseos' });
      } else {
        const wishlistId = result.insertId;
        res.status(200).json({ message: 'Lista de deseos creada', wishlistId });
      }
    });
  });
  
  // Ruta para añadir un producto a una lista de deseos
  app.post('/wishlists/:wishlistId/products', verifyToken, (req, res) => {
    const { name } = req.body;
    const wishlistId = req.params.wishlistId;
  
    const sql = 'INSERT INTO products (wishlist_id, name) VALUES (?, ?)';
    db.query(sql, [wishlistId, name], (err, result) => {
      if (err) {
        res.status(500).json({ error: 'Error al añadir el producto a la lista' });
      } else {
        const productId = result.insertId;
        res.status(200).json({ message: 'Producto añadido a la lista', productId });
      }
    });
  });
  
  // Ruta para marcar un producto como comprado
  app.put('/wishlists/:wishlistId/products/:productId/buy', verifyToken, (req, res) => {
    const wishlistId = req.params.wishlistId;
    const productId = req.params.productId;
  
    const sql = 'UPDATE products SET purchased = true WHERE id = ? AND wishlist_id = ?';
    db.query(sql, [productId, wishlistId], (err, result) => {
      if (err) {
        res.status(500).json({ error: 'Error al marcar el producto como comprado' });
      } else if (result.affectedRows === 0) {
        res.status(404).json({ error: 'Producto no encontrado' });
      } else {
        res.status(200).json({ message: 'Producto marcado como comprado' });
      }
    });
  });
    // Ruta para marcar un producto como no comprado
    app.put('/wishlists/:wishlistId/products/:productId/unbuy', verifyToken, (req, res) => {
      const wishlistId = req.params.wishlistId;
      const productId = req.params.productId;
    
      const sql = 'UPDATE products SET purchased = false WHERE id = ? AND wishlist_id = ?';
      db.query(sql, [productId, wishlistId], (err, result) => {
        if (err) {
          res.status(500).json({ error: 'Error al marcar el producto como comprado' });
        } else if (result.affectedRows === 0) {
          res.status(404).json({ error: 'Producto no encontrado' });
        } else {
          res.status(200).json({ message: 'Producto marcado como comprado' });
        }
      });
    });
  

  // Ruta para eliminar una lista de deseos
app.delete('/wishlists/:wishlistId', verifyToken, (req, res) => {
  const wishlistId = req.params.wishlistId;
  const userId = req.user.id;

  // Check if the wishlist is shared
  const checkSharedQuery = 'SELECT * FROM wishlist_members WHERE wishlist_id = ? AND user_id = ?';

  db.query(checkSharedQuery, [wishlistId, userId], (err, sharedResults) => {
    if (err) {
      res.status(500).json({ error: 'Error al verificar si la lista de deseos está compartida' });
    } else {
      // If the wishlist is shared, remove the link (shared member)
      if (sharedResults.length > 0) {
        const removeLinkQuery = 'DELETE FROM wishlist_members WHERE wishlist_id = ? AND user_id = ?';

        db.query(removeLinkQuery, [wishlistId, userId], (err, result) => {
          if (err) {
            res.status(500).json({ error: 'Error al eliminar el enlace compartido' });
          } else if (result.affectedRows === 0) {
            res.status(404).json({ error: 'No tienes permiso para eliminar el enlace compartido' });
          } else {
            res.status(200).json({ message: 'Enlace compartido eliminado' });
          }
        });
      } else {
        // If the wishlist is not shared, directly delete it
        const deleteWishlistQuery = 'DELETE FROM wishlists WHERE id = ? AND moderator_id = ?';

        db.query(deleteWishlistQuery, [wishlistId, userId], (err, result) => {
          if (err) {
            res.status(500).json({ error: 'Error al eliminar la lista de deseos' });
          } else if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Lista de deseos no encontrada o no tienes permiso para eliminarla' });
          } else {
            res.status(200).json({ message: 'Lista de deseos eliminada' });
          }
        });
      }
    }
  });
});


  // Ruta para eliminar un producto de una lista
app.delete('/wishlists/:wishlistId/products/:productId', verifyToken, (req, res) => {
  const wishlistId = req.params.wishlistId;
  const productId = req.params.productId;
  const userId = req.user.id;

  // Check if the user making the request is the moderator of the wishlist
  const checkModeratorQuery = 'SELECT moderator_id FROM wishlists WHERE id = ?';

  db.query(checkModeratorQuery, [wishlistId], (err, result) => {
      if (err) {
          return res.status(500).json({ error: 'Error al verificar el moderador de la lista de deseos' });
      }

      if (result.length === 0) {
          return res.status(404).json({ error: 'Lista de deseos no encontrada' });
      }

      const moderatorId = result[0].moderator_id;

      if (userId !== moderatorId) {
          return res.status(403).json({ error: 'No tienes permiso para eliminar este producto' });
      }

      // If the user is the moderator, proceed to delete the product
      const deleteProductQuery = 'DELETE FROM products WHERE id = ? AND wishlist_id = ?';

      db.query(deleteProductQuery, [productId, wishlistId], (err, result) => {
          if (err) {
              res.status(500).json({ error: 'Error al eliminar el producto' });
          } else if (result.affectedRows === 0) {
              res.status(404).json({ error: 'Producto o lista no encontrados' });
          } else {
              res.status(200).json({ message: 'Producto eliminado' });
          }
      });
  });
});


  // Ruta para obtener todas las listas de deseos de un usuario
app.get('/wishlists', verifyToken, (req, res) => {
    const userId = req.user.id;
  
    const sql = `
        SELECT w.id, w.name, w.moderator_id, w.created_at, 
        CASE
          WHEN EXISTS (SELECT 1 FROM products p WHERE p.wishlist_id = w.id AND p.purchased = 0) THEN true
          ELSE false
        END AS hasProducts,
        CASE
          WHEN EXISTS (SELECT 1 FROM wishlist_members wm WHERE wm.wishlist_id = w.id) THEN true
          ELSE false
        END AS shared
        FROM wishlists w
        WHERE w.moderator_id = ?
    `;
    db.query(sql, [userId], (err, results) => {
      if (err) {
        res.status(500).json({ error: 'Error al obtener las listas de deseos' });
      } else {
        res.status(200).json({ wishlists: results });
      }
    });
  });
  
  // Ruta para obtener las listas de deseos compartidas con un usuario
  app.get('/shared-wishlists', verifyToken, (req, res) => {
    const userId = req.user.id;
  
    const sql = `
      SELECT w.id, w.name, u.username as moderator_id, w.created_at, wm.attend
      FROM wishlists w
      INNER JOIN wishlist_members wm ON wm.wishlist_id = w.id
      INNER JOIN users u ON u.id = w.moderator_id
      WHERE wm.user_id = ?
    `;
    db.query(sql, [userId], (err, results) => {
      if (err) {
        res.status(500).json({ error: 'Error al obtener las listas de deseos compartidas' });
      } else {
        res.status(200).json({ sharedWishlists: results });
      }
    });
  });


  // Ruta para obtener la lista de usuarios compartidos en una lista de deseos
  app.get('/wishlists/:wishlistId/shared-users', verifyToken, (req, res) => {
    const wishlistId = req.params.wishlistId;

    // Verifica si el usuario autenticado es el moderador de la lista de deseos
    const moderatorId = req.user.id;
    const checkModerator = 'SELECT id FROM wishlists WHERE id = ? AND moderator_id = ?';

    db.query(checkModerator, [wishlistId, moderatorId], (err, result) => {
      if (err) {
        res.status(500).json({ error: 'Error al verificar el moderador de la lista de deseos' });
      } else if (result.length === 0) {
        res.status(403).json({ error: 'No tienes permiso para acceder a esta lista de deseos' });
      } else {
        // Si el usuario es el moderador, busca los usuarios compartidos en la lista de deseos
        const sql = `
          SELECT u.id, u.username, u.email, wm.attend
          FROM users u
          INNER JOIN wishlist_members wm ON u.id = wm.user_id
          WHERE wm.wishlist_id = ?
        `;

        db.query(sql, [wishlistId], (err, results) => {
          if (err) {
            res.status(500).json({ error: 'Error al obtener la lista de usuarios compartidos' });
          } else {
            res.status(200).json({ sharedUsers: results });
          }
        });
      }
    });
  });


  // Ruta para compartir una lista de deseos con un usuario
app.post('/wishlists/:wishlistId/share', verifyToken, (req, res) => {
    const wishlistId = req.params.wishlistId;
    const { username } = req.body;
  
    const sql = 'SELECT id FROM users WHERE username = ? and id != ' + req.user.id;
    db.query(sql, [username], (err, results) => {
      if (err) {
        res.status(500).json({ error: 'Error al compartir la lista de deseos' });
      } else if (results.length === 0) {
        res.status(404).json({ error: 'Usuario no encontrado' });
      } else {
        const userId = results[0].id;
        const shareSql = 'INSERT INTO wishlist_members (wishlist_id, user_id) VALUES (?, ?)';
        db.query(shareSql, [wishlistId, userId], (shareErr, shareResult) => {
          if (shareErr) {
            res.status(500).json({ error: 'Error al compartir la lista de deseos' });
          } else {
            res.status(200).json({ message: 'Lista de deseos compartida con éxito' });
          }
        });
      }
    });
  });
  
  // Ruta para obtener los productos de una lista de deseos
  app.get('/wishlists/:wishlistId/products', verifyToken, (req, res) => {
    const wishlistId = req.params.wishlistId;
    const userId = req.user.id;

    const sql = `
      SELECT p.id, p.name, p.purchased
      FROM products p
      INNER JOIN wishlists w ON p.wishlist_id = w.id
      LEFT JOIN wishlist_members wm ON wm.wishlist_id = w.id
      WHERE (w.moderator_id = ? OR wm.user_id = ?) AND w.id = ?
    `;

    db.query(sql, [userId, userId, wishlistId], (err, results) => {
      if (err) {
        res.status(500).json({ error: 'Error al obtener los productos de la lista de deseos' });
      } else {
        res.status(200).json({ products: results });
      }
    });
  });

// Middleware para verificar el token de autenticación
function verifyToken(req, res, next) {
    // Obtener el token de autorización del encabezado de la solicitud
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
  
    // Verificar si el token existe
    if (!token) {
      return res.status(401).json({ error: 'Token de autenticación no proporcionado' });
    }
  
    try {
      // Verificar y decodificar el token
      const decoded = jwt.verify(token, '?we=w232asdkle394AD');
  
      // Agregar el objeto decodificado al objeto de solicitud para usarlo en los controladores posteriores
      req.user = decoded;
  
      // Continuar con el siguiente middleware o controlador
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Token de autenticación inválido' });
    }
  }

  // Ruta para editar la información del usuario
  app.put('/users/:id', verifyToken, (req, res) => {
    const userId = req.params.id;
    const { username, email, theme } = req.body;

    // Check if the authenticated user is the same as the user being edited
    if (req.user.id !== parseInt(userId)) {
        return res.status(403).json({ error: 'No tienes permiso para editar este usuario' });
    }

    const updateUserQuery = 'UPDATE users SET username = ?, email = ?, theme = ? WHERE id = ?';
    
    db.query(updateUserQuery, [username, email, theme, userId], (err, result) => {
        if (err) {
            res.status(500).json({ error: 'Error al editar la información del usuario' });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Usuario no encontrado' });
        } else {
            res.status(200).json({ message: 'Información de usuario actualizada' });
        }
    });
  });

  // Ruta para actualizar el estado de asistencia a una lista de deseos
app.put('/wishlists/:wishlistId/attend', verifyToken, (req, res) => {
  const userId = req.user.id;
  const wishlistId = req.params.wishlistId;
  const { assist } = req.body;

  // Update the 'assist' status for the user and wishlist
  const updateAttendStatusQuery = 'UPDATE wishlist_members SET attend = ? WHERE wishlist_id = ? AND user_id = ?';

  db.query(updateAttendStatusQuery, [assist, wishlistId, userId], (err, result) => {
      if (err) {
          res.status(500).json({ error: 'Error al actualizar el estado de asistencia' });
      } else if (result.affectedRows === 0) {
          res.status(404).json({ error: 'No tienes permiso para actualizar la asistencia o la lista de deseos no se encuentra' });
      } else {
          res.status(200).json({ message: 'Estado de asistencia actualizado' });
      }
  });
});

// Ruta para eliminar la cuenta de usuario
app.delete('/users/:id', verifyToken, (req, res) => {
  const userId = req.params.id;

  // Check if the authenticated user is the same as the user being deleted
  if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta cuenta de usuario' });
  }

  const deleteUserQuery = 'DELETE FROM users WHERE id = ?';

  db.query(deleteUserQuery, [userId], (err, result) => {
      if (err) {
          res.status(500).json({ error: 'Error al eliminar la cuenta de usuario' });
      } else if (result.affectedRows === 0) {
          res.status(404).json({ error: 'Usuario no encontrado' });
      } else {
          res.status(200).json({ message: 'Cuenta de usuario eliminada' });
      }
  });
});


// Iniciar el servidor
app.listen(process.env.PORT ||3000, () => {
  console.log('Servidor iniciado en el puerto 3000');
});
