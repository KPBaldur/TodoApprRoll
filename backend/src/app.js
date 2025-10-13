const express = require('express');
const cors = require('cors');

const tasksRoutes = require('./routes/tasks');
const mediaRoutes = require('./routes/media');
const configRoutes = require('./routes/config');
const errorHandler = require('./middleware/error');
const path = require('path');
const { uploadsDir } = require('./middleware/upload');

const app = express();

// Middlewares base
app.use(cors());
app.use(express.json());

// Rutas API
app.use('/api/tasks', tasksRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/config', configRoutes);
app.use('/uploads', require('express').static(uploadsDir));

// Manejo de errores (siempre al final)
app.use(errorHandler);

module.exports = app;