import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import alarmRoutes from './routes/alarms.js';
import mediaRoutes from './routes/media.js';
import configRoutes from './routes/config.js';
import historyRoutes from './routes/history.js';
import { errorHandler } from './middleware/error.js';
import { uploadsDir } from './middleware/upload.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS - DEBE ir ANTES que helmet y otros middlewares
const defaultAllowedOrigins = [
	'https://todo-appr-roll-82ishiskw-kpbaldurs-projects.vercel.app',
	'http://localhost:5173'
];
const allowedOrigins = (process.env.CORS_ORIGINS
	? process.env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
	: defaultAllowedOrigins);

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
  
      const isAllowed = allowedOrigins.some(o =>
        typeof o === "string" ? o === origin : o.test(origin)
      );
  
      if (isAllowed) callback(null, true);
      else callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));

// Seguridad y parsing - DESPUÉS de CORS
app.use(helmet({ 
	crossOriginResourcePolicy: false, 
	crossOriginEmbedderPolicy: false 
}));
app.use(express.json());

// Sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, sameSite: 'lax' }
}));

// Servir archivos estáticos
app.use('/uploads', express.static(uploadsDir));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/alarms', alarmRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/config', configRoutes);
app.use('/api/history', historyRoutes);

// Salud del servicio
app.get('/health', (_, res) => res.json({ ok: true }));

// Middleware de error
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[API] running on port ${PORT}`));