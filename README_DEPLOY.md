# TodoApp - Guía de Despliegue con Cloudinary

## 🏗️ Arquitectura del Sistema

### Backend (Render)
- **URL**: `https://todoapp-backend.onrender.com`
- **Tecnología**: Node.js + Express
- **Almacenamiento**: Cloudinary para archivos multimedia
- **Base de datos**: JSON files (persistente en Render)

### Frontend (Vercel)
- **URL**: `https://todoapp-frontend.vercel.app`
- **Tecnología**: React + Vite + TypeScript
- **API**: Conecta directamente a Render (sin proxy en producción)

## 🔧 Configuración de Cloudinary

### 1. Crear cuenta en Cloudinary
1. Ve a [cloudinary.com](https://cloudinary.com)
2. Crea una cuenta gratuita
3. Obtén tus credenciales del Dashboard:
   - Cloud Name
   - API Key
   - API Secret

### 2. Variables de entorno en Render

En el panel de Render, configura estas variables:

```bash
# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# CORS
CORS_ORIGINS=https://todoapp-frontend.vercel.app,http://localhost:5173

# Base de datos
SESSION_SECRET=tu_session_secret_seguro
ADMIN_USER=BaldurDev
ADMIN_PASS_HASH=tu_hash_bcrypt
NODE_ENV=production
DATA_DIR=/opt/render/project/src/database/json
UPLOADS_DIR=/opt/render/project/src/uploads
```

### 3. Variables de entorno en Vercel

En el panel de Vercel, configura:

```bash
# API URLs
VITE_API_URL=https://todoapp-backend.onrender.com
VITE_API_URL_DEV=http://localhost:3000
```

## 📁 Flujo de Archivos Multimedia

### Antes (Sistema Local)
```
Frontend → Backend → /uploads/ → Base de datos (ruta local)
```

### Ahora (Cloudinary)
```
Frontend → Backend → Cloudinary → Base de datos (URL Cloudinary)
```

### Proceso de subida:
1. **Frontend** envía archivo via `FormData` a `/api/media/upload`
2. **Backend** recibe archivo con multer (memoria)
3. **Backend** sube a Cloudinary con `cloudinary.uploader.upload()`
4. **Backend** guarda `secure_url` en base de datos
5. **Frontend** usa URL de Cloudinary directamente

## 🛠️ Endpoints que usan recursos multimedia

### `/api/media`
- `GET /` - Lista todos los archivos
- `POST /` - Agregar URL existente
- `POST /upload` - Subir archivo nuevo
- `PUT /:id` - Renombrar archivo
- `DELETE /:id` - Eliminar archivo (también de Cloudinary)

### Respuesta JSON de ejemplo:
```json
{
  "success": true,
  "data": {
    "media": [
      {
        "id": "uuid-123",
        "type": "audio",
        "name": "mi-alarma.mp3",
        "path": "https://res.cloudinary.com/tu-cloud/video/upload/v1234567890/todoapp-media/1234567890-mi-alarma.mp3",
        "cloudinaryId": "todoapp-media/1234567890-mi-alarma"
      }
    ],
    "count": 1
  }
}
```

## 🔄 Migración desde sistema local

### Archivos existentes
- Los archivos ya subidos seguirán funcionando
- `getMediaUrl()` detecta automáticamente URLs completas vs rutas locales
- Compatibilidad total con datos existentes

### Nuevos archivos
- Todos los archivos nuevos se suben a Cloudinary
- Se almacena tanto `path` (URL) como `cloudinaryId` (para eliminación)

## 🚀 Comandos de despliegue

### Backend (Render)
```bash
# El render.yaml ya está configurado
# Solo necesitas hacer push al repositorio
git add .
git commit -m "Add Cloudinary integration"
git push origin main
```

### Frontend (Vercel)
```bash
# Vercel detecta automáticamente los cambios
# Build command: npm install && npm run build
# Output directory: dist
```

## 🧪 Verificación del despliegue

### 1. Backend
```bash
# Health check
curl https://todoapp-backend.onrender.com/health
# Respuesta esperada: {"ok": true}

# Listar media
curl https://todoapp-backend.onrender.com/api/media
# Respuesta esperada: JSON con array de media
```

### 2. Frontend
- Abre `https://todoapp-frontend.vercel.app`
- Verifica que no hay errores CORS en la consola
- Prueba subir un archivo multimedia
- Verifica que se reproduce/muestra correctamente

### 3. Cloudinary
- Ve al Dashboard de Cloudinary
- Verifica que los archivos aparecen en la carpeta `todoapp-media`
- Prueba eliminar un archivo desde la app y verifica que se elimina de Cloudinary

## 🔒 Seguridad

### Validaciones de archivo
- Tipos permitidos: `audio/mpeg`, `audio/mp3`, `audio/wav`, `audio/ogg`, `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `video/mp4`
- Límite de tamaño: 10MB
- Validación de MIME type en backend

### CORS
- Solo permite dominios específicos
- Credentials habilitados para sesiones
- Headers permitidos: `Content-Type`, `Authorization`

## 🐛 Troubleshooting

### Error: "Cloudinary config not found"
- Verifica que las variables de entorno estén configuradas en Render
- Revisa los logs de Render para errores de configuración

### Error: "Failed to upload to Cloudinary"
- Verifica que las credenciales de Cloudinary sean correctas
- Revisa el límite de almacenamiento en tu plan de Cloudinary

### Error: "CORS policy"
- Verifica que `CORS_ORIGINS` incluya tu dominio de Vercel
- Asegúrate de que el frontend use `VITE_API_URL` en producción

### Archivos no se muestran
- Verifica que `getMediaUrl()` esté siendo usado correctamente
- Revisa que las URLs de Cloudinary sean válidas
- Comprueba la consola del navegador para errores de carga

## 📊 Monitoreo

### Logs importantes
- `CORS check for origin:` - Verifica dominios permitidos
- `Archivo subido a Cloudinary:` - Confirma subidas exitosas
- `Archivo eliminado de Cloudinary:` - Confirma eliminaciones

### Métricas de Cloudinary
- Ve al Dashboard para ver uso de almacenamiento
- Monitorea transformaciones y bandwidth
- Revisa logs de API para errores
