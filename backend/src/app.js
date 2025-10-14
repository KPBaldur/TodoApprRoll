const express = require('express');
const path = require('path');
const cors = require('cors');

const tasksRoutes = require('./routes/tasks');
const mediaRoutes = require('./routes/media');
const configRoutes = require('./routes/config');
const errorHandler = require('./middleware/error');
const { uploadsDir } = require('./middleware/upload'); // usa la misma carpeta que multer

const app = express();

// Middlewares base
app.use(cors());
app.use(express.json());

// Rutas API
app.use('/api/tasks', tasksRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/config', configRoutes);

// Exponer la carpeta de cargas
app.use('/uploads', express.static(uploadsDir)); // sirviendo backend/uploads

app.use('/api/alarms', require('./routes/alarms'));

// Manejo de errores (siempre al final)
app.use(errorHandler);

module.exports = app;