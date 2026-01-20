import bcrypt
import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

# Conectar a MySQL
connection = pymysql.connect(
    host=os.getenv('MYSQL_HOST', 'localhost'),
    user=os.getenv('MYSQL_USER', 'root'),
    password=os.getenv('MYSQL_PASSWORD', ''),
    database=os.getenv('MYSQL_DATABASE', 'laika_club')
)

try:
    cursor = connection.cursor()

    # Usuarios a actualizar
    users = [
        ('Admin123', 'admin@laikaclub.com'),
        ('Gestor123', 'gestor@laikaclub.com'),
        ('Operador123', 'operador@laikaclub.com'),
        ('Usuario123', 'usuario@laikaclub.com'),
    ]

    for password, email in users:
        # Generar hash
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        hash_str = hashed.decode('utf-8')

        # Actualizar en BD
        sql = "UPDATE users SET password_hash = %s WHERE email = %s"
        cursor.execute(sql, (hash_str, email))

        print(f"✅ Actualizado: {email} -> password: {password}")
        print(f"   Hash: {hash_str}\n")

    connection.commit()
    print("🎉 Todas las contraseñas actualizadas correctamente!")

except Exception as e:
    print(f"❌ Error: {e}")
    connection.rollback()
finally:
    cursor.close()
    connection.close()
