/**
 * Controlador de Autenticación
 * Maneja registro, login y operaciones relacionadas con autenticación
 */

const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

/**
 * Registrar un nuevo usuario
 * POST /api/auth/register
 */
const register = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Crear usuario
        const user = await User.create({
            username,
            email,
            password,
            role: role || 'user' // Por defecto es 'user'
        });

        // Generar token JWT
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role
        });

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user: user.toJSON(),
                token
            }
        });

    } catch (error) {
        console.error('Error en registro:', error.message);
        
        res.status(400).json({
            success: false,
            message: error.message || 'Error al registrar usuario'
        });
    }
};

/**
 * Iniciar sesión
 * POST /api/auth/login
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar datos requeridos
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        // Autenticar usuario
        const user = await User.authenticate(email, password);

        // Generar token JWT
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role
        });

        res.json({
            success: true,
            message: 'Inicio de sesión exitoso',
            data: {
                user: user.toJSON(),
                token
            }
        });

    } catch (error) {
        console.error('Error en login:', error.message);
        
        res.status(401).json({
            success: false,
            message: error.message || 'Error al iniciar sesión'
        });
    }
};

/**
 * Obtener perfil del usuario actual
 * GET /api/auth/profile
 */
const getProfile = async (req, res) => {
    try {
        // El usuario ya está disponible gracias al middleware de autenticación
        res.json({
            success: true,
            message: 'Perfil obtenido exitosamente',
            data: {
                user: req.user
            }
        });

    } catch (error) {
        console.error('Error obteniendo perfil:', error.message);
        
        res.status(500).json({
            success: false,
            message: 'Error al obtener perfil'
        });
    }
};

/**
 * Verificar si el token es válido
 * GET /api/auth/verify
 */
const verifyToken = async (req, res) => {
    try {
        // Si llegamos aquí, el token es válido (gracias al middleware)
        res.json({
            success: true,
            message: 'Token válido',
            data: {
                user: req.user,
                isValid: true
            }
        });

    } catch (error) {
        console.error('Error verificando token:', error.message);
        
        res.status(500).json({
            success: false,
            message: 'Error al verificar token'
        });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    verifyToken
};