/**
 * Configuración de conexión a bases de datos
 *
 * IMPORTANTE: Este archivo es solo de REFERENCIA para el backend (FastAPI)
 * El frontend NO se conecta directamente a MySQL ni MongoDB.
 * Todas las conexiones se hacen a través de la API de FastAPI.
 *
 * FastAPI manejará:
 * - MySQL: Datos relacionales (usuarios, eventos, boletos, transacciones)
 * - MongoDB: Logs, configuraciones, estadísticas, cachés
 */

// ============================================
// CONFIGURACIÓN MYSQL (Backend FastAPI)
// ============================================
export const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'laika_club',

  // Pool de conexiones
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000
  }
}

// ============================================
// CONFIGURACIÓN MONGODB (Backend FastAPI)
// ============================================
export const MONGODB_CONFIG = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  database: process.env.MONGODB_DATABASE || 'laika_club_logs',

  // Opciones de conexión
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    minPoolSize: 2
  },

  // Colecciones
  collections: {
    logs: 'system_logs',
    config: 'system_config',
    stats: 'event_statistics',
    notifications: 'user_notifications',
    sessions: 'active_sessions',
    cache: 'system_cache'
  }
}

// ============================================
// ESTRUCTURA DE TABLAS MYSQL
// ============================================
export const MYSQL_SCHEMA = {
  // Tabla: users
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(20),
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin', 'gestor', 'operador', 'usuario') DEFAULT 'usuario',
      status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
      avatar_url VARCHAR(500),
      birth_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      last_login TIMESTAMP NULL,
      INDEX idx_email (email),
      INDEX idx_role (role),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // Tabla: events
  events: `
    CREATE TABLE IF NOT EXISTS events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category ENUM('concert', 'sport', 'theater', 'festival', 'other') NOT NULL,
      event_date DATE NOT NULL,
      event_time TIME NOT NULL,
      location VARCHAR(255) NOT NULL,
      venue VARCHAR(255),
      price DECIMAL(10, 2) NOT NULL,
      total_tickets INT NOT NULL,
      available_tickets INT NOT NULL,
      image_url VARCHAR(500),
      status ENUM('draft', 'published', 'cancelled', 'completed') DEFAULT 'draft',
      created_by INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_category (category),
      INDEX idx_status (status),
      INDEX idx_event_date (event_date),
      INDEX idx_created_by (created_by)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // Tabla: tickets
  tickets: `
    CREATE TABLE IF NOT EXISTS tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_code VARCHAR(50) UNIQUE NOT NULL,
      event_id INT NOT NULL,
      user_id INT NOT NULL,
      ticket_type ENUM('general', 'vip', 'early_bird') DEFAULT 'general',
      price DECIMAL(10, 2) NOT NULL,
      purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status ENUM('active', 'used', 'cancelled', 'refunded') DEFAULT 'active',
      qr_code_url VARCHAR(500),
      used_at TIMESTAMP NULL,
      used_by INT NULL,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_ticket_code (ticket_code),
      INDEX idx_event_id (event_id),
      INDEX idx_user_id (user_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // Tabla: payments
  payments: `
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      event_id INT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      payment_method ENUM('card', 'transfer', 'cash', 'other') NOT NULL,
      transaction_id VARCHAR(255) UNIQUE,
      status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
      payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      refunded_at TIMESTAMP NULL,
      metadata JSON,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_event_id (event_id),
      INDEX idx_status (status),
      INDEX idx_transaction_id (transaction_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // Tabla: user_achievements
  achievements: `
    CREATE TABLE IF NOT EXISTS user_achievements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      achievement_type VARCHAR(50) NOT NULL,
      achievement_name VARCHAR(100) NOT NULL,
      description TEXT,
      unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      UNIQUE KEY unique_user_achievement (user_id, achievement_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `
}

// ============================================
// ESTRUCTURA DE COLECCIONES MONGODB
// ============================================
export const MONGODB_SCHEMA = {
  // Colección: system_logs
  logs: {
    level: 'string', // 'info', 'warning', 'error', 'critical'
    message: 'string',
    user_id: 'number',
    action: 'string',
    ip_address: 'string',
    user_agent: 'string',
    metadata: 'object',
    timestamp: 'date',
    created_at: 'date'
  },

  // Colección: system_config
  config: {
    key: 'string', // Identificador único
    value: 'mixed', // Cualquier tipo de valor
    type: 'string', // 'boolean', 'number', 'string', 'object'
    description: 'string',
    category: 'string', // 'general', 'security', 'notifications', etc.
    updated_by: 'number',
    updated_at: 'date',
    created_at: 'date'
  },

  // Colección: event_statistics
  stats: {
    event_id: 'number',
    date: 'date',
    tickets_sold: 'number',
    revenue: 'number',
    unique_buyers: 'number',
    avg_purchase_value: 'number',
    peak_purchase_time: 'string',
    conversion_rate: 'number',
    refund_count: 'number',
    metadata: 'object',
    created_at: 'date'
  },

  // Colección: user_notifications
  notifications: {
    user_id: 'number',
    type: 'string', // 'info', 'success', 'warning', 'error'
    title: 'string',
    message: 'string',
    link: 'string',
    is_read: 'boolean',
    read_at: 'date',
    created_at: 'date',
    expires_at: 'date'
  },

  // Colección: active_sessions
  sessions: {
    user_id: 'number',
    session_token: 'string',
    ip_address: 'string',
    user_agent: 'string',
    device_info: 'object',
    last_activity: 'date',
    created_at: 'date',
    expires_at: 'date'
  },

  // Colección: system_cache
  cache: {
    key: 'string',
    value: 'mixed',
    ttl: 'number', // Time to live en segundos
    created_at: 'date',
    expires_at: 'date'
  }
}

// ============================================
// EJEMPLO DE USO EN FASTAPI (Python)
// ============================================
export const FASTAPI_EXAMPLE = `
# main.py (FastAPI Backend)

from fastapi import FastAPI
from sqlalchemy import create_engine
from pymongo import MongoClient
import os

# MySQL Connection
MYSQL_URL = f"mysql+pymysql://{os.getenv('MYSQL_USER')}:{os.getenv('MYSQL_PASSWORD')}@{os.getenv('MYSQL_HOST')}/{os.getenv('MYSQL_DATABASE')}"
mysql_engine = create_engine(MYSQL_URL)

# MongoDB Connection
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
mongo_client = MongoClient(MONGODB_URI)
mongo_db = mongo_client['laika_club_logs']

app = FastAPI()

# Ejemplo de endpoint que usa ambas bases de datos
@app.get("/api/events/public")
async def get_public_events():
    # Obtener eventos de MySQL
    with mysql_engine.connect() as conn:
        result = conn.execute("SELECT * FROM events WHERE status = 'published'")
        events = result.fetchall()

    # Registrar acceso en MongoDB
    mongo_db.logs.insert_one({
        "level": "info",
        "action": "get_public_events",
        "timestamp": datetime.now()
    })

    return events

@app.post("/api/tickets/verify")
async def verify_ticket(ticket_code: str):
    # Verificar en MySQL
    with mysql_engine.connect() as conn:
        result = conn.execute(
            "SELECT * FROM tickets WHERE ticket_code = %s",
            (ticket_code,)
        )
        ticket = result.fetchone()

    # Guardar log en MongoDB
    mongo_db.logs.insert_one({
        "level": "info",
        "action": "verify_ticket",
        "ticket_code": ticket_code,
        "valid": ticket is not None,
        "timestamp": datetime.now()
    })

    return {"valid": ticket is not None, "ticket": ticket}
`

export default {
  MYSQL_CONFIG,
  MONGODB_CONFIG,
  MYSQL_SCHEMA,
  MONGODB_SCHEMA
}
