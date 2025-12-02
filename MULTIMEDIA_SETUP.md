# 📸 Administrador Multimedia - TodoApprRoll

## ✅ Estado del Proyecto

El **Administrador Multimedia** ya está **completamente implementado** en el proyecto. Se han habilitado todas las rutas y componentes necesarios.

## 🔧 Configuración Requerida

### Variables de Entorno del Backend

Debes agregar las siguientes variables en el archivo `.env` del backend:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

**Alternativa (usando URL completa):**
```env
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

### ¿Cómo obtener las credenciales de Cloudinary?

1. Ve a [cloudinary.com](https://cloudinary.com)
2. Crea una cuenta gratuita (si no la tienes)
3. En el Dashboard encontrarás:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

## 🎯 Funcionalidades Implementadas

### Backend:
- ✅ Modelo `Media` en Prisma (base de datos)
- ✅ Controlador de media (`mediaController.ts`)
- ✅ Rutas de API (`/api/media`)
- ✅ Servicio de Cloudinary (`mediaService.ts`)
- ✅ Subida de archivos con Multer
- ✅ Eliminación de archivos remotos

### Frontend:
- ✅ Página de Multimedia (`MediaPage.tsx`)
- ✅ Dashboard de Media (`MediaDashboard.tsx`)
- ✅ Tarjetas de Items (`MediaItemCard.tsx`)
- ✅ Panel de Vista Previa (`MediaPreviewPanel.tsx`)
- ✅ Modal de Subida (`MediaUploadModal.tsx`)
- ✅ Estilos CSS completos (`media.css`)
- ✅ Servicios de API (`media.ts`)
- ✅ Ruta `/media` habilitada en App.tsx
- ✅ Link "Multimedia" habilitado en Sidebar

## 📝 Formatos Soportados

### Imágenes:
- JPEG / JPG
- PNG
- WebP
- GIF

### Audio:
- MP3
- WAV
- OGG
- AAC
- M4A

## 🚀 Cómo Usar

1. **Configura Cloudinary** (ver sección de configuración arriba)
2. **Reinicia el backend** para que cargue las nuevas variables de entorno
3. **Accede a la aplicación** y haz login
4. **Navega** a la sección "Multimedia" desde el menú lateral
5. **Sube archivos** usando el botón "+ Subir archivo"
6. **Filtra** por tipo: Todo / Imágenes / Audios
7. **Selecciona** un archivo para ver su preview
8. **Elimina** archivos que ya no necesites

## 🔍 Verificación

### Backend:
```bash
cd backend
npm install multer cloudinary
npm run dev
```

### Frontend:
```bash
cd frontend
npm run dev
```

### Endpoints de API:
- `GET /api/media` - Obtener todos los archivos del usuario
- `POST /api/media` - Subir un nuevo archivo
- `DELETE /api/media/:id` - Eliminar un archivo

## 🎨 Características

- ✨ Drag & Drop para subir archivos
- 🖼️ Vista previa de imágenes
- 🎵 Reproductor de audio integrado
- 🗑️ Eliminación de archivos (local + cloudinary)
- 🔍 Filtrado por tipo de archivo
- 📱 Diseño responsivo
- 🎯 Grid adaptable (1-3 columnas según pantalla)
- 🌙 Tema oscuro coherente con el resto de la app

## ⚠️ Notas Importantes

1. Los archivos se suben a **Cloudinary** (no se almacenan localmente)
2. La carpeta temporal `uploads/` en el backend se limpia automáticamente
3. Al eliminar un archivo, se elimina tanto del registro en DB como de Cloudinary
4. Cada usuario solo puede ver y gestionar sus propios archivos
5. Las alarmas pueden vincularse con archivos multimedia (audio para sonido, imagen para notificación)

## 🔗 Relación con Alarmas

El modelo `Media` está diseñado para trabajar con el sistema de alarmas:
- Las alarmas pueden tener un `audioId` (para sonido personalizado)
- Las alarmas pueden tener un `imageId` (para imagen de notificación)

## 📦 Dependencias

### Backend:
- `multer` - Manejo de archivos multipart/form-data
- `cloudinary` - Almacenamiento en la nube
- `@prisma/client` - ORM para la base de datos

### Frontend:
- `axios` - Cliente HTTP
- `react-router-dom` - Navegación

## 🐛 Troubleshooting

### Error: "CLOUDINARY_URL not found"
**Solución:** Asegúrate de tener las variables de entorno configuradas correctamente en `.env`

### Error: "Archivo no se sube"
**Solución:** Verifica:
1. Tamaño del archivo (Cloudinary gratuito: max 10MB)
2. Formato soportado
3. Conexión a Internet
4. Credenciales de Cloudinary válidas

### Error: "No se puede eliminar archivo"
**Solución:** El archivo podría no existir en Cloudinary o ya fue eliminado. El sistema maneja estos casos gracefully.

---

## 🎉 ¡Todo listo!

El administrador multimedia está **completamente funcional**. Solo necesitas configurar Cloudinary y estará listo para usar.
