# 🔔 Sistema de Alarmas Pomodoro - Documentación Completa

## 📋 Descripción del Sistema

Sistema de alarmas tipo **Pomodoro** que permite:
- ✅ Crear alarmas que se repiten cada X minutos
- ✅ Reproducir audio automáticamente cuando la alarma suena
- ✅ Mostrar popup visual con imagen personalizada
- ✅ **Postponer**: Suena de nuevo en el próximo intervalo
- ✅ **Detener**: Desactiva la alarma automáticamente

---

## 🔧 Correcciones Implementadas

### ❌ **Problemas Encontrados:**

1. **AlarmProvider vacío**: Funciones dummy sin implementación
2. **Incompatibilidad de datos**: Frontend usa `enabled/snoozeMins`, Backend usa `active/durationMin`
3. **SSE sin autenticación**: No se enviaba el token JWT
4. **Sin popup funcional**: No existía el modal con botones Postponer/Detener
5. **Sin audio automático**: El audio solo se reproducía manualmente

### ✅ **Soluciones Aplicadas:**

#### 1. **AlarmProvider.tsx - Implementación Completa**
- ✅ Conexión SSE con autenticación JWT
- ✅ Popup modal con diseño premium
- ✅ Reproducción automática de audio en loop
- ✅ Cola de alarmas (si suenan múltiples)
- ✅ Botones funcionales: **Postponer** y **Detener**

#### 2. **alarmService.ts - Mapeo de Datos**
- ✅ Funciones de mapeo `frontend ↔ backend`
- ✅ Frontend: `enabled`, `snoozeMins`
- ✅ Backend: `active`, `durationMin`
- ✅ Conversión automática en todas las operaciones

#### 3. **Estilos Premium - alarmPopup.css**
- ✅ Animaciones (fadeIn, slideIn, pulse)
- ✅ Diseño glassmorphism
- ✅ Gradientes vibrantes
- ✅ Responsive (desktop + mobile)

---

## ⚙️ Configuración Requerida

### **Frontend - Variables de Entorno**

Crea o edita el archivo `.env` en `frontend/`:

```env
VITE_BACKEND_URL=http://localhost:4000
```

**Para producción (Vercel):**
```env
VITE_BACKEND_URL=https://tu-backend.render.com
```

### **Backend - Variables de Entorno**

Ya configuradas en `backend/.env`:
```env
JWT_SECRET=TodoAppRollSecretKey
DATABASE_URL=postgresql://...
```

---

## 🚀 Flujo de Funcionamiento

### **1. Creación de Alarma**
```
Usuario → AlarmForm → API POST /api/alarms
          ↓
       Backend crea alarma con:
       - type: "pomodoro"
       - durationMin: 25 (ejemplo)
       - active: true
       - scheduleAt: Date.now() + 25min
          ↓
       schedulerService programa timeout
```

### **2. Cuando suena la alarma**
```
setTimeout() → triggerAlarm()
              ↓
           Reproduce audio (backend)
           Emite evento SSE
           Reprograma siguiente ciclo
              ↓
           Frontend recibe SSE
           Muestra AlarmProvider popup
           Reproduce audio (loop)
```

### **3. Usuario hace clic en "Postponer"**
```
handlePostpone() → updateAlarm(id, { scheduleAt: now + snoozeMins })
                   ↓
                Backend actualiza scheduleAt
                Reprograma timeout
                   ↓
                Popup se cierra
                Audio se detiene
```

### **4. Usuario hace clic en "Detener"**
```
handleStop() → toggleAlarm(id)
               ↓
            Backend: active = false
            Cancela timeout
               ↓
            Popup se cierra
            Audio se detiene
```

---

## 📁 Archivos Modificados/Creados

### **Frontend:**
1. ✅ `src/components/alarms/AlarmProvider.tsx` - **REESCRITO**
2. ✅ `src/services/alarmService.ts` - **ACTUALIZADO** con mapeo
3. ✅ `src/styles/alarmPopup.css` - **CREADO**
4. ✅ `src/main.tsx` - Importa estilos del popup

### **Backend:** (NO modificados - ya funcionaban)
- `src/controllers/alarmController.ts` ✅
- `src/services/schedulerService.ts` ✅
- `src/routes/alarmEventsRoutes.ts` ✅
- `src/services/eventBus.ts` ✅

---

## 🎯 Cómo Probar

### **1. Configurar variables de entorno**
```bash
# Frontend
cd frontend
echo "VITE_BACKEND_URL=http://localhost:4000" > .env

# Backend
cd backend
# Verifica que .env tenga JWT_SECRET y DATABASE_URL
```

