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
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'wishlist_raul'
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
  app.put('/wishlists/:wishlistId/products/:productId', verifyToken, (req, res) => {
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
  
  // Ruta para eliminar una lista de deseos
  app.delete('/wishlists/:wishlistId', verifyToken, (req, res) => {
    const wishlistId = req.params.wishlistId;
  
    const sql = 'DELETE FROM wishlists WHERE id = ?';
    db.query(sql, [wishlistId], (err, result) => {
      if (err) {
        res.status(500).json({ error: 'Error al eliminar la lista de deseos' });
      } else if (result.affectedRows === 0) {
        res.status(404).json({ error: 'Lista de deseos no encontrada' });
      } else {
        res.status(200).json({ message: 'Lista de deseos eliminada' });
      }
    });
  });

  // Ruta para eliminar un producto de una lista
  app.delete('/wishlists/:wishlistId/products/:productId', verifyToken, (req, res) => {
    const wishlistId = req.params.wishlistId;
    const productId = req.params.productId;

    const sql = 'DELETE FROM products WHERE id = ? AND wishlist_id = ?';
    db.query(sql, [productId, wishlistId], (err, result) => {
      if (err) {
        res.status(500).json({ error: 'Error al eliminar el producto' });
      } else if (result.affectedRows === 0) {
        res.status(404).json({ error: 'Producto o lista no encontrados' });
      } else {
        res.status(200).json({ message: 'Producto eliminado' });
      }
    });
  });

  // Ruta para obtener todas las listas de deseos de un usuario
app.get('/wishlists', verifyToken, (req, res) => {
    const userId = req.user.id;
  
    const sql = `
      SELECT w.id, w.name, w.moderator_id, w.created_at
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
      SELECT w.id, w.name, w.moderator_id, w.created_at
      FROM wishlists w
      INNER JOIN wishlist_members wm ON wm.wishlist_id = w.id
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

  // Ruta para compartir una lista de deseos con un usuario
app.post('/wishlists/:wishlistId/share', verifyToken, (req, res) => {
    const wishlistId = req.params.wishlistId;
    const { username } = req.body;
  
    const sql = 'SELECT id FROM users WHERE username = ?';
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

// Iniciar el servidor
app.listen(3000, () => {
  console.log('Servidor iniciado en el puerto 3000');
});
