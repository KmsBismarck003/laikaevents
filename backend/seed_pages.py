from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import datetime
import os

# Database configuration
DATABASE_URL = "sqlite:///./laika_events.db"
# Ensure we are in the correct directory (backend) or adjust path
if not os.path.exists("laika_events.db") and os.path.exists("../laika_events.db"):
    DATABASE_URL = "sqlite:///../laika_events.db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_pages():
    db = SessionLocal()

    # SQLite compatible table creation
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug VARCHAR(255) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        section VARCHAR(50) DEFAULT 'general',
        last_updated DASHETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """

    try:
        db.execute(text(create_table_sql))
        print("Table 'pages' checked/created.")
    except Exception as e:
        print(f"Error creating table: {e}")

    pages = [
        {
            "slug": "contacto",
            "title": "Contactanos",
            "content": "<h2>Ponte en contacto con nosotros</h2><p>Estamos aqui para ayudarte. Escribenos a soporte@laika.com o llamanos al 555-1234.</p>",
            "section": "info"
        },
        {
            "slug": "privacidad",
            "title": "Politica de Privacidad",
            "content": "<h2>Politica de Privacidad</h2><p>En LAIKA Club nos tomamos muy en serio tu privacidad. Aqui explicamos como manejamos tus datos...</p>",
            "section": "legal"
        },
        {
            "slug": "terminos",
            "title": "Terminos y Condiciones",
            "content": "<h2>Terminos de Uso</h2><p>Al usar nuestra plataforma, aceptas los siguientes terminos y condiciones...</p>",
            "section": "legal"
        },
        {
            "slug": "ayuda",
            "title": "Centro de Ayuda",
            "content": "<h2>Como podemos ayudarte?</h2><p>Encuentra respuestas a las preguntas mas frecuentes sobre la compra de boletos, reembolsos y mas.</p>",
            "section": "general"
        },
        {
            "slug": "conciertos",
            "title": "Conciertos Increibles",
            "content": "<h2>Los mejores conciertos en tu ciudad</h2><p>Descubre a tus artistas favoritos y vive la musica en vivo.</p>",
            "section": "category"
        },
        {
            "slug": "deportes",
            "title": "Deportes en Vivo",
            "content": "<h2>Adrenalina Pura</h2><p>No te pierdas los partidos mas emocionantes de la temporada.</p>",
            "section": "category"
        },
        {
             "slug": "teatro",
             "title": "Obras de Teatro",
             "content": "<h2>Cultura y Entretenimiento</h2><p>Disfruta de las mejores puestas en escena.</p>",
             "section": "category"
        },
        {
             "slug": "festivales",
             "title": "Festivales de Musica",
             "content": "<h2>Fiesta sin fin</h2><p>Los festivales mas grandes y divertidos.</p>",
             "section": "category"
        },
        {
             "slug": "cultural",
             "title": "Eventos Culturales",
             "content": "<h2>Arte y Cultura</h2><p>Exposiciones, museos y eventos culturales para todos.</p>",
             "section": "category"
        }
    ]

    print("Iniciando sembrado de paginas...")

    for page in pages:
        try:
            # Check if page exists
            existing = db.execute(
                text("SELECT id FROM pages WHERE slug = :slug"),
                {"slug": page["slug"]}
            ).fetchone()

            if not existing:
                print(f"Creando pagina: {page['title']} ({page['slug']})")
                db.execute(
                    text("""
                        INSERT INTO pages (slug, title, content, section, created_at, last_updated)
                        VALUES (:slug, :title, :content, :section, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """),
                    page
                )
            else:
                print(f"Pagina '{page['slug']}' ya existe. Saltando.")
        except Exception as e:
            print(f"Error procesando {page['slug']}: {e}")

    try:
        db.commit()
        db.close()
        print("Sembrado completado exitosamente.")
    except Exception as e:
        print(f"Error commiting: {e}")

if __name__ == "__main__":
    seed_pages()
