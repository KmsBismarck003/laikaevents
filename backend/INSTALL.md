# 📘 MANUAL DE INSTALACIÓN - LAIKA CLUB

Sistema completo de gestión de eventos con React + FastAPI + MySQL + MongoDB

---

## 📋 REQUISITOS DEL SISTEMA

### Software Requerido

- **Node.js** 16 o superior
- **Python** 3.9 o superior
- **MySQL** 8.0 o superior
- **MongoDB** 6.0 o superior
- **Git** (opcional)

### Sistema Operativo

- Windows 10/11
- macOS 10.15+
- Linux (Ubuntu 20.04+)

---

## 🚀 INSTALACIÓN PASO A PASO

### PASO 1: Instalar MySQL

#### Windows:
1. Descargar MySQL Installer desde: https://dev.mysql.com/downloads/installer/
2. Ejecutar instalador y seleccionar "Developer Default"
3. Configurar contraseña de root
4. Iniciar MySQL Server

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

#### macOS:
```bash
brew install mysql
brew services start mysql
```

**Verificar instalación:**
```bash
mysql --version
```

---

### PASO 2: Instalar MongoDB

#### Windows:
1. Descargar desde: https://www.mongodb.com/try/download/community
2. Ejecutar instalador
3. Iniciar MongoDB como servicio

#### Linux (Ubuntu):
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### macOS:
```bash
brew tap mongodb/brew
brew install mongodb-community@6.0
brew services start mongodb-community@6.0
```

**Verificar instalación:**
```bash
mongod --version
```

---

### PASO 3: Configurar Bases de Datos

#### 3.1 Crear Base de Datos MySQL

```bash
# Conectar a MySQL
mysql -u root -p

# Crear usuario y base de datos
CREATE DATABASE laika_club CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'laika_user'@'localhost' IDENTIFIED BY 'tu_password_seguro';
GRANT ALL PRIVILEGES ON laika_club.* TO 'laika_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Ejecutar script de creación de tablas
mysql -u laika_user -p laika_club < database/schema.sql
```

#### 3.2 Inicializar MongoDB

```bash
# Conectar a MongoDB
mongosh

# Ejecutar script de inicialización
load('database/mongodb_init.js')

# Salir
exit
```

---

### PASO 4: Instalar Node.js y npm

#### Windows/macOS:
Descargar desde: https://nodejs.org/

#### Linux:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

**Verificar instalación:**
```bash
node --version
npm --version
```

---

### PASO 5: Instalar Python y pip

#### Windows:
Descargar desde: https://www.python.org/downloads/

#### Linux:
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv
```

#### macOS:
```bash
brew install python3
```

**Verificar instalación:**
```bash
python3 --version
pip3 --version
```

---

### PASO 6: Configurar Backend (FastAPI)

```bash
# Ir a la carpeta del backend
cd backend

# Crear entorno virtual
python3 -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env

# IMPORTANTE: Editar .env con tus credenciales
nano .env  # o usar cualquier editor de texto

# Configurar:
# - MYSQL_USER=laika_user
# - MYSQL_PASSWORD=tu_password
# - JWT_SECRET=generar_clave_segura_aqui
```

**Generar JWT_SECRET seguro:**
```python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

### PASO 7: Configurar Frontend (React)

```bash
# Ir a la carpeta del frontend
cd ../frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Editar .env
nano .env

# Configurar:
# REACT_APP_API_URL=http://localhost:8000/api
```

---

### PASO 8: Iniciar el Sistema

#### Terminal 1 - Backend:
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python main.py

# O con uvicorn:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**✅ Backend corriendo en:** http://localhost:8000

#### Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

**✅ Frontend corriendo en:** http://localhost:3000

---

## 👤 USUARIOS DE PRUEBA

Una vez instalado, puedes usar estos usuarios:

| Rol | Email | Password |
|-----|-------|----------|
| **Admin** | admin@laikaclub.com | Admin123 |
| **Gestor** | gestor@laikaclub.com | Gestor123 |
| **Operador** | operador@laikaclub.com | Operador123 |
| **Usuario** | usuario@laikaclub.com | Usuario123 |

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Error: "Can't connect to MySQL server"
```bash
# Verificar que MySQL esté corriendo
sudo systemctl status mysql  # Linux
# o
mysql.server status  # macOS

# Iniciar MySQL si está detenido
sudo systemctl start mysql  # Linux
mysql.server start  # macOS
```

### Error: "Connection refused" MongoDB
```bash
# Verificar que MongoDB esté corriendo
sudo systemctl status mongod  # Linux

# Iniciar MongoDB
sudo systemctl start mongod
```

### Error: "Module not found" en Python
```bash
# Asegurarse de estar en el entorno virtual
source venv/bin/activate

# Reinstalar dependencias
pip install -r requirements.txt
```

### Error: "Port 3000 already in use"
```bash
# Cambiar puerto del frontend
PORT=3001 npm start
```

### Error: "Port 8000 already in use"
```bash
# Encontrar proceso usando el puerto
lsof -i :8000  # Linux/macOS
netstat -ano | findstr :8000  # Windows

# Matar proceso
kill -9 <PID>  # Linux/macOS
taskkill /PID <PID> /F  # Windows
```

---

## 📊 VERIFICAR INSTALACIÓN

### 1. Verificar Backend
Abrir en navegador: http://localhost:8000/health

Respuesta esperada:
```json
{
  "status": "healthy",
  "databases": {
    "mysql": "connected",
    "mongodb": "connected"
  }
}
```

### 2. Verificar Frontend
Abrir en navegador: http://localhost:3000

Deberías ver la página de inicio de LAIKA Club.

### 3. Verificar MySQL
```bash
mysql -u laika_user -p
USE laika_club;
SHOW TABLES;
SELECT COUNT(*) FROM users;
```

### 4. Verificar MongoDB
```bash
mongosh
use laika_club_logs
show collections
db.system_config.find()
```

---

## 🔒 SEGURIDAD

### Producción

**IMPORTANTE:** Antes de desplegar a producción:

1. **Cambiar JWT_SECRET** a una clave segura única
2. **Usar contraseñas fuertes** para MySQL y MongoDB
3. **Habilitar HTTPS** en el frontend y backend
4. **Configurar firewall** para cerrar puertos innecesarios
5. **Actualizar CORS** para permitir solo tu dominio
6. **Crear respaldos** automáticos de bases de datos
7. **Configurar logs** y monitoreo

---

## 📁 ESTRUCTURA FINAL DEL PROYECTO

```
laika-club/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   ├── routers/
│   ├── database/
│   │   ├── schema.sql
│   │   └── mongodb_init.js
│   └── venv/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── .env
│
└── README.md
```

---

## 📚 PRÓXIMOS PASOS

1. ✅ Instalar sistema
2. ✅ Verificar que todo funcione
3. 📖 Revisar documentación de cada módulo
4. 🎨 Personalizar diseño según necesidades
5. 🔧 Configurar características adicionales
6. 🚀 Desplegar a producción

---

## 🆘 SOPORTE

Si tienes problemas durante la instalación:

1. Verifica que todos los requisitos estén instalados
2. Revisa los logs de errores
3. Consulta la sección de "Solución de Problemas"
4. Verifica las versiones de software

---

## ✨ ¡LISTO!

Tu sistema LAIKA Club está instalado y funcionando.

**Accede al sistema:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Documentación API: http://localhost:8000/docs

**¡Disfruta!** 🎉
