"""
Script de diagnóstico para identificar problemas de escritura en MySQL
"""

import pymysql
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Configuración desde .env
MYSQL_URL = f"mysql+pymysql://{os.getenv('MYSQL_USER', 'root')}:{os.getenv('MYSQL_PASSWORD', '')}@{os.getenv('MYSQL_HOST', 'localhost')}:3306/{os.getenv('MYSQL_DATABASE', 'laika_club')}"

print("=" * 60)
print("DIAGNÓSTICO DE CONEXIÓN Y ESCRITURA A MYSQL")
print("=" * 60)

# Test 1: Conexión directa con PyMySQL
print("\n[TEST 1] Conexión directa con PyMySQL...")
try:
    conn = pymysql.connect(
        host=os.getenv('MYSQL_HOST', 'localhost'),
        user=os.getenv('MYSQL_USER', 'root'),
        password=os.getenv('MYSQL_PASSWORD', ''),
        database=os.getenv('MYSQL_DATABASE', 'laika_club'),
        charset='utf8mb4'
    )
    print("✅ Conexión exitosa con PyMySQL")
    
    # Verificar permisos
    cursor = conn.cursor()
    cursor.execute("SHOW GRANTS FOR CURRENT_USER()")
    grants = cursor.fetchall()
    print("\n📋 Permisos del usuario:")
    for grant in grants:
        print(f"   {grant[0]}")
    
    # Verificar modo AUTOCOMMIT
    cursor.execute("SELECT @@autocommit")
    autocommit = cursor.fetchone()[0]
    print(f"\n🔧 AUTOCOMMIT: {autocommit}")
    
    # Test de escritura directa
    print("\n[TEST 1.1] Intentando INSERT directo...")
    try:
        cursor.execute("""
            INSERT INTO users (first_name, last_name, email, phone, password_hash, role, status, created_at)
            VALUES ('Test', 'User', 'test@test.com', '1234567890', 'hash123', 'usuario', 'active', NOW())
        """)
        conn.commit()  # Commit explícito
        print("✅ INSERT exitoso con PyMySQL directo")
        
        # Verificar que se guardó
        cursor.execute("SELECT * FROM users WHERE email = 'test@test.com'")
        result = cursor.fetchone()
        if result:
            print(f"✅ Registro encontrado: ID={result[0]}, Email={result[3]}")
            # Limpiar
            cursor.execute("DELETE FROM users WHERE email = 'test@test.com'")
            conn.commit()
            print("✅ Registro de prueba eliminado")
        else:
            print("❌ PROBLEMA: Registro no encontrado después de INSERT")
            
    except Exception as e:
        print(f"❌ Error en INSERT directo: {e}")
        conn.rollback()
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Error de conexión: {e}")

# Test 2: SQLAlchemy con autocommit=False (como tu config actual)
print("\n" + "=" * 60)
print("[TEST 2] SQLAlchemy con autocommit=False...")
try:
    engine = create_engine(MYSQL_URL, echo=True)  # echo=True para ver queries
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    db = SessionLocal()
    
    # Intentar INSERT
    print("\n[TEST 2.1] INSERT con SQLAlchemy (autocommit=False)...")
    try:
        result = db.execute(text("""
            INSERT INTO users (first_name, last_name, email, phone, password_hash, role, status, created_at)
            VALUES ('SQLAlchemy', 'Test', 'sqlalchemy@test.com', '9876543210', 'hash456', 'usuario', 'active', NOW())
        """))
        print(f"✅ Execute exitoso, rows affected: {result.rowcount}")
        
        # COMMIT
        print("💾 Ejecutando commit...")
        db.commit()
        print("✅ COMMIT exitoso")
        
        # Verificar en nueva sesión
        db2 = SessionLocal()
        result = db2.execute(text("SELECT * FROM users WHERE email = 'sqlalchemy@test.com'"))
        user = result.fetchone()
        
        if user:
            print(f"✅ Registro encontrado en nueva sesión: ID={user.id}, Email={user.email}")
            # Limpiar
            db2.execute(text("DELETE FROM users WHERE email = 'sqlalchemy@test.com'"))
            db2.commit()
            print("✅ Registro de prueba eliminado")
        else:
            print("❌ PROBLEMA CRÍTICO: Registro no encontrado en nueva sesión después de commit")
            print("   Esto indica que el commit no está funcionando correctamente")
        
        db2.close()
        
    except Exception as e:
        print(f"❌ Error en INSERT con SQLAlchemy: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    
    db.close()
    
except Exception as e:
    print(f"❌ Error con SQLAlchemy: {e}")
    import traceback
    traceback.print_exc()

# Test 3: SQLAlchemy con autocommit=True
print("\n" + "=" * 60)
print("[TEST 3] SQLAlchemy con autocommit=True...")
try:
    engine = create_engine(MYSQL_URL)
    SessionLocal = sessionmaker(autocommit=True, autoflush=True, bind=engine)
    
    db = SessionLocal()
    
    print("\n[TEST 3.1] INSERT con SQLAlchemy (autocommit=True)...")
    try:
        # Con autocommit=True, cada operación se confirma automáticamente
        db.begin()  # Iniciar transacción manual
        db.execute(text("""
            INSERT INTO users (first_name, last_name, email, phone, password_hash, role, status, created_at)
            VALUES ('Autocommit', 'Test', 'autocommit@test.com', '1111111111', 'hash789', 'usuario', 'active', NOW())
        """))
        db.commit()  # Commit de la transacción manual
        print("✅ INSERT con autocommit=True exitoso")
        
        # Verificar
        db.begin()
        result = db.execute(text("SELECT * FROM users WHERE email = 'autocommit@test.com'"))
        user = result.fetchone()
        
        if user:
            print(f"✅ Registro encontrado: ID={user.id}, Email={user.email}")
            # Limpiar
            db.execute(text("DELETE FROM users WHERE email = 'autocommit@test.com'"))
            db.commit()
            print("✅ Registro de prueba eliminado")
        else:
            print("❌ Registro no encontrado con autocommit=True")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    db.close()
    
except Exception as e:
    print(f"❌ Error: {e}")

# Test 4: Verificar configuración de MySQL
print("\n" + "=" * 60)
print("[TEST 4] Configuración de MySQL Server...")
try:
    conn = pymysql.connect(
        host=os.getenv('MYSQL_HOST', 'localhost'),
        user=os.getenv('MYSQL_USER', 'root'),
        password=os.getenv('MYSQL_PASSWORD', ''),
        database=os.getenv('MYSQL_DATABASE', 'laika_club')
    )
    cursor = conn.cursor()
    
    # Variables importantes
    variables = [
        'autocommit',
        'transaction_isolation',
        'innodb_flush_log_at_trx_commit',
        'sync_binlog'
    ]
    
    for var in variables:
        cursor.execute(f"SHOW VARIABLES LIKE '{var}'")
        result = cursor.fetchone()
        if result:
            print(f"   {result[0]}: {result[1]}")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 60)
print("DIAGNÓSTICO COMPLETADO")
print("=" * 60)
