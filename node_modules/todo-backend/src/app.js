/**
 * Configuración principal de Express
 * Aquí configuramos middleware, rutas y manejo de errores
 */
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// ===================
// MIDDLEWARE GLOBALES
// ===================

// Helmet: Seguridad básica
app.use(helmet());

// CORS: Permitir peticiones desde el frontend
app.use(cors({
    origin: ['http://localhost:4200', 'http://localhost:3000'],
    credentials: true
}));

// Morgan: Logging de peticiones HTTP
app.use(morgan('combined'));

// Body parser: Para leer JSON en las peticiones
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir estáticos de /uploads desde backend/src/uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===================
// RUTAS PRINCIPALES
// ===================

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({
        message: '🎯 API del Gestor de Tareas con Roles',
        version: '1.0.0',
        status: 'active',
        endpoints: {
            auth: '/api/auth',
            tasks: '/api/tasks',
            users: '/api/users'
        }
    });
});

// Rutas de la API (las crearemos después)
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/tasks', require('./routes/tasks'));
// app.use('/api/users', require('./routes/users'));

// ACTIVAR RUTAS DE LA API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/users', require('./routes/users'));

// ===================
// MANEJO DE ERRORES
// ===================

// Middleware para rutas no encontradas - SOLUCIÓN DEFINITIVA
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Ruta ${req.originalUrl} no encontrada`,
        method: req.method
    });
});

// Middleware de manejo de errores globales
app.use((err, req, res, next) => {
    console.error('💥 Error:', err.stack);
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

module.exports = app;