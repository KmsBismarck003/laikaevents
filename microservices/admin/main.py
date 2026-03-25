"""
Admin Service - Port 8005
Maneja: /database/*, /ads/*, /config/*
Usa MySQL directamente (misma BD que events/tickets service)
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks, File, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os, json, subprocess, uuid, shutil, io
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Laika Admin Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── MySQL Connection ──────────────────────────────────────────────────────────
MYSQL_URL = (
    f"mysql+pymysql://{os.getenv('MYSQL_USER','root')}:{os.getenv('MYSQL_PASSWORD','')}"
    f"@{os.getenv('MYSQL_HOST','localhost')}:3306/{os.getenv('MYSQL_DATABASE','laika_club')}"
)

# Forzar conexión a MySQL para evitar caer en SQLite vacío
engine = create_engine(MYSQL_URL, pool_pre_ping=True)
print("[ADMIN SERVICE] Conexión MySQL configurada.")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from fastapi import Depends
from sqlalchemy.orm import Session

BACKUP_DIR = Path("backups")
BACKUP_DIR.mkdir(exist_ok=True)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
ADS_UPLOAD_DIR = UPLOAD_DIR / "ads"
ADS_UPLOAD_DIR.mkdir(exist_ok=True)

# Servir archivos estáticos
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── Health ─────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "alive", "service": "admin-service"}

# ══════════════════════════════════════════════════════════════════════════════
# DATABASE ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/database/backups")
def list_backups(db: Session = Depends(get_db)):
    """Lista todos los respaldos del historial"""
    try:
        rows = db.execute(text("""
            SELECT id, backup_id, type, status, scheduled_at, created_at, completed_at, size_mb
            FROM backup_history ORDER BY created_at DESC LIMIT 50
        """)).fetchall()
        backups = [dict(r._mapping) for r in rows]
        # Serializar fechas
        for b in backups:
            for k in ['scheduled_at','created_at','completed_at']:
                if b.get(k) and hasattr(b[k],'isoformat'):
                    b[k] = b[k].isoformat()
        return {"backups": backups, "total": len(backups)}
    except Exception as e:
        return {"backups": [], "total": 0, "error": str(e)}

class BackupRequest(BaseModel):
    type: str = "full"  # full | incremental
    tables: Optional[List[str]] = None
    engine: str = "mysql" # "mysql" | "mongodb"

@app.post("/database/backup")
async def create_backup(
    req: BackupRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Crear un nuevo respaldo de la BD (MySQL o MongoDB)"""
    db_engine = req.engine.lower()
    
    if db_engine == "mongodb":
        backup_id = f"backup_mongo_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
        db.execute(text("""
            INSERT INTO backup_history (backup_id, type, status, created_at)
            VALUES (:bid, 'mongodb', 'in_progress', CURRENT_TIMESTAMP)
        """), {"bid": backup_id})
        db.commit()
        
        background_tasks.add_task(_do_mongo_backup, backup_id)
        return {"success": True, "backup_id": backup_id, "message": "Respaldo MongoDB iniciado"}
        
    backup_id = f"backup_{req.type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
    
    # Insertar registro pendiente
    db.execute(text("""
        INSERT INTO backup_history (backup_id, type, status, created_at)
        VALUES (:bid, :typ, 'in_progress', CURRENT_TIMESTAMP)
    """), {"bid": backup_id, "typ": req.type})
    db.commit()
    
    background_tasks.add_task(_do_backup, backup_id, req.type, db, req.tables)
    
    return {"success": True, "backup_id": backup_id, "message": "Respaldo iniciado"}

