# Manual Técnico - Laika Events System

## 1. Arquitectura del Sistema

Laika Events es una plataforma de gestión de eventos construida con una arquitectura cliente-servidor desacoplada.

- **Backend**: API RESTful construida con **Python (FastAPI)**.
- **Frontend**: SPA (Single Page Application) construida con **React**.
- **Base de Datos**: Relacional **MySQL**.

### Diagrama de Comunicación
```mermaid
graph LR
    User[Cliente Web (React)] <-->|JSON/HTTPS| API[Backend API (FastAPI)]
    API <-->|SQL| DB[(MySQL Database)]
    API -->|Logs| Disk[Sistema de Archivos]
```

---

## 2. Backend (API & Base de Datos)

### Tecnologías
- **Framework**: FastAPI (Alto rendimiento, validación automática con Pydantic).
- **ORM**: SQLAlchemy (Abstracción de base de datos).
- **Driver**: PyMySQL + Cryptography.
- **Autenticación**: PyJWT (JSON Web Tokens) + Passlib (Bcrypt hashing).

### Estructura de Directorios (`backend/`)
- `main.py`: Punto de entrada. Configura middleware, conexión a BD y registra routers.
- `routers/`: Endpoints divididos por dominio funcional.
    - `auth.py`: Login, Registro, Recuperación de contraseña.
    - `events.py`: Flujo público de eventos.
    - `tickets.py`: Compra y generación de QRs.
    - `manager.py`: (Módulo Aislado) Gestión de eventos para organizadores.
    - `achievements.py`: (Módulo Aislado) Sistema de gamificación.
    - `admin_users.py`: Gestión de usuarios para administradores.
- `database/`:
    - `models.py`: Modelos ORM (no siempre presente si se usa SQL directo en algunos módulos).
    - `schema.sql`: Definición canónica del esquema de base de datos.
- `core/`: Configuraciones globales (`config.py`).
- `middleware/`: Interceptores de peticiones (Logging, Maintenance, Winter Contingency).

### Esquema de Base de Datos (Tablas Principales)
1.  **users**: Usuarios del sistema con roles (`admin`, `gestor`, `operador`, `usuario`).
2.  **events**: Eventos con estado (`draft`, `published`, `cancelled`).
3.  **tickets**: Boletos generados con código único y QR.
4.  **payments**: Registro de transacciones.
5.  **achievements / user_achievements**: Sistema de logros y recompensas.

---

## 3. Frontend (Interfaz de Usuario)

### Tecnologías
- **Framework**: React 18.
- **Build Tool**: Create React App (react-scripts).
- **Estilos**: CSS Modules y CSS estándar.
- **Estado**: React Context API (`AuthProvider`, `CartProvider`).
- **Enrutamiento**: React Router.

### Estructura de Directorios (`src/`)
- `pages/`: Vistas completas (Home, Login, Dashboard, EventDetail).
- `components/`: Componentes reutilizables (Navbar, Footer, Cards, Modals).
- `context/`: Manejo de estado global.
    - `AuthContext.jsx`: Manejo de sesión y tokens.
- `layouts/`: Plantillas de diseño (MainLayout, AdminLayout).
- `services/`: Funciones para llamar al API (Axios instances).

---

## 4. Seguridad & Roles

### Autenticación
- **JWT**: Los tokens expiran en 7 días. Se envían en el header `Authorization: Bearer <token>`.
- **Hashing**: Las contraseñas se hashean con **Bcrypt** antes de guardarse.

### Control de Acceso (RBAC)
El sistema implementa 4 roles jerárquicos:
1.  **Admin**: Acceso total al sistema, logs, usuarios y configuración global.
2.  **Gestor**: Puede crear, editar y gestionar sus propios eventos. Acceso a métricas de ventas.
3.  **Operador**: Puede validar tickets (scan QR) y ver lista de asistentes.
4.  **Usuario**: Puede ver eventos, comprar tickets, ver sus logros y perfil.

---

## 5. Módulos Aislados

El sistema utiliza un patrón de "Módulos Aislados" para funcionalidades complejas, permitiendo activarlas o desactivarlas sin romper el núcleo.

- **Manager (`routers/manager.py`)**: Lógica compleja de gestión de eventos. Si falla, no afecta la venta de boletos.
- **Achievements (`routers/achievements.py`)**: Sistema de lealtad. Auto-gestiona sus propias tablas (`achievements`, `user_achievements`).
- **Refunds (`routers/refunds.py`)**: Lógica de reembolsos y cancelaciones.

---

## 6. Protocolos de Emergencia

### Winter Contingency
Middleware de protección activo en `backend/winter_plan`. Monitorea la salud del servidor y puede degradar servicios no esenciales si detecta anomalías críticas.

### Modo Mantenimiento
Controlado por `middleware/maintenance.py`. Permite bloquear el acceso a usuarios no administradores durante actualizaciones.

---

## 7. Despliegue

### Requisitos
- Python 3.10+
- Node.js 18+
- MySQL 8.0

### Variables de Entorno (.env)
```ini
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=secreto
MYSQL_DATABASE=laika_club
SECRET_KEY=clave_secreta_jwt
```
