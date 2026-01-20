# Componentes de LAIKA Club

Biblioteca de componentes reutilizables para el sistema LAIKA Club.

## Instalación

Copia la carpeta `components` en tu directorio `src/`.

## Uso

### Button

```jsx
import { Button } from './components';

// Básico
<Button>Click me</Button>

// Con variantes
<Button variant="primary">Primario</Button>
<Button variant="secondary">Secundario</Button>
<Button variant="danger">Peligro</Button>
<Button variant="success">Éxito</Button>
<Button variant="outline">Contorno</Button>

// Con tamaños
<Button size="small">Pequeño</Button>
<Button size="medium">Mediano</Button>
<Button size="large">Grande</Button>

// Estados
<Button loading>Cargando...</Button>
<Button disabled>Deshabilitado</Button>

// Con icono
<Button icon={<span>🚀</span>}>Con icono</Button>

// Ancho completo
<Button fullWidth>Ancho completo</Button>
```

### Card

```jsx
import { Card } from './components';

<Card 
  title="Título de la tarjeta"
  subtitle="Subtítulo"
  image="/path/to/image.jpg"
  hoverable
  footer={<Button>Ver más</Button>}
>
  Contenido de la tarjeta
</Card>
```

### Input

```jsx
import { Input } from './components';

<Input
  label="Email"
  type="email"
  name="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="tu@email.com"
  required
  error={errors.email}
  helperText="Ingresa tu correo electrónico"
  icon={<span>📧</span>}
/>

// Input de contraseña con toggle
<Input
  label="Contraseña"
  type="password"
  name="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>
```

### Modal

```jsx
import { Modal, Button } from './components';

const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Título del modal"
  size="medium"
  footer={
    <>
      <Button variant="secondary" onClick={() => setIsOpen(false)}>
        Cancelar
      </Button>
      <Button variant="primary">Guardar</Button>
    </>
  }
>
  Contenido del modal
</Modal>
```

### Table

```jsx
import { Table } from './components';

const columns = [
  { 
    key: 'name', 
    header: 'Nombre',
    sortable: true
  },
  { 
    key: 'email', 
    header: 'Email' 
  },
  { 
    key: 'role', 
    header: 'Rol',
    render: (value) => <Badge variant="primary">{value}</Badge>
  }
];

const data = [
  { name: 'Juan Pérez', email: 'juan@example.com', role: 'Admin' },
  { name: 'María García', email: 'maria@example.com', role: 'Usuario' }
];

<Table
  columns={columns}
  data={data}
  sortable
  hoverable
  striped
  onRowClick={(row) => console.log(row)}
/>
```

### Alert

```jsx
import { Alert } from './components';

<Alert type="success" title="Éxito" message="Operación completada" />
<Alert type="error" title="Error" message="Algo salió mal" closable onClose={() => {}} />
<Alert type="warning" title="Advertencia" message="Ten cuidado" />
<Alert type="info" title="Información" message="Datos importantes" />
```

### Badge

```jsx
import { Badge } from './components';

<Badge>Default</Badge>
<Badge variant="primary">Primario</Badge>
<Badge variant="success">Éxito</Badge>
<Badge variant="danger">Peligro</Badge>
<Badge variant="warning">Advertencia</Badge>

// Con punto
<Badge variant="success" dot>En línea</Badge>

// Redondeado
<Badge variant="primary" rounded>Nuevo</Badge>
```

### Dropdown

```jsx
import { Dropdown, Button } from './components';

<Dropdown
  trigger={<Button>Opciones</Button>}
  align="left"
>
  <Dropdown.Item icon="👤" onClick={() => {}}>
    Mi perfil
  </Dropdown.Item>
  <Dropdown.Item icon="⚙️">
    Configuración
  </Dropdown.Item>
  <Dropdown.Divider />
  <Dropdown.Item icon="🚪" danger>
    Cerrar sesión
  </Dropdown.Item>
</Dropdown>
```

### Spinner

```jsx
import { Spinner } from './components';

<Spinner />
<Spinner size="large" color="primary" text="Cargando..." />
<Spinner fullScreen text="Procesando..." />
```

## Personalización

Puedes personalizar los estilos modificando los archivos CSS de cada componente. Todos los componentes usan variables CSS para facilitar la personalización global.

## Estructura de archivos

```
components/
├── Button.jsx
├── Button.css
├── Card.jsx
├── Card.css
├── Input.jsx
├── Input.css
├── Modal.jsx
├── Modal.css
├── Table.jsx
├── Table.css
├── Alert.jsx
├── Alert.css
├── Badge.jsx
├── Badge.css
├── Dropdown.jsx
├── Dropdown.css
├── Spinner.jsx
├── Spinner.css
└── index.js
```
