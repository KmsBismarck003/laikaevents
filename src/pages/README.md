# Páginas de LAIKA Club

Páginas completas del sistema LAIKA Club organizadas por roles y funcionalidades.

## Estructura de Páginas

### 📝 Autenticación

#### Login.jsx
Página de inicio de sesión con validación de formularios.

**Características:**
- Validación de email y contraseña
- Opción de "Recordarme"
- Link a recuperación de contraseña
- Manejo de errores
- Redirección automática según rol

**Uso:**
```jsx
import { Login } from './pages';
<Route path="/login" element={<Login />} />
```

#### Register.jsx
Página de registro de nuevos usuarios.

**Características:**
- Formulario completo con validación
- Verificación de contraseñas coincidentes
- Validación de teléfono y email
- Aceptación de términos y condiciones
- Diseño responsive

### 🏠 Páginas Públicas

#### Home.jsx
Página principal con catálogo de eventos (accesible para visitantes y usuarios).

**Características:**
- Grid de eventos con imágenes
- Búsqueda en tiempo real
- Filtros por categoría
- Navegación a detalles del evento
- Información de precios y disponibilidad

**Roles:** Visitante, Usuario, todos los demás roles

### 👤 Usuario Normal

#### UserProfile.jsx
Perfil de usuario con historial y logros.

**Características:**
- Edición de información personal
- Historial de compras
- Sistema de logros/achievements
- Estadísticas personales
- Tabs para organizar información

**Rol:** Usuario

### 🛡️ Administrador del Sistema

#### AdminDashboard.jsx
Panel de control completo del sistema.

**Características:**
- Estadísticas globales (usuarios, eventos, ventas)
- Gestión de usuarios (crear, editar, eliminar, asignar roles)
- Configuración del sistema desde la interfaz
- Gestión de base de datos (respaldos, restauración)
- Monitoreo del sistema (CPU, memoria, logs)
- Control de permisos y configuraciones

**Actividades principales:**
- ✅ Gestión de usuarios y roles
- ✅ Configuración del sistema (modo mantenimiento, registro, sesiones)
- ✅ Respaldos de base de datos (completo, incremental, selectivo)
- ✅ Monitoreo de rendimiento
- ✅ Control total sin tocar código

**Rol:** Administrador

### 🎭 Gestor de Eventos / Marketing

#### EventManagerDashboard.jsx
Panel para gestores de eventos.

**Características:**
- Crear y editar eventos propios
- Configurar detalles (nombre, fecha, ubicación, precios)
- Subir imágenes y material promocional
- Publicar/despublicar eventos
- Ver estadísticas de ventas
- Solo acceso a eventos asignados

**Actividades principales:**
- ✅ Crear eventos con toda la información
- ✅ Editar eventos existentes
- ✅ Configurar precios y disponibilidad
- ✅ Ver estadísticas de sus eventos
- ❌ No puede modificar configuraciones globales

**Rol:** Gestor de Eventos

### 🎫 Operador / Staff

#### StaffDashboard.jsx
Interface para verificación de boletos en el evento.

**Características:**
- Escaneo de códigos QR (simulado)
- Verificación manual de códigos
- Validación de autenticidad
- Registro de entrada
- Historial de verificaciones
- Estadísticas del día
- Detección de boletos duplicados

**Actividades principales:**
- ✅ Verificar autenticidad de boletos
- ✅ Registrar canje de boletos
- ✅ Consultar información de eventos asignados
- ✅ Ver historial de escaneos
- ❌ Sin acceso a configuraciones

**Rol:** Operador/Staff

## Integración con API

Todas las páginas están preparadas para integrarse con FastAPI. Busca los comentarios `// TODO: Integrar con API` en el código.

### Ejemplo de integración:

```jsx
// Antes (simulación)
await new Promise(resolve => setTimeout(resolve, 1000));

// Después (con API)
import { loginUser } from '../services/api';
const response = await loginUser(formData);
```

## Rutas Sugeridas

```jsx
// routes.js o App.jsx
import {
  Login,
  Register,
  Home,
  AdminDashboard,
  EventManagerDashboard,
  StaffDashboard,
  UserProfile
} from './pages';

const routes = [
  { path: '/login', element: <Login />, public: true },
  { path: '/register', element: <Register />, public: true },
  { path: '/', element: <Home />, public: true },
  { path: '/profile', element: <UserProfile />, roles: ['usuario'] },
  { path: '/admin', element: <AdminDashboard />, roles: ['admin'] },
  { path: '/events/manage', element: <EventManagerDashboard />, roles: ['gestor'] },
  { path: '/staff', element: <StaffDashboard />, roles: ['operador'] }
];
```

## Componentes Utilizados

Todas las páginas utilizan los componentes reutilizables de `/components`:
- Button
- Card
- Input
- Modal
- Table
- Alert
- Badge
- Dropdown
- Spinner

## Roles y Permisos

| Página | Visitante | Usuario | Operador | Gestor | Admin |
|--------|-----------|---------|----------|--------|-------|
| Home | ✅ | ✅ | ✅ | ✅ | ✅ |
| Login/Register | ✅ | ✅ | ✅ | ✅ | ✅ |
| UserProfile | ❌ | ✅ | ✅ | ✅ | ✅ |
| StaffDashboard | ❌ | ❌ | ✅ | ❌ | ✅ |
| EventManagerDashboard | ❌ | ❌ | ❌ | ✅ | ✅ |
| AdminDashboard | ❌ | ❌ | ❌ | ❌ | ✅ |

## Próximos Pasos

1. Crear el sistema de rutas protegidas
2. Implementar el contexto de autenticación (AuthContext)
3. Conectar con la API de FastAPI
4. Crear la página de detalles de evento
5. Implementar el carrito de compras
6. Agregar el proceso de checkout

## Estructura de archivos

```
pages/
├── Login.jsx
├── Login.css
├── Register.jsx
├── Register.css
├── Home.jsx
├── Home.css
├── AdminDashboard.jsx
├── AdminDashboard.css
├── EventManagerDashboard.jsx
├── EventManagerDashboard.css
├── StaffDashboard.jsx
├── StaffDashboard.css
├── UserProfile.jsx
├── UserProfile.css
└── index.js
```
