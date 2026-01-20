# Hooks Personalizados de LAIKA Club

Colección de hooks reutilizables para simplificar el desarrollo en React.

## Hooks Disponibles

### 🔐 useAuth

Hook para manejo completo de autenticación.

**Funcionalidades:**
- Login y registro de usuarios
- Verificación de token automática
- Actualización de datos del usuario
- Logout
- Verificación de roles
- Persistencia en localStorage

**Uso:**
```jsx
import { useAuth } from './hooks';

function LoginPage() {
  const { user, loading, login, logout, hasRole, isAuthenticated } = useAuth();

  const handleLogin = async () => {
    const result = await login({ email, password });
    if (result.success) {
      console.log('Login exitoso', result.user);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      {isAuthenticated() ? (
        <>
          <p>Bienvenido {user.firstName}</p>
          {hasRole('admin') && <AdminPanel />}
          <button onClick={logout}>Cerrar Sesión</button>
        </>
      ) : (
        <button onClick={handleLogin}>Iniciar Sesión</button>
      )}
    </div>
  );
}
```

**API:**
```js
const {
  user,              // Objeto del usuario actual o null
  loading,           // Estado de carga
  error,             // Error de autenticación
  login,             // async (credentials) => { success, user, error }
  register,          // async (userData) => { success, user, error }
  logout,            // async () => void
  updateUser,        // async (updates) => { success, user, error }
  checkAuth,         // async () => void
  hasRole,           // (roles) => boolean
  isAuthenticated    // () => boolean
} = useAuth();
```

---

### 🌐 useFetch

Hook para peticiones HTTP con manejo automático de estados.

**Funcionalidades:**
- GET, POST, PUT, PATCH, DELETE
- Manejo automático de loading y errores
- Headers con autenticación automática
- Ejecución manual o inmediata
- Reset de estados

**Uso:**
```jsx
import { useFetch } from './hooks';

function EventsList() {
  const { data, loading, error, get } = useFetch();

  useEffect(() => {
    get('/api/events');
  }, []);

  if (loading) return <div>Cargando eventos...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {data?.map(event => (
        <div key={event.id}>{event.name}</div>
      ))}
    </div>
  );
}

// POST con datos
function CreateEvent() {
  const { loading, post } = useFetch();

  const handleCreate = async () => {
    const result = await post('/api/events', {
      name: 'Nuevo Evento',
      date: '2025-02-15'
    });
    
    if (result.success) {
      console.log('Evento creado', result.data);
    }
  };

  return <button onClick={handleCreate}>Crear</button>;
}
```

**API:**
```js
const {
  data,           // Datos de la respuesta
  loading,        // Estado de carga
  error,          // Error si existe
  execute,        // async (url, options) => { success, data, error }
  get,            // async (url, options) => result
  post,           // async (url, body, options) => result
  put,            // async (url, body, options) => result
  patch,          // async (url, body, options) => result
  delete,         // async (url, options) => result
  reset           // () => void
} = useFetch(url, options);
```

---

### 📝 useForm

Hook para manejo de formularios con validación.

**Funcionalidades:**
- Manejo de valores y cambios
- Validación personalizada
- Control de campos tocados
- Estados de envío
- Helpers para campos

**Uso:**
```jsx
import { useForm } from './hooks';

function LoginForm() {
  const validate = (values) => {
    const errors = {};
    if (!values.email) {
      errors.email = 'Email requerido';
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = 'Email inválido';
    }
    if (!values.password) {
      errors.password = 'Contraseña requerida';
    }
    return errors;
  };

  const onSubmit = async (values) => {
    console.log('Enviar:', values);
    // Hacer login
  };

  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    getFieldProps
  } = useForm({ email: '', password: '' }, onSubmit, validate);

  return (
    <form onSubmit={handleSubmit}>
      <input {...getFieldProps('email')} type="email" />
      {errors.email && <span>{errors.email}</span>}
      
      <input {...getFieldProps('password')} type="password" />
      {errors.password && <span>{errors.password}</span>}
      
      <button type="submit">Enviar</button>
    </form>
  );
}
```

**API:**
```js
const {
  values,           // Valores del formulario
  errors,           // Errores de validación
  touched,          // Campos tocados
  isSubmitting,     // Estado de envío
  handleChange,     // (e) => void
  handleBlur,       // (e) => void
  handleSubmit,     // (e) => void
  setFieldValue,    // (name, value) => void
  setFieldError,    // (name, error) => void
  resetForm,        // () => void
  isValid,          // () => boolean
  getFieldProps     // (name) => { name, value, onChange, onBlur, error }
} = useForm(initialValues, onSubmit, validate);
```

---

### 💾 useLocalStorage

Hook para persistencia de datos en localStorage.

**Uso:**
```jsx
import { useLocalStorage } from './hooks';

function ThemeToggle() {
  const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light');

  return (
    <div>
      <p>Tema actual: {theme}</p>
      <button onClick={() => setTheme('dark')}>Oscuro</button>
      <button onClick={() => setTheme('light')}>Claro</button>
      <button onClick={removeTheme}>Reset</button>
    </div>
  );
}
```

