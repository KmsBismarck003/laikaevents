# Contexts de LAIKA Club

Contexts globales para compartir estado en toda la aplicación.

## Uso General

```jsx
// App.jsx
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, ThemeProvider, NotificationProvider, CartProvider } from './context';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <CartProvider>
              <YourApp />
            </CartProvider>
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

## AuthContext

Manejo global de autenticación.

```jsx
import { useAuth } from './context';

const { user, login, logout, hasRole } = useAuth();
```

## ThemeContext

Manejo de tema claro/oscuro.

```jsx
import { useTheme } from './context';

const { theme, toggleTheme, isDark } = useTheme();
```

## NotificationContext

Notificaciones globales tipo toast.

```jsx
import { useNotification } from './context';

const { success, error, warning } = useNotification();

success('Operación exitosa');
error('Algo salió mal');
```

## CartContext

Carrito de compras.

```jsx
import { useCart } from './context';

const { items, addItem, getTotal } = useCart();
```
