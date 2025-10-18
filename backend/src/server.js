import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import alarmRoutes from './routes/alarms.js';
import mediaRoutes from './routes/media.js';
import configRoutes from './routes/config.js';
import historyRoutes from './routes/history.js';
import { errorHandler } from './middleware/error.js';

// ========================================================
// 🔧 Configuración inicial
// ========================================================
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ========================================================
// ☁️ Configurar Cloudinary
// ========================================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('✅ Cloudinary configurado correctamente');

// ========================================================
// 🌐 Configuración de CORS
// ========================================================
const defaultAllowedOrigins = [
  /\.vercel\.app$/, // cualquier subdominio de vercel.app
  'http://localhost:5173',
];

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : defaultAllowedOrigins;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.some(o =>
        typeof o === 'string' ? o === origin : o.test(origin)
      );
      if (isAllowed) callback(null, true);
      else callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

console.log('✅ CORS configurado con orígenes permitidos:', allowedOrigins);

// ========================================================
// 🛡️ Seguridad y middlewares básicos
// ========================================================
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(express.json({ limit: '10mb' })); // Aumenta el límite para archivos base64

// ========================================================
// 🔒 Configuración de sesiones
// ========================================================
if (!process.env.SESSION_SECRET) {
  console.warn(
    '⚠️ SESSION_SECRET no está definido. Usa un valor seguro en producción.'
  );
}

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // solo HTTPS en producción
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24, // 1 día
    },
  })
);

// ========================================================
// 🧭 Rutas principales
// ========================================================
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/alarms', alarmRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/config', configRoutes);
app.use('/api/history', historyRoutes);

// ========================================================
// 🩺 Health Check
// ========================================================
app.get('/health', (_, res) => res.json({ ok: true, service: 'TodoApp API' }));

// ========================================================
// ⚠️ Middleware global de manejo de errores
// ========================================================
app.use(errorHandler);

// ========================================================
// 🚀 Inicialización del servidor
// ========================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 [API] corriendo en puerto ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
});
  