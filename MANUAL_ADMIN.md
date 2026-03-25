# 🛡️ MANUAL DEL ADMINISTRADOR — LAIKA Club

> Guía completa para el administrador del sistema. Cubre todas las funcionalidades del panel de administración, seguridad, bases de datos y recuperación ante desastres.

**Versión 2.9.9.10** — Marzo 2026

---

## Acceso al Panel

1. Ingresa con tu cuenta de administrador en **http://localhost:3000/login**
   - Email: `admin@laikaclub.com`
   - Contraseña: `admin123` *(cambiar en producción)*
2. Serás redirigido automáticamente al **Panel de Administración** (`/admin`).

---

## 🗂️ Módulos del Panel Admin

### 📊 Dashboard General (`/admin`)
Vista central con:
- Estadísticas en tiempo real (usuarios, eventos, ventas)
- Accesos directos a todos los módulos
- Indicadores de estado del sistema (RAM, CPU)
- Órdenes de tarjetas **reordenables** mediante drag-and-drop

---

### 👥 Gestión de Usuarios (`/admin/users`)
- Ver, editar y eliminar usuarios
- Cambiar el **rol** de cualquier usuario (admin / gestor / operador / usuario)
- Activar o desactivar cuentas
- Ver historial y permisos individuales

---

### 📅 Gestión de Eventos (`/admin/events`)
- Crear, editar y eliminar eventos
- Configurar zonas de asientos y precios
- Publicar / despublicar eventos
- Subir imágenes de portada

---

### 💰 Ventas y Reportes (`/admin/sales`)
- Ver todas las transacciones
- Filtrar por fecha, evento y usuario
- Exportar reportes

---

### 🎟️ Constructor de Boletos (`/admin/ticket-builder`)
Diseña visualmente el formato de los boletos del evento:
- Arrastra y suelta elementos (logo, QR, imagen, texto)
- Cambia colores de fondo y tipografía
- Vista previa en tiempo real

---

### 📢 Publicidad & Ads (`/admin/ads`)
- Crear y gestionar anuncios tipo banner
- Asignar anuncios a eventos o secciones específicas

---

### 📰 Cinta de Noticias (`/admin/ticker`)
- Gestionar los mensajes del ticker de noticias que aparece en la pantalla principal

---

### 🗄️ Base de Datos (`/admin/database`)
- Monitor de salud de MySQL en tiempo real
- Ejecutar respaldos manuales `.sql`
- Ver estadísticas de tablas e índices
- **SqlVault**: historial seguro de operaciones SQL críticas

---

### 🧩 Big Data Analytics (`/admin/big-data`)
Visualizaciones 3D interactivas de los datos analytics del clúster MongoDB Atlas:
- Clustered 3D Bar Chart por artista/evento
- 3D Voxel Pie Chart por categorías
- Búsqueda tipo Spotlight por artista o evento

---

### 📡 Monitoreo Realtime (`/admin/monitoring`)
- Gráficas en vivo de CPU, RAM y red
- Estado de los 8 microservicios
- Alertas automáticas de anomalías

---

### 🔍 Auditoría de Accesos (`/admin/auth-audit`)
- Historial completo de inicios de sesión, fallos y bloqueos
- Filtros por usuario, IP y fecha
- Detección de intentos de acceso sospechosos

---

### ⚙️ Configuración (`/admin/config`)
- Activar/Desactivar el **Modo Mantenimiento**
- Configurar nombre del sistema, logo y textos globales

---

## 🆘 Sistema de Recuperación Ante Desastres

> El sistema está blindado con dos protocolos de auto-recuperación activos **mientras el servidor está corriendo**.

### ❄️ Plan de Invierno (MySQL)

Si la base de datos MySQL se borra o corrompe, el sistema detecta el problema en el siguiente ciclo de monitoreo (cada 10 segundos) y **restaura automáticamente** desde el respaldo `.sql` más reciente en la carpeta `backups/`.

**Comandos manuales:**
```bash
python plan_invierno_mysql.py --check    # Verificar conexión
python plan_invierno_mysql.py --restore  # Restaurar manualmente
```

### 🦊 Plan LIA (MongoDB Atlas)

Si se borran colecciones en MongoDB Atlas, el sistema detecta el vacío y realiza una **restauración quirúrgica** (sin sobreescribir datos sanos) desde el respaldo `.json` más reciente.

**Comandos manuales:**
```bash
python plan_lia_mongo.py --validate [coleccion]  # Verificar integridad
python plan_lia_mongo.py --restore [coleccion]   # Restaurar
```

### Monitoreo Continuo en Terminal
El archivo `run_microservices.py` **escanea la salud de ambas bases de datos cada 10 segundos** y muestra el estado en la terminal:
```
[*] [13:02:10] Escaneando salud de Bases de Datos...
[INFO] Base de datos MySQL 'laika_club' activa con 12 tablas.
[INFO] MongoDB Atlas activa con 4 colecciones.
```

---

## 🚀 Operación del Sistema

### Arranque
```bash
run_all.bat   # Arranca todo en un clic
```
O manualmente:
```bash
python run_microservices.py  # Terminal 1
npm start                    # Terminal 2
```

### Detener el Sistema
- Presiona `Ctrl+C` en la terminal de `run_microservices.py`
- Todos los microservicios se detendrán ordenadamente

---

## 🔐 Seguridad

- Todas las rutas del panel admin requieren rol **admin** o permisos específicos
- Tokens JWT con expiración de **7 días**
- Contraseñas con **Bcrypt** → No hay contraseñas en texto plano en la BD
- Auditoría de accesos registrada automáticamente
- El archivo `.env` **nunca debe subirse a Git**

---

## 👥 Roles del Sistema

| Rol          | Acceso permitido                                                   |
| ------------ | ------------------------------------------------------------------ |
| **admin**    | Acceso total a todos los módulos                                   |
| **gestor**   | Eventos, ventas, analytics, asistentes (sin acceso a sistema)      |
| **operador** | Scanner QR, taquilla on-site, historial de entradas, incidencias  |
| **usuario**  | Compra de boletos, perfil, logros, bóveda, reembolsos             |

---

## 📞 Soporte

Para cualquier problema crítico del sistema:
1. Revisa la terminal de `run_microservices.py` para ver errores en tiempo real.
2. Corre `python plan_invierno_mysql.py --check` para verificar la BD.
3. Consulta los logs en `microservices_logs/` para detalles de cada servicio.