### **2. Iniciar servicios**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### **3. Crear una alarma de prueba**
1. Navega a **"Alarmas"** en el menú
2. Haz clic en **"+ Nueva Alarma"**
3. Configura:
   - Nombre: "Prueba Pomodoro"
   - Duración: 1 minuto (para prueba rápida)
   - Audio: Selecciona un archivo (o "Sin audio")
   - Imagen: Selecciona una imagen (opcional)
   - Activa: ✅ Marcado
4. Haz clic en **"Guardar"**

### **4. Esperar a que suene (1 minuto)**
- El backend mostrará en consola: `🔔 ACTIVANDO ALARMA: Prueba Pomodoro`
- El frontend mostrará: `📨 SSE Event received: { id: "..." }`
- Aparecerá el **popup** con la alarma
- El **audio sonará automáticamente** (si lo configuraste)

### **5. Probar botones**
- **Postponer**: La alarma sonará de nuevo en 1 minuto
- **Detener**: La alarma se desactiva y no volverá a sonar

---

## 🐛 Troubleshooting

### **Error: "No VITE_BACKEND_URL configurado"**
**Solución:** Crea el archivo `.env` en `frontend/` con:
```env
VITE_BACKEND_URL=http://localhost:4000
```

### **Error: "SSE error: 401"**
**Causa:** El token JWT no se está enviando correctamente.
**Solución:** Revisé el código y agregué `getToken()` en `AlarmProvider`. Debe funcionar ahora.

### **El popup no aparece cuando suena la alarma**
**Verificar:**
1. ¿El backend está corriendo? (`npm run dev` en backend)
2. ¿La consola del frontend muestra `🟢 SSE Connected`?
3. ¿La consola del backend muestra `🔔 ACTIVANDO ALARMA`?

Si no:
- Verifica que `VITE_BACKEND_URL` sea correcto
- Verifica que el usuario esté logueado (token válido)

### **El audio no suena**
**Verificar:**
1. ¿Configuraste un archivo de audio en la alarma?
2. ¿El navegador bloqueó el autoplay? (mira la consola)
3. ¿El archivo de audio existe en Cloudinary?

**Solución:** Algunos navegadores bloquean autoplay. El popup ahora reproduce en loop, pero si sigue bloqueado, el usuario puede hacer clic en "Reproducir".

### **La alarma no se repite (Pomodoro)**
**Verificar:**
1. ¿La alarma está activa (enabled/active = true)?
2. ¿El backend muestra `🔁 Pomodoro: repetirá a las ...`?

Si no, revisa los logs del backend.

---

## 📊 Estructura de Datos

### **Frontend (Alarm)**
```typescript
{
  id: string;
  name: string;
  enabled: boolean;         // ← mapea a "active" en backend
  snoozeMins: number;       // ← mapea a "durationMin" en backend
  scheduleAt: string | null;
  audioId: string | null;
  imageId: string | null;
  audio?: { id, name, url } | null;
  image?: { id, name, url } | null;
}
```

### **Backend (Alarm)**
```typescript
{
  id: string;
  name: string;
  active: boolean;          // ← mapea a "enabled" en frontend
  type: "pomodoro";
  durationMin: number;      // ← mapea a "snoozeMins" en frontend
  scheduleAt: Date | null;
  audioId: string | null;
  imageId: string | null;
  // ... relaciones
}
```

---

## ✨ Características Implementadas

### **Popup de Alarma:**
- ✅ Overlay oscuro con blur
- ✅ Modal centrado con animaciones (fadeIn, slideIn)
- ✅ Imagen personalizada o emoji ⏰
- ✅ Nombre de la alarma
- ✅ Texto informativo
- ✅ Botón **Postponer** (azul, con ícono ⏸️)
- ✅ Botón **Detener** (rojo, con ícono ⏹️)

### **Audio:**
- ✅ Reproducción automática al sonar la alarma
- ✅ Loop infinito hasta que el usuario actúe
- ✅ Se detiene al hacer clic en Postponer o Detener

### **SSE (Server-Sent Events):**
- ✅ Conexión persistente con autenticación JWT
- ✅ Reconexión automática si se pierde
- ✅ Múltiples usuarios soportados
- ✅ Solo recibe sus propias alarmas (filtrado por userId)

### **Cola de Alarmas:**
- ✅ Si suenan múltiples alarmas simultáneamente
- ✅ Se muestran una por una
- ✅ La siguiente aparece al cerrar la actual

---

## 🎉 Estado Final

**El sistema de alarmas Pomodoro está completamente funcional.**

Incluye:
- ✅ Creación/edición/eliminación de alarmas
- ✅ Activación/desactivación (toggle)
- ✅ Repetición automática (Pomodoro)
- ✅ Popup visual premium
- ✅ Audio automático en loop
- ✅ Botones Postponer y Detener funcionales
- ✅ Integración completa Frontend ↔ Backend

---

**Desarrollado por:** TodoApprRoll Team  
**Fecha:** 2 de diciembre de 2025  
**Versión:** 1.0.0 - Sistema de Alarmas Completo
