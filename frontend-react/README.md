# TodoApp/BaldurDev — Gestor de tareas con alarmas multimedia

![Tests](https://github.com/KPBaldur/TodoApprRoll/actions/workflows/test.yml/badge.svg)
[![codecov](https://codecov.io/gh/KPBaldur/TodoApprRoll/branch/main/graph/badge.svg)](https://codecov.io/gh/KPBaldur/TodoApprRoll)

TodoApp es una app de productividad con:
- ✅ **Tareas** con prioridades, subtareas, estados y “resolución” (texto + imágenes).
- 🔔 **Alarmas multimedia** (audio en loop + imagen/GIF/video en popup global).
- 🖼️ **Biblioteca de multimedia** (subida/URL, renombrado, filtros).
- 🧭 **Historial** de eventos.
- 🎨 **Configuración de tema** (claro/oscuro/custom, gradientes, fondo).

> **Demo rápida**  
> ![Alarm Popup](docs/screens/alarm-popup.gif)  
> ![Tasks](docs/screens/tasks.png)  
> ![Media](docs/screens/media.png)  
> ![Settings](docs/screens/settings.png)

---

## Tabla de contenidos
- [Arquitectura](#arquitectura)
- [Tecnologías](#tecnologías)
- [Ejecución local](#ejecución-local)
- [Scripts](#scripts)
- [Variables de entorno](#variables-de-entorno)
- [API Backend](#api-backend)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Pruebas y cobertura](#pruebas-y-cobertura)
- [Roadmap](#roadmap)
- [Licencia](#licencia)

---

## Arquitectura

**Frontend**
- React + Vite + TypeScript
- Context API para:
  - `AlarmContext`: motor de alarmas (intervalo, snooze persistente, popup)
  - `ThemeContext`: tema y CSS variables
  - `useTasks`: estado y operaciones de tareas
- Servicios REST (fetch) desacoplados de UI
- Estilos con CSS variables y gradientes (responsive)

**Backend**
- Node.js + Express
- Persistencia simple en **JSON** (`database/json/*.json`)
- Subida de archivos a `/uploads` (estático)
- Capas: `controllers/`, `routes/`, `services/storage`, `middleware`

---

## Tecnologías

**Frontend**
- React 18, Vite, TypeScript
- React Testing Library, Vitest, jsdom
- CSS variables

**Backend**
- Express, Multer (upload), uuid
- Persistencia en archivos JSON

---

## Ejecución local

### 1) Backend
```bash
cd backend
npm install
npm run dev      # nodemon (http://localhost:3000)
# o
npm start
2) Frontend
bash
Copiar código
cd frontend-react
npm install
npm run dev      # Vite en http://localhost:5173
El frontend ya viene con proxy a http://localhost:3000 para /api y /uploads.

Scripts
Frontend

bash
Copiar código
npm run dev        # servidor de desarrollo
npm run build      # build de producción
npm run preview    # previsualizar build
npm run test       # vitest en watch
npm run coverage   # cobertura (html/json/text)
Backend

bash
Copiar código
npm start          # producción
npm run dev        # desarrollo (nodemon)
Variables de entorno
Frontend

VITE_API_URL (opcional): base para construir URLs absolutas de /uploads.
Por defecto usa http://localhost:3000.

Backend

(opcional) PORT (default: 3000)

API Backend
Alarmas
Método	Ruta	Body / Query	Descripción
GET	/api/alarms	—	Lista alarmas
POST	/api/alarms	{ name, enabled, mediaId?, imageId?, intervalMinutes? }	Crea alarma
PUT	/api/alarms/:id	campos parciales: name, enabled, mediaId, imageId, intervalMinutes, snoozedUntil	Actualiza
DELETE	/api/alarms/:id	—	Elimina
PATCH	/api/alarms/:id/snooze	{ snoozedUntil: ISOString }	Actualiza snooze

Multimedia
Método	Ruta	Body / Query	Descripción
GET	/api/media	—	Lista media
POST	/api/media	{ path, name, type? }	Registra URL
POST	/api/media/upload	multipart/form-data (file)	Sube archivo
PUT	/api/media/:id	{ name }	Renombra
DELETE	/api/media/:id	—	Elimina

Tareas
Método	Ruta	Body / Query	Descripción
GET	/api/tasks	q?, status?, priority?	Lista con filtros
POST	/api/tasks	{ title, description?, priority, remember? }	Crea
PUT	/api/tasks/:id	Campos parciales; subtasks, resolution, resolutionImages	Actualiza
DELETE	/api/tasks/:id	—	Elimina
POST	/api/tasks/:id/archive	—	Archivar
POST	/api/tasks/:id/unarchive	—	Restaurar

Config
Método	Ruta	Body	Descripción
GET	/api/config	—	Lee config
PUT	/api/config	AppConfig	Guarda config

Estructura del repositorio
bash
Copiar código
backend/
  src/
    controllers/   # alarms/media/tasks/config
    routes/
    services/      # storage.js (JSON I/O)
    middleware/    # upload, error
    app.js, server.js
  database/json/   # alarms.json, media.json, tasks.json, config.json
  uploads/         # archivos subidos

frontend-react/
  src/
    context/       # AlarmContext, ThemeContext
    engine/        # alarmMath (lógica pura)
    hooks/         # useTasks
    pages/         # AlarmPage, MediaPage, TasksPage, HistoryPage, SettingsPage
    components/    # SubtaskModal, Header, Sidebar, etc.
    services/      # api, alarmService, mediaService, taskService, configService
    styles/        # global.css, theme.css, App.css
  vite.config.ts
Pruebas y cobertura
Runner: Vitest

UI: React Testing Library

Entorno: jsdom

Timers: vi.useFakeTimers({ shouldAdvanceTime: true })

Cobertura: npm run coverage (HTML en coverage/index.html)

Pruebas clave

engine/alarmMath.test.ts — cálculo del próximo disparo (snooze y modularidad).

context/__tests__/AlarmContext.test.tsx — flujo: snooze 5m → cancelar → recalcular.

(Sugeridas) AlarmPage.edit.test.tsx, filtros de TasksPage, filtros de MediaPage.

Roadmap
Alarmas por franja horaria/días de semana

One-shot vs recurrente

Silenciar por X tiempo

Vistas guardadas/labels en tareas

Más pruebas de integración y e2e

CI con Codecov (coverage badge)

Licencia
MIT © 2025 Kevin P.