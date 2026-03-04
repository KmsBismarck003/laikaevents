# PROYECTO LAIKA (Laika Events)

**Sistema Integral de Gestión de Eventos y Venta de Boletos**

---

## 📖 Descripción del Proyecto

**Laika Events** es una plataforma moderna y completa para la administración, venta y validación de boletos para eventos masivos. Diseñada para escalar, permite a administradores y gestores controlar todo el ciclo de vida de un evento, desde su creación hasta el análisis post-evento.

### Características Clave
- **Venta de Boletos**: Sistema robusto de compra con generación de QRs únicos.
- **Gestión de Roles**: Paneles diferenciados para Admin, Gestor, Staff y Usuarios.
- **Logros y Gamificación**: Sistema de recompensas `Achievements` integrado para fidelizar usuarios.
- **Validación en Puerta**: Módulo para staff con escaneo de boletos en tiempo real.
- **Seguridad**: Autenticación JWT, Hashing Bcrypt y Middleware de protección "Winter Contingency".

---

## 🚀 Instalación Rápida

### Prerrequisitos
- **Python 3.10+**
- **Node.js 18+**
- **MySQL Server 8.0+**

### 1. Configuración del Backend

1.  Navega a la carpeta `backend/`:
    ```bash
    cd backend
    ```
2.  Crea y activa el entorno virtual:
    ```bash
    python -m venv venv
    # Windows:
    .\venv\Scripts\activate
    # Linux/Mac:
    source venv/bin/activate
    ```
3.  Instala las dependencias:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configura las variables de entorno:
    Crea un archivo `.env` en `backend/` con:
    ```ini
    MYSQL_HOST=localhost
    MYSQL_USER=tu_usuario
    MYSQL_PASSWORD=tu_contraseña
    MYSQL_DATABASE=laika_club
    SECRET_KEY=tu_clave_secreta_super_segura
    ```
5.  Inicia el servidor (automáticamente creará las tablas):
    ```bash
    uvicorn main:app --reload
    ```
    El backend correrá en `http://localhost:8000`.

### 2. Configuración del Frontend

1.  Navega a la raíz del proyecto (donde está `package.json`):
    ```bash
    cd ..
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  Inicia la aplicación:
    ```bash
    npm start
    ```
    El frontend abrirá en `http://localhost:3000`.

---

## 📚 Documentación Técnica

Para información detallada sobre la arquitectura, base de datos, API y módulos internos, consulta el **Manual Técnico**:

👉 **[Leer MANUAL TÉCNICO COMPLETO (TECHNICAL_MANUAL.md)](./TECHNICAL_MANUAL.md)**

---

## 📂 Estructura del Proyecto

```
proyectolaika/
├── backend/                # API FastAPI y Lógica de Negocio
│   ├── routers/            # Endpoints (Auth, Events, Manager, etc.)
│   ├── database/           # Modelos y Esquemas SQL
│   ├── middleware/         # Logs, Seguridad y Mantenimiento
│   └── main.py             # Punto de entrada
├── src/                    # Frontend React
│   ├── pages/              # Vistas (Home, Dashboard, Login)
│   ├── components/         # Componentes UI Reutilizables
│   ├── context/            # Estado Global (Auth, Cart)
│   └── App.js              # Enrutamiento Principal
├── public/                 # Assets Estáticos
└── TECHNICAL_MANUAL.md     # Documentación Técnica Detallada
```

---

## 🛠 Estado del Proyecto

- **Versión Actual**: 2.0.0 (Winter Update)
- **Estado**: En Desarrollo Activo / Mantenimiento
- **Última Actualización**: Febrero 2026

---

**Desarrollado por el equipo de Laika Club**
