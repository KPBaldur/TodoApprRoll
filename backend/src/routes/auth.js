import express from 'express';
import bcrypt from 'bcrypt';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Usuario y contraseña son requeridos' 
      });
    }

    // Verificar credenciales (en producción usar base de datos)
    const adminUser = process.env.ADMIN_USER || 'BaldurDev';
    const adminPassHash = process.env.ADMIN_PASS_HASH || '$2b$12$default.hash.here';
    
    if (username === adminUser) {
      const isValidPassword = await bcrypt.compare(password, adminPassHash);
      
      if (isValidPassword) {
        req.session.user = { username, role: 'admin' };
        req.session.isAuthenticated = true;
        
        return res.json({
          success: true,
          message: 'Login exitoso',
          user: { username, role: 'admin' }
        });
      }
    }
    
    return res.status(401).json({
      success: false,
      message: 'Credenciales inválidas'
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error al cerrar sesión'
      });
    }
    res.clearCookie('connect.sid');
    res.json({
      success: true,
      message: 'Sesión cerrada correctamente'
    });
  });
});

// Verificar sesión
router.get('/session', (req, res) => {
  if (req.session.isAuthenticated) {
    res.json({
      success: true,
      user: req.session.user,
      isAuthenticated: true
    });
  } else {
    res.json({
      success: false,
      isAuthenticated: false
    });
  }
});

// Ruta protegida de ejemplo
router.get('/protected', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Acceso autorizado',
    user: req.session.user
  });
});

export default router;
