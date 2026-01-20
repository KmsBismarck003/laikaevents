-- ============================================
-- LAIKA CLUB - SCRIPT DE BASE DE DATOS MYSQL
-- ============================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS laika_club
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE laika_club;

-- ============================================
-- TABLA: users
-- ============================================
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

-- ============================================
-- TABLA: events
-- ============================================
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

-- ============================================
-- TABLA: tickets
-- ============================================
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

-- ============================================
-- TABLA: payments
-- ============================================
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

-- ============================================
-- TABLA: user_achievements
-- ============================================
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

-- ============================================
-- DATOS DE PRUEBA
-- ============================================

-- Usuario Admin (password: Admin123)
INSERT INTO users (first_name, last_name, email, password_hash, role, status) VALUES
('Admin', 'Sistema', 'admin@laikaclub.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIk/xjCb8e', 'admin', 'active');

-- Usuario Gestor (password: Gestor123)
INSERT INTO users (first_name, last_name, email, password_hash, role, status) VALUES
('Juan', 'Pérez', 'gestor@laikaclub.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIk/xjCb8e', 'gestor', 'active');

-- Usuario Operador (password: Operador123)
INSERT INTO users (first_name, last_name, email, password_hash, role, status) VALUES
('María', 'González', 'operador@laikaclub.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIk/xjCb8e', 'operador', 'active');

-- Usuario normal (password: Usuario123)
INSERT INTO users (first_name, last_name, email, password_hash, role, status) VALUES
('Carlos', 'Rodríguez', 'usuario@laikaclub.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIk/xjCb8e', 'usuario', 'active');

-- Eventos de ejemplo
INSERT INTO events (name, description, category, event_date, event_time, location, venue, price, total_tickets, available_tickets, status, created_by) VALUES
('Concierto Rock en Vivo', 'Los mejores grupos de rock en un solo lugar', 'concert', '2025-03-15', '20:00:00', 'Ocoyoacac, México', 'Auditorio Municipal', 500.00, 200, 200, 'published', 2),
('Partido de Fútbol Local', 'Torneo regional de fútbol', 'sport', '2025-03-20', '18:00:00', 'Ocoyoacac, México', 'Estadio Municipal', 150.00, 500, 500, 'published', 2),
('Obra de Teatro Clásico', 'Presentación de obra clásica mexicana', 'theater', '2025-03-25', '19:00:00', 'Ocoyoacac, México', 'Teatro Principal', 300.00, 100, 100, 'published', 2),
('Festival Cultural', 'Festival de música, danza y gastronomía', 'festival', '2025-04-01', '12:00:00', 'Ocoyoacac, México', 'Plaza Central', 100.00, 1000, 1000, 'published', 2);

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT 'Base de datos creada correctamente' AS status;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_events FROM events;
