# Services - Conexión con FastAPI

Sistema centralizado de conexión con el backend FastAPI que maneja MySQL y MongoDB.

## 🔗 Arquitectura

```
React Frontend → api.js → FastAPI Backend → MySQL + MongoDB
```

**IMPORTANTE:** El frontend NUNCA se conecta directamente a las bases de datos.
Todas las conexiones pasan por FastAPI.

## 📁 Estructura

```
services/
├── api.js              → Puente principal con FastAPI
├── database.config.js  → Referencia de esquemas MySQL/MongoDB
├── index.js            → Exportaciones
└── README.md           → Este archivo
```

## 🚀 Configuración

### 1. Variables de Entorno (.env)

```bash
# API Backend
REACT_APP_API_URL=http://localhost:8000/api

# Las conexiones a BD se configuran en FastAPI
```

### 2. Uso Básico

```jsx
import api from './services';

// Login
const result = await api.auth.login({ email, password });

// Obtener eventos
const events = await api.event.getPublic({ category: 'concert' });

// Crear evento
const newEvent = await api.event.create({
  name: 'Mi Evento',
  date: '2025-03-01'
});
```

## 📚 API Completa

### Autenticación
```js
api.auth.login(credentials)
api.auth.register(userData)
api.auth.logout()
api.auth.verifyToken()
api.auth.refreshToken()
api.auth.forgotPassword(email)
api.auth.resetPassword(token, newPassword)
```

### Usuarios
```js
api.user.getProfile()
api.user.updateProfile(updates)
api.user.changePassword(current, new)
api.user.getAll(params)          // Admin
api.user.create(userData)         // Admin
api.user.update(userId, updates)  // Admin
api.user.delete(userId)           // Admin
api.user.assignRole(userId, role) // Admin
```

### Eventos
```js
api.event.getPublic(params)
api.event.getById(eventId)
api.event.create(eventData)       // Gestor
api.event.update(eventId, updates) // Gestor
api.event.delete(eventId)         // Gestor
api.event.publish(eventId)        // Gestor
api.event.unpublish(eventId)      // Gestor
api.event.getMyEvents()           // Gestor
api.event.uploadImage(eventId, file)
api.event.search(query)
```

### Boletos
```js
api.ticket.purchase(purchaseData)
api.ticket.getMyTickets()
api.ticket.verify(ticketCode)     // Operador
api.ticket.redeem(ticketCode)     // Operador
api.ticket.getByCode(ticketCode)
api.ticket.cancel(ticketId)
```

### Estadísticas (MongoDB)
```js
api.stats.getAdminDashboard()     // Admin
api.stats.getManagerStats()       // Gestor
api.stats.getStaffStats()         // Operador
api.stats.getEventStats(eventId)
api.stats.getSalesReport(params)
```

### Configuración (MongoDB)
```js
api.config.getConfig()            // Admin
api.config.updateConfig(config)   // Admin
api.config.getParameter(key)      // Admin
api.config.updateParameter(key, value) // Admin
```

### Base de Datos (Admin)
```js
api.database.createBackup(type, options)
api.database.listBackups()
api.database.restore(backupId)
api.database.getStats()
api.database.clearCache()
api.database.optimize()
```

### Monitoreo (MongoDB)
```js
api.monitoring.getSystemStatus()
api.monitoring.getLogs(params)
api.monitoring.getMetrics()
api.monitoring.getActiveUsers()
```

### Notificaciones (MongoDB)
```js
api.notification.getMyNotifications()
api.notification.markAsRead(notificationId)
api.notification.markAllAsRead()
api.notification.delete(notificationId)
```

### Pagos
```js
api.payment.createIntent(paymentData)
api.payment.confirm(paymentId)
api.payment.getHistory()
api.payment.refund(paymentId)     // Admin
```

## 🗄️ Bases de Datos

### MySQL (Datos Relacionales)
- ✅ users
- ✅ events
- ✅ tickets
- ✅ payments
- ✅ user_achievements

### MongoDB (Logs y Configuración)
- ✅ system_logs
- ✅ system_config
- ✅ event_statistics
- ✅ user_notifications
- ✅ active_sessions
- ✅ system_cache

## 🔧 Integración con FastAPI

### Backend (Python/FastAPI)

```python
# main.py
from fastapi import FastAPI
from sqlalchemy import create_engine
from pymongo import MongoClient

# MySQL
mysql_engine = create_engine(
    "mysql+pymysql://user:pass@localhost/laika_club"
)

# MongoDB
mongo_client = MongoClient("mongodb://localhost:27017")
mongo_db = mongo_client["laika_club_logs"]

app = FastAPI()

@app.post("/api/auth/login")
async def login(credentials: LoginSchema):
    # Consultar MySQL
    user = mysql_session.query(User).filter_by(
        email=credentials.email
    ).first()
    
    # Guardar log en MongoDB
    mongo_db.logs.insert_one({
        "action": "login",
        "user_id": user.id,
        "timestamp": datetime.now()
    })
    
    return {"token": create_token(user)}
```

## 📝 Ejemplos de Uso

### Login Completo
```jsx
import api from './services';
import { useAuth } from './context';

function LoginPage() {
  const { login } = useAuth();
  
  const handleLogin = async () => {
    try {
      const result = await api.auth.login({
        email: 'user@example.com',
        password: 'password123'
      });
      
      if (result.token) {
        login(result.user);
      }
    } catch (error) {
      console.error('Login error:', error.message);
    }
  };
}
```

### Buscar Eventos
```jsx
import api from './services';

function EventSearch() {
  const [events, setEvents] = useState([]);
  
  useEffect(() => {
    const loadEvents = async () => {
      const data = await api.event.getPublic({
        category: 'concert',
        limit: 10
      });
      setEvents(data);
    };
    
    loadEvents();
  }, []);
}
```

### Verificar Boleto (Operador)
```jsx
import api from './services';

function TicketScanner() {
  const handleScan = async (ticketCode) => {
    try {
      const result = await api.ticket.verify(ticketCode);
      
      if (result.valid) {
        await api.ticket.redeem(ticketCode);
        alert('Boleto válido - Entrada permitida');
      } else {
        alert('Boleto inválido');
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  };
}
```

### Dashboard Admin con Estadísticas
```jsx
import api from './services';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    const loadStats = async () => {
      const data = await api.stats.getAdminDashboard();
      setStats(data);
    };
    
    loadStats();
  }, []);
}
```

## ⚠️ Manejo de Errores

```jsx
try {
  const result = await api.event.create(eventData);
} catch (error) {
  console.error('Error:', error.status);    // 400, 401, 500, etc.
  console.error('Message:', error.message); // Mensaje del servidor
  console.error('Data:', error.data);       // Datos adicionales
}
```

## 🔐 Autenticación

El token JWT se guarda automáticamente en localStorage y se incluye en todas las peticiones:

```js
// Automático en cada petición
headers: {
  'Authorization': 'Bearer <token>'
}
```

## 📊 Esquemas de Base de Datos

Ver `database.config.js` para:
- Estructura completa de tablas MySQL
- Estructura de colecciones MongoDB
- Ejemplos de queries
- Configuración de conexiones

## 🚀 Próximos Pasos

1. Configurar FastAPI backend
2. Crear tablas en MySQL
3. Crear colecciones en MongoDB
4. Implementar endpoints en FastAPI
5. Conectar frontend con backend real
6. Eliminar datos mock de api.js
