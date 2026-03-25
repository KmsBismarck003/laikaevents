import sqlite3
import os
from datetime import date, time, timedelta
import random

DB_PATH = "microservices/events/events.db"

def init_db():
    print(f"🔧 Inicializando base de datos SQLite en {DB_PATH}...")
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # 1. Tabla de eventos
    cur.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            event_date TEXT,
            event_time TEXT,
            location TEXT,
            venue TEXT,
            category TEXT,
            price REAL,
            total_tickets INTEGER,
            available_tickets INTEGER,
            image_url TEXT,
            status TEXT DEFAULT 'draft',
            created_by INTEGER,
            grid_position_x INTEGER DEFAULT 0,
            grid_position_y INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 2. Secciones de tickets
    cur.execute("""
        CREATE TABLE IF NOT EXISTS event_ticket_sections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            capacity INTEGER NOT NULL,
            available INTEGER NOT NULL,
            badge_text TEXT,
            color_hex TEXT,
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
        )
    """)

    # 3. Reglas del evento
    cur.execute("""
        CREATE TABLE IF NOT EXISTS event_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            icon TEXT NOT NULL,
            description TEXT NOT NULL,
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
        )
    """)

    # 4. Tabla de anuncios (Ads)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS ads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            image_url TEXT NOT NULL,
            link_url TEXT,
            position TEXT DEFAULT 'main',
            active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 5. Configuración del sistema
    cur.execute("""
        CREATE TABLE IF NOT EXISTS system_config (
            `key` TEXT PRIMARY KEY,
            `value` TEXT
        )
    """)
    
    # Configuración por defecto
    configs = [
        ("maintenanceMode", "false"),
        ("registrationEnabled", "true"),
        ("sessionTimeout", "30"),
        ("maxTicketsPerUser", "5"),
        ("news_ticker_config", '{"text": "🔥 PRÓXIMOS EVENTOS • ⚡ OFERTAS EXCLUSIVAS • ✨ CLUB LAIKA •", "backgroundColor": "#000000", "textColor": "#ffffff", "speed": 20}')
    ]
    for k, v in configs:
        cur.execute("INSERT OR IGNORE INTO system_config (`key`, `value`) VALUES (?, ?)", (k, v))

    # 4. Seeding Check
    cur.execute("SELECT COUNT(*) FROM events")
    if cur.fetchone()[0] == 0:
        print("🌱 Base de datos vacía. Insertando eventos de prueba...")
        
        events_data = [
            ("Concierto de Rock: Los Jaguares", "Una noche épica de rock nacional.", "concert", 1200, "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800"),
            ("Gran Maratón Laika 2026", "Corre por una buena causa.", "sport", 450, "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800"),
            ("El Fantasma de la Ópera", "La obra clásica de Broadway.", "theater", 950, "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800"),
            ("Festival Gastronómico", "Prueba lo mejor de la cocina local.", "festival", 250, "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"),
            ("Torneo de E-Sports", "Los mejores pro-players del país.", "other", 300, "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800"),
            ("Jazz Under the Stars", "Noche de jazz suave al aire libre.", "concert", 800, "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800")
        ]

        venues = ["Auditorio Nacional, CDMX", "Estadio Azteca, CDMX", "Teatro Degollado, GDL", "Parque Fundidora, MTY"]
        
        for name, desc, cat, price, img in events_data:
            ev_date = (date.today() + timedelta(days=random.randint(15, 60))).isoformat()
            cur.execute("""
                INSERT INTO events (name, description, event_date, event_time, location, venue, category, price, total_tickets, available_tickets, image_url, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (name, desc, ev_date, "20:00", random.choice(venues), "Recinto Demo", cat, float(price), 1000, 850, img, "published"))
        
        print(f"✅ Se han insertado {len(events_data)} eventos de prueba.")

    # 5. Seeding Ads
    cur.execute("SELECT COUNT(*) FROM ads")
    if cur.fetchone()[0] == 0:
        print("🌱 Insertando anuncios de prueba...")
        ads_data = [
            ("⚡ OFERTA RELÁMPAGO", "https://images.unsplash.com/photo-1555421689-491a97ff2040?w=1200", "/", "main"),
            ("✨ MEMBRESÍA CLUB LAIKA", "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200", "/register", "main"),
            ("Promoción Lateral 1", "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400", "/events", "side_left"),
            ("Promoción Lateral 2", "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400", "/events", "side_right")
        ]
        for title, img, link, pos in ads_data:
            cur.execute("""
                INSERT INTO ads (title, image_url, link_url, position, active)
                VALUES (?, ?, ?, ?, ?)
            """, (title, img, link, pos, 1))
        print(f"✅ Se han insertado {len(ads_data)} anuncios.")

    conn.commit()
    conn.close()
    print("✨ Inicialización de base de datos completada.")

if __name__ == "__main__":
    init_db()