def _do_backup(backup_id: str, backup_type: str, db: Session, tables: List[str] = None):
    """Ejecutar el mysqldump en background"""
    db2 = SessionLocal()
    try:
        outfile = BACKUP_DIR / f"{backup_id}.sql"
        host = os.getenv('MYSQL_HOST', 'localhost')
        user = os.getenv('MYSQL_USER', 'root')
        pwd  = os.getenv('MYSQL_PASSWORD', '')
        dbname = os.getenv('MYSQL_DATABASE', 'laika_club')
        mysqldump_path = os.getenv('MYSQLDUMP_PATH', 'mysqldump')

        cmd = [mysqldump_path, f"--host={host}", f"--user={user}"]
        if pwd:
            cmd.append(f"--password={pwd}")
        
        # Para respaldo selectivo, no incluimos rutinas/triggers globales si solo queremos tablas
        if backup_type == 'selectivo' and tables:
            cmd += ["--single-transaction", dbname] + tables
        else:
            cmd += ["--single-transaction", "--routines", "--triggers", dbname]

        with open(outfile, "w", encoding="utf-8") as f:
            result = subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, text=True)

        if result.returncode == 0:
            size_mb = outfile.stat().st_size / (1024*1024)
            db2.execute(text("""
                UPDATE backup_history SET status='completed', completed_at=CURRENT_TIMESTAMP, size_mb=:sz
                WHERE backup_id=:bid
            """), {"sz": round(size_mb, 2), "bid": backup_id})
        else:
            db2.execute(text("""
                UPDATE backup_history SET status='failed', completed_at=CURRENT_TIMESTAMP, error_message=:err
                WHERE backup_id=:bid
            """), {"err": result.stderr[:500], "bid": backup_id})
        db2.commit()
    except Exception as e:
        try:
            db2.execute(text("""
                UPDATE backup_history SET status='failed', error_message=:err
                WHERE backup_id=:bid
            """), {"err": str(e)[:500], "bid": backup_id})
            db2.commit()
        except:
            pass
    finally:
        db2.close()

def _do_mongo_backup(backup_id: str):
    """Ejecutar el volcado de MongoDB a JSON en background"""
    db2 = SessionLocal()
    try:
        outfile = BACKUP_DIR / f"{backup_id}.json"
        
        from pymongo import MongoClient
        from bson import json_util
        
        raw_uri = os.getenv("MONGO_URI", "").strip('"')
        client = MongoClient(raw_uri, serverSelectionTimeoutMS=5000)
        mongo_db = client[os.getenv("MONGO_DB", "laika_analytics")]
        
        collections = mongo_db.list_collection_names()
        dump_data = {}
        
        for c in collections:
            if c.startswith("system."): continue
            docs = list(mongo_db[c].find({}, {"_id": 0}))
            dump_data[c] = docs
            
        with open(outfile, "w", encoding="utf-8") as f:
            f.write(json_util.dumps(dump_data))
            
        size_mb = outfile.stat().st_size / (1024*1024)
        db2.execute(text("""
            UPDATE backup_history SET status='completed', completed_at=CURRENT_TIMESTAMP, size_mb=:sz
            WHERE backup_id=:bid
        """), {"sz": round(size_mb, 2), "bid": backup_id})
        db2.commit()
    except Exception as e:
        try:
            db2.execute(text("""
                UPDATE backup_history SET status='failed', completed_at=CURRENT_TIMESTAMP, error_message=:err
                WHERE backup_id=:bid
            """), {"err": str(e)[:500], "bid": backup_id})
            db2.commit()
        except: pass
    finally:
        db2.close()

@app.delete("/database/backups/{backup_id}")
def delete_backup(backup_id: str, db: Session = Depends(get_db)):
    """Eliminar un respaldo"""
    db.execute(text("DELETE FROM backup_history WHERE backup_id=:bid OR id=:bid2"),
               {"bid": backup_id, "bid2": backup_id})
    db.commit()
    # También eliminar archivo si existe
    for f in BACKUP_DIR.glob(f"{backup_id}*"):
        f.unlink(missing_ok=True)
    return {"success": True}
    