---

### ⏱️ useDebounce

Hook para retrasar actualizaciones (búsquedas, validaciones).

**Uso:**
```jsx
import { useDebounce } from './hooks';

function SearchEvents() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearch) {
      // Buscar eventos
      console.log('Buscando:', debouncedSearch);
    }
  }, [debouncedSearch]);

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Buscar eventos..."
    />
  );
}
```

---

### 🪟 useModal

Hook para manejo de modales.

**Uso:**
```jsx
import { useModal } from './hooks';
import { Modal, Button } from './components';

function EventDetails() {
  const modal = useModal();

  return (
    <>
      <Button onClick={modal.open}>Ver Detalles</Button>
      
      <Modal isOpen={modal.isOpen} onClose={modal.close}>
        <h2>Detalles del Evento</h2>
        <Button onClick={modal.close}>Cerrar</Button>
      </Modal>
    </>
  );
}
```

---

### 🔀 useToggle

Hook para estados booleanos.

**Uso:**
```jsx
import { useToggle } from './hooks';

function Sidebar() {
  const [isOpen, toggle, open, close] = useToggle(false);

  return (
    <div>
      <button onClick={toggle}>Toggle</button>
      <button onClick={open}>Abrir</button>
      <button onClick={close}>Cerrar</button>
      {isOpen && <div>Sidebar Content</div>}
    </div>
  );
}
```

---

### 📄 usePagination

Hook para paginación de datos.

**Uso:**
```jsx
import { usePagination } from './hooks';

function EventsList({ events }) {
  const {
    paginatedData,
    currentPage,
    totalPages,
    goToNext,
    goToPrevious,
    goToPage
  } = usePagination(events, 10);

  return (
    <div>
      {paginatedData.map(event => (
        <div key={event.id}>{event.name}</div>
      ))}
      
      <button onClick={goToPrevious} disabled={currentPage === 1}>
        Anterior
      </button>
      <span>Página {currentPage} de {totalPages}</span>
      <button onClick={goToNext} disabled={currentPage === totalPages}>
        Siguiente
      </button>
    </div>
  );
}
```

---

### 🖱️ useClickOutside

Hook para detectar clics fuera de un elemento.

**Uso:**
```jsx
import { useRef } from 'react';
import { useClickOutside } from './hooks';

function Dropdown() {
  const dropdownRef = useRef();
  const [isOpen, setIsOpen] = useState(false);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  return (
    <div ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)}>Menu</button>
      {isOpen && <div>Menu Content</div>}
    </div>
  );
}
```

---

### 📱 useMediaQuery

Hook para responsive design.

**Uso:**
```jsx
import { useMediaQuery, useIsMobile, useIsTablet } from './hooks';

function ResponsiveComponent() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isLargeScreen = useMediaQuery('(min-width: 1200px)');

  return (
    <div>
      {isMobile && <MobileView />}
      {isTablet && <TabletView />}
      {isLargeScreen && <DesktopView />}
    </div>
  );
}
```

---

## Ejemplos Combinados

### Formulario de Login Completo
```jsx
import { useAuth, useForm } from './hooks';
import { Input, Button, Alert } from './components';

function LoginPage() {
  const { login } = useAuth();
  const [alert, setAlert] = useState(null);

  const validate = (values) => {
    const errors = {};
    if (!values.email) errors.email = 'Email requerido';
    if (!values.password) errors.password = 'Contraseña requerida';
    return errors;
  };

  const onSubmit = async (values) => {
    const result = await login(values);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setAlert({ type: 'error', message: result.error });
    }
  };

  const form = useForm({ email: '', password: '' }, onSubmit, validate);

  return (
    <form onSubmit={form.handleSubmit}>
      {alert && <Alert type={alert.type} message={alert.message} />}
      <Input {...form.getFieldProps('email')} />
      <Input {...form.getFieldProps('password')} type="password" />
      <Button type="submit" loading={form.isSubmitting}>
        Iniciar Sesión
      </Button>
    </form>
  );
}
```

### Búsqueda con Debounce y Fetch
```jsx
import { useState, useEffect } from 'react';
import { useFetch, useDebounce } from './hooks';

function SearchEvents() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const { data, loading, get } = useFetch();

  useEffect(() => {
    if (debouncedSearch) {
      get(`/api/events/search?q=${debouncedSearch}`);
    }
  }, [debouncedSearch]);

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {loading && <p>Buscando...</p>}
      {data?.map(event => <div key={event.id}>{event.name}</div>)}
    </div>
  );
}
```

---

## Integración con API

Los hooks están preparados para integrarse con tu API de FastAPI. Busca los comentarios `// TODO: Integrar con API` en:
- `useAuth.js`
- `useFetch.js`

---

## Estructura de archivos

```
hooks/
├── useAuth.js
├── useFetch.js
├── useForm.js
├── useLocalStorage.js
├── useDebounce.js
├── useModal.js
├── useToggle.js
├── usePagination.js
├── useClickOutside.js
├── useMediaQuery.js
└── index.js
```
