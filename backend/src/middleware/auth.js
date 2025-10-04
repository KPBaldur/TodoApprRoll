/**
 * Middleware de Autenticación
 * Verifica tokens JWT y maneja autorización por roles
 */

const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Middleware para verificar autenticación JWT
 * Verifica que el usuario esté autenticado con un token válido
 */
const authenticateToken = async (req, res, next) => {
    try {
        // Extraer token del header Authorization
        const authHeader = req.headers.authorization;
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de acceso requerido'
            });
        }

        // Verificar y decodificar el token
        const decoded = verifyToken(token);
        
        // Buscar el usuario en la base de datos
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Agregar información del usuario a la request
        req.user = user.toJSON(); // Sin contraseña
        req.userId = user.id;
        req.userRole = user.role;

        next();
    } catch (error) {
        console.error('Error en autenticación:', error.message);
        
        return res.status(401).json({
            success: false,
            message: error.message || 'Token inválido'
        });
    }
};

/**
 * Middleware para verificar rol de administrador
 * Debe usarse después de authenticateToken
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Autenticación requerida'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requieren permisos de administrador'
        });
    }

    next();
};

/**
 * Middleware para verificar que el usuario puede acceder a sus propios recursos
 * o es administrador
 */
const requireOwnershipOrAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Autenticación requerida'
        });
    }

    // Los administradores pueden acceder a todo
    if (req.user.role === 'admin') {
        return next();
    }

    // Para usuarios normales, verificar que el recurso les pertenece
    const resourceUserId = req.params.userId || req.body.userId;
    
    if (resourceUserId && resourceUserId !== req.user.id) {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Solo puedes acceder a tus propios recursos'
        });
    }

    next();
};

/**
 * Middleware opcional de autenticación
 * No falla si no hay token, pero agrega información del usuario si existe
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = extractTokenFromHeader(authHeader);

        if (token) {
            const decoded = verifyToken(token);
            const user = await User.findById(decoded.userId);
            
            if (user) {
                req.user = user.toJSON();
                req.userId = user.id;
                req.userRole = user.role;
            }
        }
    } catch (error) {
        // En autenticación opcional, ignoramos errores de token
        console.log('Token opcional inválido:', error.message);
    }

    next();
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireOwnershipOrAdmin,
    optionalAuth
};