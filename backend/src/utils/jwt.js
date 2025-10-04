/**
 * Utilidades para manejo de JSON Web Tokens
 * Funciones para generar y verificar tokens JWT
 */

const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generar un token JWT
 * @param {Object} payload - Datos a incluir en el token
 * @returns {string} - Token JWT
 */
const generateToken = (payload) => {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET no está configurado en las variables de entorno');
    }

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'todo-app-roles',
        audience: 'todo-app-users'
    });
};

/**
 * Verificar un token JWT
 * @param {string} token - Token a verificar
 * @returns {Object} - Payload decodificado
 */
const verifyToken = (token) => {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET no está configurado en las variables de entorno');
    }

    try {
        return jwt.verify(token, JWT_SECRET, {
            issuer: 'todo-app-roles',
            audience: 'todo-app-users'
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token expirado');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Token inválido');
        } else {
            throw new Error('Error al verificar token');
        }
    }
};

/**
 * Extraer token del header Authorization
 * @param {string} authHeader - Header de autorización
 * @returns {string|null} - Token extraído o null
 */
const extractTokenFromHeader = (authHeader) => {
    if (!authHeader) {
        return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }

    return parts[1];
};

module.exports = {
    generateToken,
    verifyToken,
    extractTokenFromHeader
};