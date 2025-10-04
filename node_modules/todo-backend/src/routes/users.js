// Router de Usuarios (solo admin)
const express = require('express');
const router = express.Router();

const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Obtener todos los usuarios (admin)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await User.findAll();
        res.json({
            success: true,
            message: 'Usuarios obtenidos exitosamente',
            data: {
                users: users.map(u => u.toJSON()),
                count: users.length
            }
        });
    } catch (error) {
        console.error('Error obteniendo usuarios:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios'
        });
    }
});

// Obtener usuario por ID (admin)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Usuario obtenido exitosamente',
            data: {
                user: user.toJSON()
            }
        });
    } catch (error) {
        console.error('Error obteniendo usuario:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuario'
        });
    }
});

module.exports = router;