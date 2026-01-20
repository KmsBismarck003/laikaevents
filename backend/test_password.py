import bcrypt

# Hash de la base de datos
stored_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIk/xjCb8e'

# Contraseñas a probar
passwords_to_test = ['Admin123', 'admin123', 'Gestor123', 'Usuario123']

print("Probando contraseñas contra el hash almacenado:")
print(f"Hash: {stored_hash}\n")

for pwd in passwords_to_test:
    try:
        result = bcrypt.checkpw(pwd.encode('utf-8'), stored_hash.encode('utf-8'))
        print(f"'{pwd}' -> {'✅ CORRECTO' if result else '❌ INCORRECTO'}")
    except Exception as e:
        print(f"'{pwd}' -> ❌ ERROR: {e}")
