# Utils - Funciones Auxiliares

Colección de funciones reutilizables para toda la aplicación.

## 📁 Estructura

```
utils/
├── date.js         → Formateo de fechas y tiempos
├── validators.js   → Validación de datos
├── format.js       → Formateo de números y moneda
├── helpers.js      → Funciones auxiliares generales
├── constants.js    → Constantes globales
└── index.js        → Exportaciones
```

## 🗓️ date.js - Fechas

```js
import { formatDate, formatDateTime, formatRelativeTime } from './utils';

formatDate('2025-03-15')                  // "15 de marzo de 2025"
formatDateShort('2025-03-15')             // "15/03/2025"
formatTime('2025-03-15T20:00:00')         // "20:00"
formatDateTime('2025-03-15T20:00:00')     // "15 de marzo de 2025, 20:00"
formatRelativeTime('2025-01-01')          // "Hace 17 días"
isPastDate('2024-12-31')                  // true
isToday('2025-01-18')                     // true
daysUntil('2025-03-01')                   // 42
```

## ✅ validators.js - Validación

```js
import { isValidEmail, isValidPassword, isValidPhone } from './utils';

isValidEmail('user@example.com')          // true
isValidPhone('5512345678')                // true
isValidPassword('Password123')            // true
isValidAge('1995-05-15')                  // true (>18)
isFutureDate('2025-12-31')                // true
isValidTicketCode('TKT-ABC123XYZ')        // true
isValidCreditCard('4532015112830366')     // true (Luhn)
isValidName('Juan Pérez')                 // true
isRequired(value)                         // true/false
minLength(value, 8)                       // true/false
```

## 💰 format.js - Formateo

```js
import { formatCurrency, formatNumber, formatPercentage } from './utils';

formatCurrency(1500.50)                   // "$1,500.50"
formatNumber(1000000)                     // "1,000,000"
formatPercentage(75.5)                    // "75.50%"
formatCompactNumber(1500000)              // "1.5M"
formatFileSize(1536000)                   // "1.46 MB"
formatPhoneNumber('5512345678')           // "55 1234 5678"
formatCardNumber('4532015112830366')      // "**** **** **** 0366"
calculatePercentage(75, 100)              // 75
roundTo(3.14159, 2)                       // 3.14
```

## 🛠️ helpers.js - Auxiliares

```js
import { 
  capitalize, 
  truncate, 
  slugify, 
  generateTicketCode,
  copyToClipboard,
  groupBy,
  sortBy,
  downloadFile
} from './utils';

capitalize('hola mundo')                  // "Hola mundo"
capitalizeWords('hola mundo')             // "Hola Mundo"
truncate('Texto largo...', 10)            // "Texto larg..."
slugify('Hola Mundo 123')                 // "hola-mundo-123"
generateId()                              // "lk2j3h4g5"
generateCode(9)                           // "AB3XY9KLM"
generateTicketCode()                      // "TKT-AB3XY9KLM"
await copyToClipboard('texto')            // true
removeDuplicates([1,2,2,3])               // [1,2,3]
groupBy(users, 'role')                    // { admin: [...], usuario: [...] }
sortBy(events, 'date', 'desc')            // [...eventos ordenados]
searchInArray(events, 'concierto', ['name', 'description'])
downloadFile(blob, 'archivo.pdf')
getInitials('Juan Pérez')                 // "JP"
parseQueryString('?page=1&limit=10')      // { page: '1', limit: '10' }
buildQueryString({ page: 1 })             // "?page=1"
debounce(func, 300)                       // función debounced
```

## 🎯 constants.js - Constantes

