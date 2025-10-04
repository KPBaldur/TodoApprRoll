/**
 * Servidor principal de la aplicación
 * Este archivo inicializa el servidor Express y configura el puerto
 */

const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

console.log(`📝 Entorno: ${process.env.NODE_ENV || 'unknown'}`);
if (!process.env.JWT_SECRET) {
    console.warn('⚠️ JWT_SECRET NO configurado en variables de entorno. El backend no podrá generar tokens.');
} else {
    console.log('🔐 JWT_SECRET cargado correctamente');
}

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
    console.error('💥 Error no capturado:', err.message);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('💥 Promesa rechazada:', err.message);
    process.exit(1);
});