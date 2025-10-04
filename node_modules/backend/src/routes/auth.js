// Router de Autenticación
const express = require('express');
const router = express.Router();

const {
    register,
    login,
    getProfile,
    verifyToken: verifyTokenController
} = require('../controllers/authController');

const { authenticateToken } = require('../middleware/auth');

// Registro de usuario (público)
router.post('/register', register);

// Login de usuario (público)
router.post('/login', login);

// Perfil del usuario autenticado (protegido)
router.get('/profile', authenticateToken, getProfile);

// Verificar si el token es válido (protegido)
router.get('/verify', authenticateToken, verifyTokenController);

module.exports = router;