@app.get("/database/backups/{backup_id}/download")
def download_backup(backup_id: str):
    """Descargar un archivo de respaldo SQL"""
    # Buscar el archivo en el directorio de respaldos
    # El backup_id suele ser el nombre base del archivo
    file_path = BACKUP_DIR / f"{backup_id}.sql"
    
    if not file_path.exists():
        # Intentar buscar por patrón si el backup_id no es exacto
        files = list(BACKUP_DIR.glob(f"{backup_id}*"))
        if files:
            file_path = files[0]
        else:
            raise HTTPException(status_code=404, detail="Archivo de respaldo no encontrado")
            
    # Usar StreamingResponse para asegurar que los headers de descarga lleguen bien
    def iter_file():
        with open(file_path, "rb") as f:
            yield from f

    return StreamingResponse(
        iter_file(),
        media_type='application/sql',
        headers={
            "Content-Disposition": f"attachment; filename={file_path.name}",
            "Content-Type": "application/sql"
        }
    )

@app.get("/database/tables")
def list_tables(db: Session = Depends(get_db)):
    """Lista todas las tablas de la BD con su conteo de filas"""
    try:
        rows = db.execute(text("""
            SELECT table_name as name, table_rows as row_count
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
            ORDER BY table_name ASC
        """)).fetchall()
        return {"tables": [dict(r._mapping) for r in rows]}
    except Exception as e:
        # Fallback si falla information_schema
        rows = db.execute(text("SHOW TABLES")).fetchall()
        return {"tables": [{"name": list(r)[0], "row_count": 0} for r in rows]}

@app.get("/database/stats")
def get_stats(db: Session = Depends(get_db)):
    """Estadísticas de la BD"""
    try:
        rows = db.execute(text("""
            SELECT table_name, table_rows, data_length, index_length
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
        """)).fetchall()
        return {"tables": [dict(r._mapping) for r in rows]}
    except:
        return {"tables": []}

# ── Multi-format Exports ──────────────────────────────────────────────────────

@app.get("/database/export/json")
def export_json(db: Session = Depends(get_db)):
    """Exporta todas las tablas de la base de datos en formato JSON"""
    try:
        # Obtener lista de tablas
        rows = db.execute(text("SHOW TABLES")).fetchall()
        tables = [list(r)[0] for r in rows]
        
        data = {}
        for table in tables:
            # Seleccionar datos de cada tabla (limitado para evitar problemas de memoria)
            result = db.execute(text(f"SELECT * FROM `{table}` LIMIT 1000")).fetchall()
            data[table] = [dict(r._mapping) for r in result]
            
        from datetime import datetime, date, timedelta
        import decimal
        # Serializar fechas, decimales y lapsos (timedelta)
        def json_serial(obj):
            if isinstance(obj, (datetime, date)):
                return obj.isoformat()
            if isinstance(obj, decimal.Decimal):
                return float(obj)
            if isinstance(obj, timedelta):
                return str(obj)
            raise TypeError ("Type %s not serializable" % type(obj))

        json_str = json.dumps(data, default=json_serial, indent=2)
        return StreamingResponse(
            io.BytesIO(json_str.encode()),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=database_export_{datetime.now().strftime('%Y%m%d')}.json"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/database/export/excel")
