# LAIKA Club Backend - FastAPI

Backend del sistema de gestión de eventos con FastAPI, MySQL y MongoDB.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env

# Iniciar servidor
python main.py
```

## 📁 Estructura

```
backend/
├── main.py              → Aplicación principal
├── requirements.txt     → Dependencias Python
├── .env.example        → Ejemplo de variables de entorno
├── routers/            → Endpoints de la API
│   ├── auth.py         → Autenticación
│   ├── users.py        → Usuarios
│   ├── events.py       → Eventos
│   ├── tickets.py      → Boletos
│   ├── stats.py        → Estadísticas
│   ├── config.py       → Configuración
│   ├── database.py     → BD Management
│   └── monitoring.py   → Monitoreo
├── database/           → Scripts de BD
│   ├── schema.sql      → MySQL
│   └── mongodb_init.js → MongoDB
└── models/             → Modelos de datos
```

## 🗄️ Bases de Datos

### MySQL
- users, events, tickets, payments, user_achievements

### MongoDB
- system_logs, system_config, event_statistics
- user_notifications, active_sessions, system_cache

## 🔑 Endpoints Principales

```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/events/public
POST   /api/tickets/purchase
POST   /api/tickets/verify
GET    /api/stats/admin/dashboard
```

## 📖 Documentación

FastAPI genera documentación automática:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
