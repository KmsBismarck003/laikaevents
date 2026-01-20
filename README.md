# LAIKA Club - Sistema de Gestión de Eventos

Sistema completo de gestión de eventos con roles de usuario (Admin, Gestor, Operador, Usuario).

## 🚀 Características

- ✅ Sistema de autenticación y roles
- ✅ Gestión completa de eventos
- ✅ Compra y verificación de boletos
- ✅ Panel de administración
- ✅ Dashboard para gestores de eventos
- ✅ Sistema de verificación para operadores
- ✅ Carrito de compras
- ✅ Notificaciones en tiempo real
- ✅ Tema claro/oscuro
- ✅ Responsive design

## 📋 Requisitos Previos

- Node.js 16+ y npm
- Backend FastAPI corriendo en `http://localhost:8000`
- MySQL y MongoDB configurados en el backend

## 🛠️ Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd laika-club

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar en modo desarrollo
npm start
```

## 📁 Estructura del Proyecto

```
src/
├── components/        → Componentes reutilizables (9)
├── pages/            → Páginas completas (7)
├── layouts/          → Layouts (Main, Auth, Dashboard)
├── hooks/            → Hooks personalizados (10)
├── context/          → Contexts globales (4)
├── services/         → Conexión con API
├── utils/            → Funciones auxiliares (60+)
├── styles/           → Estilos globales
├── App.jsx           → Componente principal
├── index.js          → Punto de entrada
└── routes.js         → Definición de rutas
```

## 🎭 Roles de Usuario

### Admin
- Control total del sistema
- Gestión de usuarios y roles
- Configuración del sistema
- Respaldos de base de datos
- Monitoreo y logs

### Gestor de Eventos
- Crear y editar eventos
- Configurar precios y boletos
- Ver estadísticas de ventas
- Publicar/despublicar eventos

### Operador/Staff
- Verificar boletos con QR
- Registrar entradas
- Ver historial de verificaciones
- Estadísticas del día

### Usuario
- Buscar y comprar boletos
- Ver historial de compras
- Gestionar perfil
- Sistema de logros

## 🌐 Variables de Entorno

```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_NAME=LAIKA Club
REACT_APP_ENV=development
```

## 📦 Scripts Disponibles

```bash
npm start          # Desarrollo
npm run build      # Build para producción
npm test           # Ejecutar tests
npm run lint       # Linter
```

## 🔗 Endpoints API

Ver `src/services/api.js` para la lista completa de endpoints.

### Principales:
- `POST /api/auth/login` - Login
- `GET /api/events/public` - Eventos públicos
- `POST /api/tickets/purchase` - Comprar boletos
- `POST /api/tickets/verify` - Verificar boleto (Operador)
- `GET /api/stats/admin/dashboard` - Dashboard Admin

## 🗄️ Bases de Datos

### MySQL (Datos relacionales)
- users
- events
- tickets
- payments
- user_achievements

### MongoDB (Logs y configuración)
- system_logs
- system_config
- event_statistics
- user_notifications
- active_sessions

## 🎨 Componentes Disponibles

- Button, Card, Input, Modal
- Table, Alert, Badge
- Dropdown, Spinner

## 🪝 Hooks Personalizados

- useAuth, useFetch, useForm
- useLocalStorage, useDebounce
- useModal, useToggle
- usePagination, useClickOutside
- useMediaQuery

## 🛣️ Rutas Principales

```
/                    → Home (público)
/login               → Login
/register            → Registro
/profile             → Perfil de usuario
/admin               → Dashboard Admin
/events/manage       → Gestión de Eventos (Gestor)
/staff               → Verificación (Operador)
```

## 🔐 Protección de Rutas

Las rutas están protegidas mediante el componente `ProtectedRoute`:

```jsx
<ProtectedRoute allowedRoles={['admin']}>
  <AdminDashboard />
</ProtectedRoute>
```

## 🎯 Próximos Pasos

1. Configurar backend FastAPI
2. Conectar con MySQL y MongoDB
3. Implementar endpoints en FastAPI
4. Reemplazar datos mock por API real
5. Agregar pruebas unitarias
6. Deploy a producción

## 👥 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 📧 Contacto

- Email: contacto@laikaclub.com
- Teléfono: 55 1234 5678