def export_excel(db: Session = Depends(get_db)):
    """Exporta todas las tablas de la base de datos en formato Excel (una hoja por tabla)"""
    try:
        rows = db.execute(text("SHOW TABLES")).fetchall()
        tables = [list(r)[0] for r in rows]
        
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            for table in tables:
                df = pd.read_sql(f"SELECT * FROM `{table}` LIMIT 1000", engine)
                df.to_excel(writer, sheet_name=table[:31], index=False) # Excel sheets limit 31 chars
                
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=database_export_{datetime.now().strftime('%Y%m%d')}.xlsx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/database/export/pdf")
def export_pdf(db: Session = Depends(get_db)):
    """Genera un reporte PDF con el resumen de la base de datos"""
    try:
        rows = db.execute(text("SHOW TABLES")).fetchall()
        tables = [list(r)[0] for r in rows]
        
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        p.setFont("Helvetica-Bold", 16)
        p.drawString(100, height - 50, "LAIKA CLUB - DATABASE REPORT")
        p.setFont("Helvetica", 10)
        p.drawString(100, height - 70, f"Generado el: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
        
        p.line(100, height - 80, 500, height - 80)
        
        y = height - 110
        p.setFont("Helvetica-Bold", 12)
        p.drawString(100, y, "RESUMEN DE TABLAS")
        y -= 25
        
        p.setFont("Helvetica", 10)
        for table in tables:
            # Obtener conteo de registros
            count = db.execute(text(f"SELECT COUNT(*) FROM `{table}`")).scalar()
            p.drawString(120, y, f"• {table}: {count} registros")
            y -= 20
            if y < 50:
                p.showPage()
                y = height - 50
                
        p.showPage()
        p.save()
        
        buffer.seek(0)
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=database_report_{datetime.now().strftime('%Y%m%d')}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/database/export/svg")
def export_svg(db: Session = Depends(get_db)):
    """Exporta una visualización SVG simplificada de la estructura de la base de datos"""
    try:
        rows = db.execute(text("SHOW TABLES")).fetchall()
        tables = [list(r)[0] for r in rows]
        
        svg_width = 800
        svg_height = max(600, len(tables) * 40 + 100)
        
        svg = [
            f'<svg width="{svg_width}" height="{svg_height}" xmlns="http://www.w3.org/2000/svg">',
            '<rect width="100%" height="100%" fill="#ffffff" />',
            '<text x="20" y="40" font-family="Arial" font-size="20" font-weight="bold" fill="#000000">LAIKA DATABASE SCHEMA</text>',
            f'<text x="20" y="65" font-family="Arial" font-size="12" fill="#666666">Generado: {datetime.now().strftime("%Y-%m-%d %H:%M")}</text>'
        ]
        
        y = 100
        for i, table in enumerate(tables):
            color = "#f0f0f0" if i % 2 == 0 else "#e0e0e0"
            svg.append(f'<rect x="20" y="{y}" width="300" height="30" rx="5" fill="{color}" stroke="#cccccc"/>')
            svg.append(f'<text x="35" y="{y+20}" font-family="Arial" font-size="14" font-weight="bold">{table.upper()}</text>')
            y += 40
            
        svg.append('</svg>')
        
        return StreamingResponse(
            io.BytesIO("\n".join(svg).encode()),
            media_type="image/svg+xml",
            headers={"Content-Disposition": f"attachment; filename=database_schema_{datetime.now().strftime('%Y%m%d')}.svg"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/database/optimize")
def optimize_db(db: Session = Depends(get_db)):
    rows = db.execute(text("SHOW TABLES")).fetchall()
    tables = [list(r)[0] for r in rows]
    for t in tables:
        try:
            db.execute(text(f"OPTIMIZE TABLE `{t}`"))
        except:
            pass
    return {"success": True, "message": "Optimización completada"}

@app.post("/database/clear-cache")
def clear_cache():
    return {"success": True, "message": "Caché limpiado"}

@app.post("/database/restore")
async def restore_backup(payload: dict, db: Session = Depends(get_db)):
    """Restaurar una base de datos desde un archivo SQL"""
    backup_id = payload.get("backup_id")
    if not backup_id:
        raise HTTPException(status_code=400, detail="backup_id es requerido")

    # Buscar el archivo
    file_path = BACKUP_DIR / f"{backup_id}.sql"
    if not file_path.exists():
        files = list(BACKUP_DIR.glob(f"{backup_id}*"))
        if files:
            file_path = files[0]
        else:
            raise HTTPException(status_code=404, detail="Archivo de respaldo no encontrado")

    try:
        if file_path.suffix == ".json":
            # RESTAURAR MONGODB
            from pymongo import MongoClient
            from bson import json_util
            
            with open(file_path, "r", encoding="utf-8") as f:
                dump_data = json_util.loads(f.read())
                
            raw_uri = os.getenv("MONGO_URI", "").strip('"')
            client = MongoClient(raw_uri, serverSelectionTimeoutMS=5000)
            mongo_db = client[os.getenv("MONGO_DB", "laika_analytics")]
            
            restored_cols = []
            for coll_name, docs in dump_data.items():
                if docs:
                    mongo_db[coll_name].drop() # Limpiar previo
                    mongo_db[coll_name].insert_many(docs)
                    restored_cols.append(coll_name)
                    
            return {"success": True, "message": f"MongoDB restaurada con éxito desde {file_path.name}"}

        # RESTAURAR MYSQL (Código Original)
        host = os.getenv('MYSQL_HOST', 'localhost')
        user = os.getenv('MYSQL_USER', 'root')
        pwd  = os.getenv('MYSQL_PASSWORD', '')
        dbname = os.getenv('MYSQL_DATABASE', 'laika_club')
        mysql_exe = os.getenv('MYSQL_EXE_PATH', 'mysql')
        mysqladmin_exe = os.getenv('MYSQLADMIN_EXE_PATH', 'mysqladmin')

        # Comando para restaurar usando el cliente mysql
        cmd = f'"{mysql_exe}" -h {host} -u {user}'
        if pwd:
            cmd += f' -p{pwd}'
        cmd += f' {dbname} < "{str(file_path)}"'

        # IMPORTANTE: Recrear la base si no existe
        create_db_cmd = f'"{mysqladmin_exe}" -h {host} -u {user} '
        if pwd: create_db_cmd += f'-p{pwd} '
        create_db_cmd += f'create {dbname}'
        
        subprocess.run(create_db_cmd, shell=True, capture_output=True)
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

        if result.returncode == 0:
            return {"success": True, "message": f"Base de datos {dbname} restaurada con éxito desde {file_path.name}"}
        else:
            return {"success": False, "message": f"Error en restauración: {result.stderr}"}

    except Exception as e:
        return {"success": False, "message": f"Error inesperado: {str(e)}"}

# Automatic backup config
@app.get("/database/automatic-backup/config")
def get_auto_backup_config(db: Session = Depends(get_db)):
    try:
        row = db.execute(text(
            "SELECT value FROM system_config WHERE `key`='automatic_backup_config'"
        )).fetchone()
        config = {}
        if row and row[0]:
            try:
                config = json.loads(row[0])
            except:
                config = {}
    except:
        config = {}
    
    last_row = db.execute(text(
        "SELECT MAX(created_at) as lb FROM backup_history WHERE status='completed'"
    )).fetchone()
    last_backup = None
    if last_row and last_row[0]:
        lb = last_row[0]
        if hasattr(lb, 'isoformat'):
            last_backup = lb.isoformat()
        else:
            last_backup = str(lb) # Para SQLite que devuelve string
    
    return {
        "config": {
            "enabled": config.get("enabled", False),
            "frequency": config.get("frequency", "daily"),
            "time": config.get("time", "02:00"),
            "backupType": config.get("backupType", "full"),
            "retentionDays": config.get("retentionDays", 30),
            "maxBackups": config.get("maxBackups", 10),
        },
        "lastBackup": last_backup,
        "nextBackup": None
    }

@app.put("/database/automatic-backup/config")
def update_auto_backup_config(config: dict, db: Session = Depends(get_db)):
    db.execute(text("""
        INSERT INTO system_config (`key`, `value`) VALUES ('automatic_backup_config', :v)
        ON DUPLICATE KEY UPDATE `value`=:v
    """), {"v": json.dumps(config)})
    db.commit()
    return {"success": True}

@app.get("/database/automatic-backup/scheduled")
def get_scheduled(db: Session = Depends(get_db)):
    rows = db.execute(text(
        "SELECT * FROM backup_history WHERE status='scheduled' ORDER BY scheduled_at ASC LIMIT 10"
    )).fetchall()
    return {"scheduled": [dict(r._mapping) for r in rows]}

@app.post("/database/automatic-backup/trigger")
async def trigger_backup(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    req = BackupRequest(type="full")
    return await create_backup(req, background_tasks, db)

@app.post("/database/automatic-backup/cleanup")
def cleanup_backups(db: Session = Depends(get_db)):
    db.execute(text(
        "DELETE FROM backup_history WHERE status='failed' AND created_at < datetime('now', '-7 days')"
    ))
    db.commit()
    return {"success": True, "message": "Limpieza completada"}

# ══════════════════════════════════════════════════════════════════════════════
# ADS ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

class AdCreate(BaseModel):
    title: str
    image_url: str
    link_url: Optional[str] = None
    position: str = "main"
    active: bool = True

class AdUpdate(BaseModel):
    title: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    position: Optional[str] = None
    active: Optional[bool] = None

def _row_to_ad(row):
    d = dict(row._mapping)
    for k in ['created_at']:
        if d.get(k) and hasattr(d[k], 'isoformat'):
            d[k] = d[k].isoformat()
    d['active'] = bool(d.get('active', False))
    return d

@app.get("/ads/public")
def get_public_ads(db: Session = Depends(get_db)):
    db.commit() 
    
    # --- DEBUG SECTION ---
    try:
        all_ads = db.execute(text("SELECT * FROM ads")).fetchall()
        active_ads = db.execute(text("SELECT * FROM ads WHERE active=1")).fetchall()
        with open("debug_ads_call.txt", "w") as f:
            f.write(f"Total ads sin filtro: {len(all_ads)}\n")
            f.write(f"Total ads con active=1: {len(active_ads)}\n")
            if all_ads:
                f.write(f"Ejemplo primer ad sin filtro: {dict(all_ads[0]._mapping)}\n")
    except Exception as e:
        with open("debug_ads_call.txt", "w") as f:
            f.write(f"Error en debug: {e}\n")
    # ----------------------
    
    rows = db.execute(text("SELECT * FROM ads WHERE active=1 ORDER BY id DESC")).fetchall()
    return [_row_to_ad(r) for r in rows]

@app.get("/ads/admin")
def get_all_ads(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT a.*, (SELECT COUNT(*) FROM ad_clicks ac WHERE ac.ad_id = a.id) as click_count
        FROM ads a 
        ORDER BY a.id DESC
    """)).fetchall()
    return [_row_to_ad(r) for r in rows]

@app.post("/ads")
def create_ad(ad: AdCreate, db: Session = Depends(get_db)):
    db.execute(text("""
        INSERT INTO ads (title, image_url, link_url, position, active)
        VALUES (:t, :i, :l, :p, :a)
    """), {"t": ad.title, "i": ad.image_url, "l": ad.link_url, "p": ad.position, "a": int(ad.active)})
    db.commit()
    row = db.execute(text("SELECT * FROM ads ORDER BY id DESC LIMIT 1")).fetchone()
    return _row_to_ad(row)

@app.put("/ads/{ad_id}")
def update_ad(ad_id: int, ad: AdUpdate, db: Session = Depends(get_db)):
    data = {k: v for k, v in ad.dict().items() if v is not None}
    if not data:
        raise HTTPException(400, "No hay datos para actualizar")
    if 'active' in data:
        data['active'] = int(data['active'])
    sets = ", ".join(f"`{k}`=:{k}" for k in data)
    data['id'] = ad_id
    db.execute(text(f"UPDATE ads SET {sets} WHERE id=:id"), data)
    db.commit()
    row = db.execute(text("SELECT * FROM ads WHERE id=:id"), {"id": ad_id}).fetchone()
    if not row:
        raise HTTPException(404, "Anuncio no encontrado")
    return _row_to_ad(row)

@app.delete("/ads/{ad_id}")
def delete_ad(ad_id: int, db: Session = Depends(get_db)):
    db.execute(text("DELETE FROM ads WHERE id=:id"), {"id": ad_id})
    db.commit()
    return {"success": True}

class ClickRecord(BaseModel):
    user_id: Optional[int] = None

@app.post("/ads/{ad_id}/click")
def record_ad_click(ad_id: int, req: ClickRecord, db: Session = Depends(get_db)):
    """Registra un clic en un anuncio"""
    db.execute(text("""
        INSERT INTO ad_clicks (ad_id, user_id, clicked_at)
        VALUES (:ad_id, :user_id, CURRENT_TIMESTAMP)
    """), {"ad_id": ad_id, "user_id": req.user_id})
    db.commit()
    return {"success": True}

@app.get("/ads/{ad_id}/clicks")
def get_ad_clicks(ad_id: int, db: Session = Depends(get_db)):
    """Obtiene la lista de usuarios que hicieron clic en un anuncio (Estilo WhatsApp)"""
    rows = db.execute(text("""
        SELECT ac.clicked_at, u.id as user_id, u.full_name, u.email, u.profile_image
        FROM ad_clicks ac
        LEFT JOIN users u ON ac.user_id = u.id
        WHERE ac.ad_id = :ad_id
        ORDER BY ac.clicked_at DESC
    """), {"ad_id": ad_id}).fetchall()
    
    clicks = []
    for r in rows:
        d = dict(r._mapping)
        if d.get('clicked_at') and hasattr(d['clicked_at'], 'isoformat'):
            d['clicked_at'] = d['clicked_at'].isoformat()
        clicks.append(d)
        
    return clicks

# Upload endpoint real
@app.post("/ads/upload")
async def upload_ad_image(file: UploadFile = File(...)):
    """Sube una imagen para anuncios y retorna su URL"""
    try:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
            raise HTTPException(400, "Formato de imagen no permitido")
            
        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = ADS_UPLOAD_DIR / filename
        
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {"url": f"/api/admin/uploads/ads/{filename}", "message": "Imagen subida correctamente"}
    except Exception as e:
        raise HTTPException(500, f"Error al subir imagen: {str(e)}")

# ══════════════════════════════════════════════════════════════════════════════
# CONFIG ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/config")
def get_config(db: Session = Depends(get_db)):
    try:
        rows = db.execute(text("SELECT `key`, `value` FROM system_config")).fetchall()
        config = {r[0]: r[1] for r in rows}
        return {
            "maintenanceMode": config.get("maintenanceMode", "false") == "true",
            "registrationEnabled": config.get("registrationEnabled", "true") != "false",
            "sessionTimeout": int(config.get("sessionTimeout", 30)),
            "maxTicketsPerUser": int(config.get("maxTicketsPerUser", 5)),
        }
    except:
        return {"maintenanceMode": False, "registrationEnabled": True, "sessionTimeout": 30, "maxTicketsPerUser": 5}

# --- News Ticker Specific Endpoints ---
@app.get("/config/ticker")
def get_ticker_config(db: Session = Depends(get_db)):
    print(f"[ADMIN] GET /config/ticker")
    row = db.execute(text("SELECT `value` FROM system_config WHERE `key`='news_ticker_config'")).fetchone()
    if row:
        return json.loads(row[0])
    return {
        "text": "PROXIMOS EVENTOS - OFERTAS EXCLUSIVAS - SOLD OUT: CONCIERTO ROCK - CLUB LAIKA",
        "backgroundColor": "#000000",
        "textColor": "#ffffff",
        "speed": 20
    }

@app.post("/config/ticker")
def update_ticker_config(config: dict, db: Session = Depends(get_db)):
    print(f"[ADMIN] POST /config/ticker: {config}")
    db.execute(text("""
        INSERT INTO system_config (`key`, `value`) VALUES ('news_ticker_config', :v)
        ON DUPLICATE KEY UPDATE `value`=:v
    """), {"v": json.dumps(config)})
    db.commit()
    return {"success": True}

@app.post("/config/{key}")
def update_config_param(key: str, payload: dict, db: Session = Depends(get_db)):
    print(f"[ADMIN] POST /config/{key}")
    value = str(payload.get("value", ""))
    db.execute(text("""
        INSERT INTO system_config (`key`, `value`) VALUES (:k, :v)
        ON DUPLICATE KEY UPDATE `value`=:v
    """), {"k": key, "v": value})
    db.commit()
    return {"success": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
