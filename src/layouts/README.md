# Layouts de LAIKA Club

Sistema de layouts reutilizables para organizar la estructura de la aplicación.

## Layouts Disponibles

### 🏠 MainLayout

Layout principal para páginas públicas y del usuario normal.

**Características:**
- Navbar responsive con navegación adaptativa según rol
- Menú de usuario con dropdown
- Sistema de notificaciones
- Footer completo con links
- Navegación móvil con menú hamburguesa
- Detección automática de página activa

**Navegación según rol:**
- **Visitante**: Eventos, Nosotros + Botones Login/Register
- **Usuario**: Eventos, Mi Perfil + Menú de usuario
- **Gestor**: Eventos, Mi Perfil, Mis Eventos + Menú de usuario
- **Operador**: Eventos, Mi Perfil, Verificación + Menú de usuario
- **Admin**: Eventos, Mi Perfil, Administración + Menú de usuario

**Uso:**
```jsx
import { MainLayout } from './layouts';

// En tu archivo de rutas
<Route element={<MainLayout user={currentUser} />}>
  <Route path="/" element={<Home />} />
  <Route path="/profile" element={<UserProfile />} />
  <Route path="/my-tickets" element={<MyTickets />} />
</Route>
```

**Props:**
- `user`: Objeto del usuario actual (null para visitantes)
  ```js
  {
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@example.com',
    role: 'usuario' | 'gestor' | 'operador' | 'admin'
  }
  ```

---

### 🔐 AuthLayout

Layout minimalista para páginas de autenticación.

**Características:**
- Header simple con logo
- Background con gradiente
- Footer con links legales
- Diseño centrado y limpio
- Sin navegación compleja

**Uso:**
```jsx
import { AuthLayout } from './layouts';

// En tu archivo de rutas
<Route element={<AuthLayout />}>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
</Route>
```

**Props:**
Ninguna (es un layout estático)

---

### 📊 DashboardLayout

Layout para paneles administrativos con sidebar.

**Características:**
- Sidebar colapsable con navegación adaptativa por rol
- Top bar con búsqueda y notificaciones
- Badge de rol del usuario
- Navegación específica para cada tipo de usuario
- Responsive (sidebar se oculta en móvil)
- Detección de página activa

**Navegación según rol:**

**Admin:**
- Dashboard, Usuarios, Eventos, Configuración, Base de Datos, Monitoreo, Logs

**Gestor:**
- Mis Eventos, Crear Evento, Estadísticas, Ventas

**Operador:**
- Verificación, Historial, Eventos Asignados

**Uso:**
```jsx
import { DashboardLayout } from './layouts';

// En tu archivo de rutas
<Route element={<DashboardLayout user={currentUser} />}>
  {/* Rutas de Admin */}
  <Route path="/admin" element={<AdminDashboard />} />
  <Route path="/admin/users" element={<UserManagement />} />
  
  {/* Rutas de Gestor */}
  <Route path="/events/manage" element={<EventManagerDashboard />} />
  
  {/* Rutas de Operador */}
  <Route path="/staff" element={<StaffDashboard />} />
</Route>
```

**Props:**
- `user`: Objeto del usuario actual (requerido)
  ```js
  {
    firstName: 'Juan',
    lastName: 'Pérez',
    role: 'admin' | 'gestor' | 'operador'
  }
  ```

---

## Estructura de Rutas Completa

Ejemplo de cómo organizar todas las rutas con los layouts:

```jsx
// App.jsx o routes.js
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import { MainLayout, AuthLayout, DashboardLayout } from './layouts';
import {
  Home,
  Login,
  Register,
  UserProfile,
  AdminDashboard,
  EventManagerDashboard,
  StaffDashboard
} from './pages';

function App() {
  const currentUser = {
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@example.com',
    role: 'usuario'
  };

  return (
    <Router>
      <Routes>
        {/* Rutas de Autenticación */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Rutas Públicas y de Usuario */}
        <Route element={<MainLayout user={currentUser} />}>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/my-tickets" element={<MyTickets />} />
        </Route>

        {/* Rutas de Dashboard (Admin, Gestor, Operador) */}
        <Route element={<DashboardLayout user={currentUser} />}>
          {/* Admin */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          
          {/* Gestor */}
          <Route path="/events/manage" element={<EventManagerDashboard />} />
          
          {/* Operador */}
          <Route path="/staff" element={<StaffDashboard />} />
        </Route>

        {/* Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
```

---

## Protección de Rutas

Para proteger rutas según roles, crea un componente ProtectedRoute:

```jsx
// ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ user, allowedRoles, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Uso
<Route 
  path="/admin" 
  element={
    <ProtectedRoute user={currentUser} allowedRoles={['admin']}>
      <AdminDashboard />
    </ProtectedRoute>
  } 
/>
```

---

## Características Responsive

Todos los layouts son completamente responsive:

### MainLayout
- **Desktop**: Navbar horizontal completa
- **Mobile**: Menú hamburguesa con navegación vertical

### AuthLayout
- **Desktop**: Formularios centrados con ancho máximo
- **Mobile**: Formularios a ancho completo con padding reducido

### DashboardLayout
- **Desktop**: Sidebar fijo de 260px
- **Tablet**: Sidebar colapsable a 80px
- **Mobile**: Sidebar oculto por defecto (overlay al abrir)

---

## Personalización

### Colores del tema
Los layouts usan las variables CSS del gradiente principal:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Modificar altura del navbar
```css
/* En MainLayout.css o DashboardLayout.css */
.navbar, .dashboard-header {
  height: 70px; /* Cambiar aquí */
}
```

### Cambiar ancho del sidebar
```css
/* En DashboardLayout.css */
.sidebar {
  width: 260px; /* Cambiar aquí */
}

.sidebar.closed {
  width: 80px; /* Cambiar aquí */
}
```

---

## Integración con Context

Los layouts están diseñados para trabajar con AuthContext:

```jsx
import { useAuth } from './context/AuthContext';
import { MainLayout } from './layouts';

function App() {
  const { user } = useAuth();

  return (
    <Route element={<MainLayout user={user} />}>
      {/* rutas */}
    </Route>
  );
}
```

---

## Componentes Utilizados

Los layouts utilizan componentes de `/components`:
- Button
- Dropdown
- Badge

---

## Próximos Pasos

1. Implementar AuthContext para manejo de usuario
2. Crear componente ProtectedRoute
3. Agregar animaciones de transición entre páginas
4. Implementar sistema de notificaciones real
5. Agregar búsqueda global en DashboardLayout

---

## Estructura de archivos

```
layouts/
├── MainLayout.jsx
├── MainLayout.css
├── AuthLayout.jsx
├── AuthLayout.css
├── DashboardLayout.jsx
├── DashboardLayout.css
└── index.js
```