```js
import { 
  USER_ROLES, 
  EVENT_CATEGORIES, 
  ERROR_MESSAGES,
  REGEX_PATTERNS 
} from './utils';

// Roles
USER_ROLES.ADMIN                          // 'admin'
USER_ROLES.GESTOR                         // 'gestor'

// Categorías
EVENT_CATEGORIES.CONCERT                  // 'concert'
EVENT_CATEGORY_LABELS.concert             // 'Concierto'

// Estados
EVENT_STATUS.PUBLISHED                    // 'published'
TICKET_STATUS.ACTIVE                      // 'active'
PAYMENT_STATUS.COMPLETED                  // 'completed'

// Mensajes
ERROR_MESSAGES.REQUIRED                   // 'Este campo es requerido'
SUCCESS_MESSAGES.LOGIN                    // 'Inicio de sesión exitoso'

// Patterns
REGEX_PATTERNS.EMAIL                      // /^[^\s@]+@[^\s@]+\.[^\s@]+$/
REGEX_PATTERNS.PHONE                      // /^\d{10}$/

// Config
TIME_CONFIG.SESSION_TIMEOUT               // 30 (minutos)
PAGINATION.DEFAULT_LIMIT                  // 10

// Rutas
PUBLIC_ROUTES                             // ['/', '/login', ...]
ROLE_ROUTES.admin                         // ['/admin', ...]

// Archivos
ALLOWED_FILE_TYPES.IMAGES                 // ['image/jpeg', ...]
MAX_FILE_SIZES.IMAGE                      // 5MB en bytes
```

## 💡 Ejemplos de Uso

### Validación de Formulario
```js
import { isValidEmail, isValidPassword, ERROR_MESSAGES } from './utils';

const validate = (values) => {
  const errors = {};
  
  if (!isValidEmail(values.email)) {
    errors.email = ERROR_MESSAGES.INVALID_EMAIL;
  }
  
  if (!isValidPassword(values.password)) {
    errors.password = ERROR_MESSAGES.INVALID_PASSWORD;
  }
  
  return errors;
};
```

### Formateo en Componentes
```js
import { formatCurrency, formatDate, formatRelativeTime } from './utils';

function EventCard({ event }) {
  return (
    <div>
      <h3>{event.name}</h3>
      <p>{formatDate(event.date)}</p>
      <p>{formatCurrency(event.price)}</p>
      <small>{formatRelativeTime(event.created_at)}</small>
    </div>
  );
}
```

### Búsqueda y Filtrado
```js
import { searchInArray, sortBy } from './utils';

function EventList({ events, searchTerm }) {
  const filtered = searchInArray(events, searchTerm, ['name', 'location']);
  const sorted = sortBy(filtered, 'date', 'asc');
  
  return sorted.map(event => <EventCard event={event} />);
}
```

### Generación de Códigos
```js
import { generateTicketCode } from './utils';

async function createTicket(eventId, userId) {
  const ticketCode = generateTicketCode();
  // TKT-ABC123XYZ
  
  await api.ticket.create({
    code: ticketCode,
    eventId,
    userId
  });
}
```

### Uso de Constantes
```js
import { USER_ROLES, EVENT_STATUS } from './utils';

function canEditEvent(user, event) {
  return user.role === USER_ROLES.ADMIN || 
         (user.role === USER_ROLES.GESTOR && event.status === EVENT_STATUS.DRAFT);
}
```

## 📚 Todas las Funciones

### date.js (8 funciones)
- formatDate, formatDateShort, formatTime, formatDateTime
- formatRelativeTime, isPastDate, isToday, daysUntil

### validators.js (15 funciones)
- isValidEmail, isValidPhone, isValidPassword, isValidURL
- isPositiveNumber, isValidAge, isFutureDate, isValidTicketCode
- isValidCreditCard, isValidCVV, isValidName, isRequired
- minLength, maxLength

### format.js (10 funciones)
- formatCurrency, formatNumber, formatPercentage, formatCompactNumber
- roundTo, formatFileSize, calculatePercentage, formatPhoneNumber
- formatCardNumber, randomInRange

### helpers.js (25+ funciones)
- capitalize, capitalizeWords, truncate, slugify
- copyToClipboard, generateId, generateCode, generateTicketCode
- sleep, removeDuplicates, groupBy, sortBy, searchInArray
- downloadFile, getFileExtension, isImageFile, getInitials
- parseQueryString, buildQueryString, randomColor, debounce
- Y más...

### constants.js (20+ constantes)
- USER_ROLES, EVENT_CATEGORIES, TICKET_STATUS, PAYMENT_METHODS
- ERROR_MESSAGES, SUCCESS_MESSAGES, REGEX_PATTERNS
- PAGINATION, TIME_CONFIG, BREAKPOINTS, THEME_COLORS
- PUBLIC_ROUTES, ROLE_ROUTES, ALLOWED_FILE_TYPES
- Y más...
