# LAIKA Club — Sistema de Gestión de Eventos

> Plataforma completa de venta y gestión de boletos para eventos en vivo. Arquitectura de microservicios con frontend React + API Gateway FastAPI.

**Versión: 2.9.9.10** — Actualizado: Marzo 2026

---

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Mapa de Microservicios y Rutas](#mapa-de-microservicios-y-rutas)
5. [Estructura de Directorios](#estructura-de-directorios)
6. [Instalación y Configuración](#instalación-y-configuración)
7. [Variables de Entorno](#variables-de-entorno)
8. [Base de Datos](#base-de-datos)
9. [Sistema de Roles y Seguridad](#sistema-de-roles-y-seguridad)
10. [Flujo de Compra](#flujo-de-compra)
11. [Constructor de Boletos](#constructor-de-boletos)
12. [Sistema de Recuperación Ante Desastres](#sistema-de-recuperación-ante-desastres)
13. [Scripts de Utilidad](#scripts-de-utilidad)
14. [Credenciales por Defecto](#credenciales-por-defecto)

---

## Visión General

LAIKA Club es una aplicación full-stack para gestión y compra de entradas a eventos. Diseñada con **microservicios desacoplados** donde cada dominio (autenticación, eventos, tickets, estadísticas, administración, logros, analítica Big Data) es un servicio FastAPI independiente, gestionado a través de un **API Gateway central**.

El frontend es una **SPA** en React 19 con diseño industrial premium (blanco/negro, tipografía uppercase, glassmorphism).

### Características Principales

- **Compra de boletos** con o sin cuenta (modo invitado)
- **Carrito de compras** accesible sin login desde cualquier página
- **Checkout independiente** — no requiere navegación al dashboard
- **Animación tipo Impresora de Boletos** con efecto láser cinemático al comprar
- **Constructor de Boletos** para personalizar el diseño visual de las entradas (Admin)
- **Sistema de roles** de 4 niveles (admin, gestor, operador, usuario)
- **Panel de administración** con monitoreo en tiempo real
- **Big Data Analytics** con visualizaciones 3D interactivas (Clustered Bar, Voxel Pie)
- **Búsqueda tipo Spotlight** para filtrar por artista o evento
- **Sistema de Logros y Recompensas** (gamificación) para usuarios
- **Modo Mantenimiento** controlado desde el panel admin
- **Monitoreo de BD en Tiempo Real** — consola visible con auto-reparación integrada
- **Plan de Invierno (MySQL) + Plan LIA (MongoDB)** — sistemas de recuperación ante desastres

---

## Stack Tecnológico

### Backend

| Componente            | Tecnología                  | Versión    |
| --------------------- | --------------------------- | ---------- |
| Framework API         | FastAPI                     | Latest     |
| Servidor ASGI         | Uvicorn                     | Latest     |
| ORM / Query           | SQLAlchemy                  | Latest     |
| Auth Tokens           | PyJWT                       | Latest     |
| Hashing               | Passlib (Bcrypt)            | Latest     |
| HTTP Client (Gateway) | HTTPX                       | Latest     |
| Base de Datos SQL     | MySQL 8.0+ (prod) / SQLite  | Latest     |
| Base de Datos NoSQL   | MongoDB Atlas               | Latest     |

### Frontend

| Componente               | Tecnología                       | Versión |
| ------------------------ | -------------------------------- | ------- |
| Framework UI             | React                            | 19.x    |
| Build Tool               | Create React App (react-scripts) | 5.0.1   |
| Enrutamiento             | React Router DOM                 | 7.x     |
| HTTP Client              | Axios                            | 1.x     |
| Íconos                   | Lucide React                     | 0.564.x |
| Generación QR            | qrcode.react                     | 4.x     |
| Escaneo QR               | html5-qrcode                     | 2.x     |
| PDF Export               | jsPDF + html2canvas              | Latest  |
| OAuth Google             | @react-oauth/google              | 0.13.x  |

---

## Arquitectura del Sistema

```
┌──────────────────────────────────────────────┐
│           CLIENTE WEB                         │
│      React SPA (Puerto 3000)                  │
└──────────────┬───────────────────────────────┘
               │ HTTP / JSON
               ▼
┌──────────────────────────────────────────────┐
│           API GATEWAY                         │
│       FastAPI (Puerto 8000)                   │
│    microservices/gateway.py                   │
└──┬──────┬──────┬──────┬──────┬───────────────┘
   │      │      │      │      │      │
  :8001  :8002  :8003  :8004  :8005  :8006  :8007
  AUTH  EVENTS TICKETS STATS  ADMIN  LOGROS BIG-DATA
```

### Servicios Activos

| Puerto | Servicio               | Archivo                                |
| ------ | ---------------------- | -------------------------------------- |
| 8000   | API Gateway            | `microservices/gateway.py`             |
| 8001   | Auth Service           | `microservices/auth/main.py`           |
| 8002   | Event Service          | `microservices/events/main.py`         |
| 8003   | Ticket Service         | `microservices/tickets/main.py`        |
| 8004   | Stats Service          | `microservices/stats/main.py`          |
| 8005   | Admin Service          | `microservices/admin/main.py`          |
| 8006   | Achievements Service   | `microservices/achievements/main.py`   |
| 8007   | Analytics BigData      | `microservices/analytics_bigdata/main.py` |

---

## Mapa de Microservicios y Rutas

| Ruta del Cliente       | Puerto Destino | Servicio       |
| ---------------------- | -------------- | -------------- |
| `/api/auth/*`          | **:8001**      | Auth Service   |
| `/api/events/*`        | **:8002**      | Event Service  |
| `/api/manager/*`       | **:8002**      | Event Service  |
| `/api/tickets/*`       | **:8003**      | Ticket Service |
| `/api/stats/*`         | **:8004**      | Stats Service  |
| `/api/monitoring/*`    | **:8004**      | Stats Service  |
| `/api/database/*`      | **:8005**      | Admin Service  |
| `/api/ads/*`           | **:8005**      | Admin Service  |
| `/api/config/*`        | **:8005**      | Admin Service  |
| `/api/admin/users/*`   | **:8001**      | Auth Service   |
| `/api/admin/*`         | **:8005**      | Admin Service  |
| `/api/achievements/*`  | **:8006**      | Achievements   |
| `/api/analytics/*`     | **:8007**      | BigData        |

---

## Estructura de Directorios

```
proyectolaika2.9.9.10/
│
├── src/                           # Frontend React
│   ├── pages/
│   │   ├── Home/                  # Página principal pública
│   │   ├── Login/ + Register/     # Autenticación
│   │   ├── EventDetail/           # Detalle de evento + Compra directa
│   │   ├── Checkout/              # Pago público (sin login requerido)
│   │   ├── user/
│   │   │   ├── UserDashboard.jsx
│   │   │   ├── UserWallet.jsx     # Bóveda de boletos
│   │   │   ├── UserHistory.jsx
│   │   │   ├── UserCart/          # Carrito + TicketPrinterOverlay (efecto láser)
│   │   │   ├── Achievements.jsx
│   │   │   └── RefundTracker.jsx
│   │   ├── admin/
│   │   │   ├── Dashboard/         # Panel central + Big Data Visualizer
│   │   │   ├── Users/             # Gestión de usuarios
│   │   │   ├── Events/            # CRUD de eventos
│   │   │   ├── Sales/             # Ventas y reportes
│   │   │   ├── Database/          # Monitor de BD + SqlVault
│   │   │   ├── Ads/               # Anuncios y publicidad
│   │   │   ├── TicketBuilder/     # Constructor visual de boletos
│   │   │   └── Monitoring/        # Monitoreo en tiempo real
│   │   ├── manager/               # Panel del gestor de eventos
│   │   └── staff/                 # Terminal de operador/staff
│   ├── components/
│   │   ├── Cart/                  # CartModal, CartContent, PaymentVoucher
│   │   ├── Navbar.jsx
│   │   ├── LaikaAgent/            # Asistente IA integrado
│   │   └── Notifications/
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── CartContext.jsx
│   │   ├── SkeletonContext.jsx
│   │   └── SystemContext.jsx
│   └── layouts/
│       ├── MainLayout.jsx
│       ├── DashboardLayout.jsx    # Sidebar con drag-and-drop de menú
│       └── UserLayout.jsx
│
├── microservices/                 # Backend (8 servicios FastAPI)
├── backups/                       # Respaldos de BD (.sql / .json)
│
├── run_all.bat                    # 🚀 Arranca todo el sistema (Frontend + Backend)
├── run_microservices.py           # Lanza todos los microservicios + monitoreo en tiempo real
├── plan_invierno_mysql.py         # ❄️ Recuperación ante desastres MySQL
└── plan_lia_mongo.py              # 🦊 Recuperación quirúrgica MongoDB Atlas
```

---

## Instalación y Configuración

### Prerrequisitos

- **Python 3.10+**
- **Node.js 18+** con npm
- **MySQL 8.0+** con Xampp (o servidor MySQL)
- **MongoDB Atlas** (URI en `.env`)

### Arranque Rápido

```bash
# Opción A — Todo en uno (RECOMENDADO)
run_all.bat
# Arranca microservicios Python + Frontend React automáticamente

# Opción B — Manual
python run_microservices.py  # Terminal 1 (Backend)
npm start                    # Terminal 2 (Frontend)
```

La aplicación estará en: **http://localhost:3000**

---

## Variables de Entorno

```ini
# Seguridad
JWT_SECRET=super_secret_laika_club_2026

# Base de datos MySQL
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=laika_club
MYSQLDUMP_PATH=C:\xampp\mysql\bin\mysqldump.exe
MYSQL_EXE_PATH=C:\xampp\mysql\bin\mysql.exe

# MongoDB Atlas
MONGO_URI="mongodb+srv://usuario:password@cluster.mongodb.net/?appName=App"
MONGO_DB="laika_analytics"

# Frontend
REACT_APP_API_URL=http://localhost:8000/api
```

> **Nunca subas `.env` a Git.** Usa `.env.example` como plantilla.

---

## Base de Datos

### MySQL — Tablas Principales

| Tabla                 | Servicio   | Descripción                           |
| --------------------- | ---------- | ------------------------------------- |
| `users`               | Auth       | Usuarios, roles y estado de cuenta    |
| `auth_logs`           | Auth       | Auditoría de accesos                  |
| `permission_requests` | Auth       | Solicitudes de permisos               |
| `events`              | Events     | Catálogo de eventos                   |
| `tickets`             | Tickets    | Entradas con código QR                |
| `payments`            | Tickets    | Registro de transacciones             |
| `achievements`        | Auth/Admin | Definición de logros                  |
| `user_achievements`   | Auth/Admin | Logros por usuario                    |

### MongoDB Atlas — Colecciones Principales

| Colección        | Descripción                              |
| ---------------- | ---------------------------------------- |
| `analytics`      | Datos de visualización Big Data          |
| `event_clicks`   | Métricas de interacción por evento       |
| `artist_sales`   | Ventas agrupadas por artista             |

---

## Sistema de Roles y Seguridad

| Rol          | Acceso                                                            |
| ------------ | ----------------------------------------------------------------- |
| **admin**    | Total: usuarios, logs, BD, eventos, backups, email, analytics     |
| **gestor**   | Crear/editar eventos, métricas, auditoría, Analytics BigData      |
| **operador** | Validar tickets QR, asistentes, incidencias                       |
| **usuario**  | Ver eventos, comprar, carrito, bóveda de boletos, logros, perfil  |
| **invitado** | Ver eventos, carrito, comprar sin cuenta (Checkout público)       |

### Autenticación

- Tokens JWT `HS256`, vida de **7 días**
- Header: `Authorization: Bearer <token>`
- Contraseñas con **Bcrypt**
- Bloqueo tras **5 intentos fallidos**

---

## Flujo de Compra

El checkout es **completamente público** — no se requiere cuenta.

```
1. Agrega boleto al carrito (btn "Agregar" en cualquier evento)
2. Abre CartModal desde el ícono en la Navbar
3. Revisa artículos → "Continuar al Pago"
4. /checkout → rellena datos de contacto
5. Confirma la compra
6. 🎟️ Animación de impresora con efecto láser (15 seg cinemáticos)
7. Boleto enviado al correo + guardado en la Bóveda de Boletos
```

---

## Constructor de Boletos

Panel exclusivo de Admin (`/admin/ticket-builder`) para diseñar visualmente el formato de los boletos:
- Arrastra y suelta elementos (logo, texto, QR, imagen del evento)
- Cambia colores de fondo y tipografías
- Vista previa en tiempo real del boleto final

---

## Sistema de Recuperación Ante Desastres

El sistema incluye dos scripts de auto-recuperación activos **en tiempo real** mientras el servidor está corriendo.

### ❄️ Plan de Invierno (MySQL)

Detecta si la base de datos `laika_club` está vacía o dañada y **automáticamente** restaura desde el respaldo `.sql` más reciente en `backups/`.

```bash
python plan_invierno_mysql.py --check    # Solo verificar conexión
python plan_invierno_mysql.py --restore  # Restaurar manualmente
```

### 🦊 Plan LIA (MongoDB Atlas)

Detecta si las colecciones de Atlas fueron borradas. Valida la integridad del respaldo `.json` antes de restaurar y realiza una **inserción quirúrgica** (no sobreescribe datos sanos).

```bash
python plan_lia_mongo.py --validate [coleccion]  # Verificar integridad
python plan_lia_mongo.py --restore [coleccion]   # Restaurar colección
```

> **Monitoreo automático**: `run_microservices.py` ejecuta un chequeo de salud cada **10 segundos** y dispara el plan correspondiente si detecta pérdida de datos — sin intervención manual.

---

## Scripts de Utilidad

| Script                   | Descripción                                       |
| ------------------------ | ------------------------------------------------- |
| `run_all.bat`            | Arranca Frontend + Backend en un solo clic        |
| `run_microservices.py`   | Lanza los 8 microservicios + monitoreo en tiempo real |
| `plan_invierno_mysql.py` | ❄️ Recuperación ante desastres MySQL              |
| `plan_lia_mongo.py`      | 🦊 Recuperación quirúrgica MongoDB Atlas          |

---

## Credenciales por Defecto

> **Solo para desarrollo.** Cambia estas contraseñas en producción.

| Rol       | Correo                     | Contraseña  |
| --------- | -------------------------- | ----------- |
| Admin     | admin@laikaclub.com        | admin123    |
| Gestor    | gestor@laikaclub.com       | gestor123   |
| Operador  | operador@laikaclub.com     | operador123 |
| Usuario   | usuario@laikaclub.com      | usuario123  |

---

## Licencia

Proyecto privado — LAIKA Club © 2026. Todos los derechos reservados.
