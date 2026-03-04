# routers/achievements.py
# ============================================================
# MODULO AISLADO DE LOGROS Y RECOMPENSAS - LAIKA CLUB
# ------------------------------------------------------------
# Este modulo es 100% independiente. Se puede registrar/desregistrar
# del main.py sin afectar ningun otro servicio.
# Crea sus propias tablas automaticamente si no existen.
# Todas las operaciones son fail-safe (try/except).
# ============================================================

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import traceback
import uuid

router = APIRouter()

# ============================================
# DEPENDENCIA BD (aislada)
# ============================================

def get_db():
    from main import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user_safe():
    """Importa get_current_user de forma segura"""
    from dependencies import get_current_user
    return get_current_user

# ============================================
# DEFINICION DE LOS 10 LOGROS
# ============================================

ACHIEVEMENTS_SEED = [
    {
        "tier": 1,
        "name": "Pasaporte Cosmico",
        "description": "Te registraste en LAIKA Club y comenzaste tu viaje interestelar.",
        "requirement_type": "register",
        "requirement_value": 0,
        "reward_description": "Service Fee OFF en tu primera compra (un solo uso)",
        "coupon_type": "fee_off_once",
        "coupon_value": 100.00,
        "coupon_uses": 1,
        "phase": "gancho",
        "image_url": "/static/achievements/tier_01.png"
    },
    {
        "tier": 2,
        "name": "Ignicion: T-Minus 0",
        "description": "Asististe a tu primer evento. El despegue comienza aqui.",
        "requirement_type": "events_count",
        "requirement_value": 1,
        "reward_description": "Acceso a Preventa Exclusiva 'Laika Priority' por 1 mes",
        "coupon_type": "priority_access",
        "coupon_value": 0,
        "coupon_uses": 1,
        "phase": "gancho",
        "image_url": "/static/achievements/tier_02.png"
    },
    {
        "tier": 3,
        "name": "Orbita Baja",
        "description": "3 eventos completados. Ya estas en orbita.",
        "requirement_type": "events_count",
        "requirement_value": 3,
        "reward_description": "5% de descuento en tu proxima compra",
        "coupon_type": "discount_percent",
        "coupon_value": 5.00,
        "coupon_uses": 1,
        "phase": "gancho",
        "image_url": "/static/achievements/tier_03.png"
    },
    {
        "tier": 4,
        "name": "Alunizaje VIP",
        "description": "5 eventos. Tu boleto ahora tiene acabado premium.",
        "requirement_type": "events_count",
        "requirement_value": 5,
        "reward_description": "Skin dorada premium en tus boletos digitales",
        "coupon_type": "premium_ticket",
        "coupon_value": 0,
        "coupon_uses": -1,
        "phase": "retencion",
        "image_url": "/static/achievements/tier_04.png"
    },
    {
        "tier": 5,
        "name": "Piloto Sputnik",
        "description": "10 eventos. Eres un verdadero piloto espacial.",
        "requirement_type": "events_count",
        "requirement_value": 10,
        "reward_description": "2x1 en cargos por servicio (proximas 2 compras)",
        "coupon_type": "fee_half",
        "coupon_value": 50.00,
        "coupon_uses": 2,
        "phase": "retencion",
        "image_url": "/static/achievements/tier_05.png"
    },
    {
        "tier": 6,
        "name": "Viajero de Marte",
        "description": "20 eventos. Has conquistado el planeta rojo.",
        "requirement_type": "events_count",
        "requirement_value": 20,
        "reward_description": "Fila Rapida 'Laika Pass' en eventos seleccionados",
        "coupon_type": "fast_pass",
        "coupon_value": 0,
        "coupon_uses": -1,
        "phase": "retencion",
        "image_url": "/static/achievements/tier_06.png"
    },
    {
        "tier": 7,
        "name": "Comandante Interestelar",
        "description": "50 eventos. Eres una leyenda del cosmos.",
        "requirement_type": "events_count",
        "requirement_value": 50,
        "reward_description": "Kit de Merch exclusivo LAIKA Club",
        "coupon_type": "merch_kit",
        "coupon_value": 0,
        "coupon_uses": 1,
        "phase": "fidelizacion",
        "image_url": "/static/achievements/tier_07.png"
    },
    {
        "tier": 8,
        "name": "Salto al Hiperespacio",
        "description": "75 eventos. Viajaste mas alla de lo conocido.",
        "requirement_type": "events_count",
        "requirement_value": 75,
        "reward_description": "Boleto de regalo en tu cumpleanos (anual)",
        "coupon_type": "birthday_ticket",
        "coupon_value": 100.00,
        "coupon_uses": 1,
        "phase": "fidelizacion",
        "image_url": "/static/achievements/tier_08.png"
    },
    {
        "tier": 9,
        "name": "Supernova",
        "description": "90 eventos. Tu brillo es imparable.",
        "requirement_type": "events_count",
        "requirement_value": 90,
        "reward_description": "20% OFF en todos los cargos por servicio (permanente)",
        "coupon_type": "fee_discount_permanent",
        "coupon_value": 20.00,
        "coupon_uses": -1,
        "phase": "fidelizacion",
        "image_url": "/static/achievements/tier_09.png"
    },
    {
        "tier": 10,
        "name": "El Legado Laika",
        "description": "100 eventos. Eres parte del Salon de la Fama.",
        "requirement_type": "events_count",
        "requirement_value": 100,
        "reward_description": "40% OFF anual + Backstage Hero + Salon de la Fama",
        "coupon_type": "legend_discount",
        "coupon_value": 40.00,
        "coupon_uses": -1,
        "phase": "leyenda",
        "image_url": "/static/achievements/tier_10.png"
    }
]

# ============================================
# INICIALIZACION DE TABLAS (fail-safe)
# ============================================

def ensure_tables(db: Session):
    """Crea las tablas si no existen. Si existen con esquema incorrecto, las recrea."""
    try:
        # Achievements table (solo crear si no existe)
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS achievements (
                id INT PRIMARY KEY AUTO_INCREMENT,
                tier INT NOT NULL UNIQUE,
                name VARCHAR(100) NOT NULL,
                description VARCHAR(500),
                requirement_type VARCHAR(50) DEFAULT 'events_count',
                requirement_value INT DEFAULT 0,
                reward_description VARCHAR(500),
                coupon_type VARCHAR(50),
                coupon_value DECIMAL(10,2) DEFAULT 0,
                coupon_uses INT DEFAULT 1,
                image_url VARCHAR(500),
                phase VARCHAR(50),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """))

        # user_achievements - verificar esquema correcto
        needs_recreate_ua = False
        try:
            cols = db.execute(text("DESCRIBE user_achievements")).fetchall()
            col_names = [c[0] for c in cols]
            if 'achievement_id' not in col_names:
                needs_recreate_ua = True
        except Exception:
            needs_recreate_ua = False  # tabla no existe, la crearemos

        if needs_recreate_ua:
            print("[ACHIEVEMENTS] user_achievements tiene esquema incorrecto, recreando...")
            db.execute(text("DROP TABLE IF EXISTS user_achievements"))

        db.execute(text("""
            CREATE TABLE IF NOT EXISTS user_achievements (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                achievement_id INT NOT NULL,
                unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_user_ach (user_id, achievement_id)
            )
        """))

        # user_coupons - verificar esquema correcto
        needs_recreate_uc = False
        try:
            cols = db.execute(text("DESCRIBE user_coupons")).fetchall()
            col_names = [c[0] for c in cols]
            if 'achievement_id' not in col_names or 'coupon_code' not in col_names:
                needs_recreate_uc = True
        except Exception:
            needs_recreate_uc = False

        if needs_recreate_uc:
            print("[ACHIEVEMENTS] user_coupons tiene esquema incorrecto, recreando...")
            db.execute(text("DROP TABLE IF EXISTS user_coupons"))

        db.execute(text("""
            CREATE TABLE IF NOT EXISTS user_coupons (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                achievement_id INT,
                coupon_code VARCHAR(50) UNIQUE,
                coupon_type VARCHAR(50) NOT NULL,
                discount_value DECIMAL(10,2) DEFAULT 0,
                remaining_uses INT DEFAULT 1,
                is_active TINYINT(1) DEFAULT 1,
                expires_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                used_at DATETIME
            )
        """))
        db.commit()
        if needs_recreate_ua or needs_recreate_uc:
            print("[ACHIEVEMENTS] Tablas recreadas correctamente")
    except Exception as e:
        db.rollback()
        print(f"[ACHIEVEMENTS] Tablas ya existen o error menor: {e}")


def seed_achievements(db: Session):
    """Inserta los 10 logros si la tabla esta vacia. Fail-safe."""
    try:
        result = db.execute(text("SELECT COUNT(*) as cnt FROM achievements"))
        count = result.fetchone()[0]
        if count >= 10:
            return

        for ach in ACHIEVEMENTS_SEED:
            try:
                db.execute(text("""
                    INSERT IGNORE INTO achievements
                    (tier, name, description, requirement_type, requirement_value,
                     reward_description, coupon_type, coupon_value, coupon_uses, image_url, phase)
                    VALUES
                    (:tier, :name, :description, :requirement_type, :requirement_value,
                     :reward_description, :coupon_type, :coupon_value, :coupon_uses, :image_url, :phase)
                """), ach)
            except Exception:
                pass

        db.commit()
        print("[ACHIEVEMENTS] Seed data insertado correctamente")
    except Exception as e:
        db.rollback()
        print(f"[ACHIEVEMENTS] Error en seed: {e}")


_tables_initialized = False

def init_if_needed(db: Session):
    """Inicializa tablas y seed una sola vez por ejecucion."""
    global _tables_initialized
    if not _tables_initialized:
        ensure_tables(db)
        seed_achievements(db)
        _tables_initialized = True


# ============================================
# LOGICA DE LOGROS
# ============================================

def get_user_events_count(user_id: int, db: Session) -> int:
    """Cuenta cuantos eventos (boletos usados o activos) tiene el usuario."""
    try:
        result = db.execute(text("""
            SELECT COUNT(DISTINCT event_id) as cnt
            FROM tickets
            WHERE user_id = :uid AND status IN ('active', 'used', 'confirmed')
        """), {"uid": user_id})
        row = result.fetchone()
        return row[0] if row else 0
    except Exception:
        return 0


def check_and_unlock(user_id: int, db: Session) -> list:
    """
    Verifica todos los logros y desbloquea los que correspondan.
    Retorna lista de logros recien desbloqueados.
    """
    init_if_needed(db)
    newly_unlocked = []

    try:
        events_count = get_user_events_count(user_id, db)

        # Obtener todos los logros
        all_ach = db.execute(text("SELECT * FROM achievements ORDER BY tier")).fetchall()

        # Obtener logros ya desbloqueados
        unlocked_ids = set()
        rows = db.execute(text(
            "SELECT achievement_id FROM user_achievements WHERE user_id = :uid"
        ), {"uid": user_id}).fetchall()
        for r in rows:
            unlocked_ids.add(r[0])

        for ach in all_ach:
            a = dict(ach._mapping)
            if a['id'] in unlocked_ids:
                continue

            should_unlock = False

            if a['requirement_type'] == 'register':
                should_unlock = True
            elif a['requirement_type'] == 'events_count':
                should_unlock = events_count >= a['requirement_value']

            if should_unlock:
                try:
                    # Registrar logro
                    db.execute(text("""
                        INSERT IGNORE INTO user_achievements (user_id, achievement_id)
                        VALUES (:uid, :aid)
                    """), {"uid": user_id, "aid": a['id']})

                    # Generar cupon si aplica
                    if a['coupon_type'] and a['coupon_type'] not in ('priority_access', 'premium_ticket', 'fast_pass', 'merch_kit'):
                        coupon_code = f"LAIKA-{a['tier']:02d}-{uuid.uuid4().hex[:6].upper()}"

                        expires = None
                        if a['coupon_uses'] == 1:
                            expires = datetime.now() + timedelta(days=90)

                        db.execute(text("""
                            INSERT INTO user_coupons
                            (user_id, achievement_id, coupon_code, coupon_type, discount_value, remaining_uses, expires_at)
                            VALUES
                            (:uid, :aid, :code, :ctype, :cval, :uses, :exp)
                        """), {
                            "uid": user_id,
                            "aid": a['id'],
                            "code": coupon_code,
                            "ctype": a['coupon_type'],
                            "cval": a['coupon_value'],
                            "uses": a['coupon_uses'],
                            "exp": expires
                        })

                    newly_unlocked.append({
                        "tier": a['tier'],
                        "name": a['name'],
                        "description": a['description'],
                        "reward_description": a['reward_description'],
                        "image_url": a['image_url'],
                        "phase": a['phase']
                    })
                except Exception as inner_e:
                    print(f"[ACHIEVEMENTS] Error desbloqueando tier {a['tier']}: {inner_e}")

        if newly_unlocked:
            db.commit()

    except Exception as e:
        db.rollback()
        print(f"[ACHIEVEMENTS] Error en check_and_unlock: {e}")
        traceback.print_exc()

    return newly_unlocked


# ============================================
# ENDPOINTS
# ============================================

@router.get("/")
def list_achievements(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_safe())
):
    """
    Lista todos los 10 logros con el progreso del usuario.
    Incluye: desbloqueado (si/no), progreso actual, y detalles de recompensa.
    """
    try:
        init_if_needed(db)
        user_id = current_user.get('id') or current_user.get('user_id')
        events_count = get_user_events_count(user_id, db) if user_id else 0

        # Todos los logros
        all_ach = db.execute(text("SELECT * FROM achievements ORDER BY tier")).fetchall()

        # Logros desbloqueados del usuario
        unlocked_map = {}
        if user_id:
            rows = db.execute(text(
                "SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = :uid"
            ), {"uid": user_id}).fetchall()
            for r in rows:
                unlocked_map[r[0]] = str(r[1])

        result = []
        for ach in all_ach:
            a = dict(ach._mapping)
            is_unlocked = a['id'] in unlocked_map

            progress = 0
            if a['requirement_type'] == 'register':
                progress = 100 if is_unlocked else 100
            elif a['requirement_type'] == 'events_count' and a['requirement_value'] > 0:
                progress = min(100, round((events_count / a['requirement_value']) * 100))

            # Serializar decimals
            a['coupon_value'] = float(a['coupon_value']) if a['coupon_value'] else 0
            a['created_at'] = str(a['created_at']) if a['created_at'] else None

            result.append({
                **a,
                "unlocked": is_unlocked,
                "unlocked_at": unlocked_map.get(a['id']),
                "progress": progress,
                "current_events": events_count,
            })

        return {
            "achievements": result,
            "total_events": events_count,
            "total_unlocked": len(unlocked_map),
            "overall_progress": min(100, round((events_count / 100) * 100))
        }

    except Exception as e:
        print(f"[ACHIEVEMENTS] Error listando logros: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error al obtener logros")


@router.get("/my")
def my_achievements(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_safe())
):
    """Logros desbloqueados del usuario actual."""
    try:
        init_if_needed(db)
        user_id = current_user.get('id') or current_user.get('user_id')

        rows = db.execute(text("""
            SELECT a.*, ua.unlocked_at
            FROM user_achievements ua
            JOIN achievements a ON a.id = ua.achievement_id
            WHERE ua.user_id = :uid
            ORDER BY a.tier
        """), {"uid": user_id}).fetchall()

        return [
            {**dict(r._mapping),
             "coupon_value": float(r._mapping.get("coupon_value", 0)),
             "created_at": str(r._mapping.get("created_at", "")),
             "unlocked_at": str(r._mapping.get("unlocked_at", ""))}
            for r in rows
        ]

    except Exception as e:
        print(f"[ACHIEVEMENTS] Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error al obtener logros del usuario")


@router.get("/coupons")
def my_coupons(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_safe())
):
    """Cupones activos del usuario (para mostrar en el carrito)."""
    try:
        init_if_needed(db)
        user_id = current_user.get('id') or current_user.get('user_id')

        rows = db.execute(text("""
            SELECT uc.*, a.name as achievement_name, a.tier, a.image_url
            FROM user_coupons uc
            LEFT JOIN achievements a ON a.id = uc.achievement_id
            WHERE uc.user_id = :uid
              AND uc.is_active = 1
              AND (uc.remaining_uses = -1 OR uc.remaining_uses > 0)
              AND (uc.expires_at IS NULL OR uc.expires_at > NOW())
            ORDER BY uc.created_at DESC
        """), {"uid": user_id}).fetchall()

        coupons = []
        for r in rows:
            c = dict(r._mapping)
            c['discount_value'] = float(c.get('discount_value', 0))
            c['created_at'] = str(c.get('created_at', ''))
            c['used_at'] = str(c.get('used_at', '')) if c.get('used_at') else None
            c['expires_at'] = str(c.get('expires_at', '')) if c.get('expires_at') else None
            coupons.append(c)

        return coupons

    except Exception as e:
        print(f"[ACHIEVEMENTS] Error cupones: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error al obtener cupones")


class CouponApply(BaseModel):
    coupon_code: str
    subtotal: float
    service_fee_percent: Optional[float] = 10.0

@router.post("/coupons/validate")
def validate_coupon(
    data: CouponApply,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_safe())
):
    """
    Valida un cupon y calcula el descuento.
    NO lo consume, solo calcula. El consumo ocurre en el checkout.
    """
    try:
        init_if_needed(db)
        user_id = current_user.get('id') or current_user.get('user_id')

        row = db.execute(text("""
            SELECT * FROM user_coupons
            WHERE user_id = :uid AND coupon_code = :code AND is_active = 1
              AND (remaining_uses = -1 OR remaining_uses > 0)
              AND (expires_at IS NULL OR expires_at > NOW())
        """), {"uid": user_id, "code": data.coupon_code}).fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Cupon no valido o expirado")

        coupon = dict(row._mapping)
        fee = round(data.subtotal * (data.service_fee_percent / 100), 2)
        discount = 0.0

        ctype = coupon['coupon_type']
        cval = float(coupon['discount_value'])

        if ctype == 'fee_off_once':
            discount = fee
        elif ctype == 'fee_half':
            discount = round(fee * 0.5, 2)
        elif ctype == 'discount_percent':
            discount = round(data.subtotal * (cval / 100), 2)
        elif ctype == 'fee_discount_permanent':
            discount = round(fee * (cval / 100), 2)
        elif ctype == 'legend_discount':
            discount = round(fee * (cval / 100), 2)
        elif ctype == 'birthday_ticket':
            discount = data.subtotal  # boleto gratis

        return {
            "valid": True,
            "coupon_code": data.coupon_code,
            "coupon_type": ctype,
            "subtotal": data.subtotal,
            "service_fee": fee,
            "discount": discount,
            "total": round(data.subtotal + fee - discount, 2),
            "description": coupon.get('coupon_type', ''),
            "remaining_uses": coupon.get('remaining_uses', 0)
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ACHIEVEMENTS] Error validando cupon: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error al validar cupon")


@router.post("/coupons/consume")
def consume_coupon(
    data: CouponApply,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_safe())
):
    """Consume un uso del cupon (llamar despues de compra exitosa)."""
    try:
        user_id = current_user.get('id') or current_user.get('user_id')

        row = db.execute(text("""
            SELECT * FROM user_coupons
            WHERE user_id = :uid AND coupon_code = :code AND is_active = 1
              AND (remaining_uses = -1 OR remaining_uses > 0)
        """), {"uid": user_id, "code": data.coupon_code}).fetchone()

        if not row:
            return {"consumed": False, "message": "Cupon no encontrado"}

        coupon = dict(row._mapping)
        uses = coupon['remaining_uses']

        if uses == -1:
            # Permanente, solo actualizamos used_at
            db.execute(text("""
                UPDATE user_coupons SET used_at = NOW()
                WHERE id = :cid
            """), {"cid": coupon['id']})
        else:
            new_uses = uses - 1
            db.execute(text("""
                UPDATE user_coupons
                SET remaining_uses = :uses,
                    used_at = NOW(),
                    is_active = CASE WHEN :uses <= 0 THEN 0 ELSE 1 END
                WHERE id = :cid
            """), {"uses": new_uses, "cid": coupon['id']})

        db.commit()
        return {"consumed": True, "remaining_uses": uses - 1 if uses > 0 else -1}

    except Exception as e:
        db.rollback()
        print(f"[ACHIEVEMENTS] Error consumiendo cupon: {e}")
        return {"consumed": False, "message": str(e)}


@router.post("/check")
def check_achievements(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_safe())
):
    """
    Endpoint para verificar y desbloquear logros.
    Llamar despues de cada compra o al cargar la pagina de logros.
    """
    try:
        user_id = current_user.get('id') or current_user.get('user_id')
        newly = check_and_unlock(user_id, db)

        return {
            "newly_unlocked": newly,
            "count": len(newly)
        }

    except Exception as e:
        print(f"[ACHIEVEMENTS] Error verificando: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error al verificar logros")


@router.get("/has-premium-ticket")
def has_premium_ticket(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_safe())
):
    """Verifica si el usuario tiene el logro de boleto premium (tier 4+)."""
    try:
        init_if_needed(db)
        user_id = current_user.get('id') or current_user.get('user_id')

        row = db.execute(text("""
            SELECT COUNT(*) as cnt
            FROM user_achievements ua
            JOIN achievements a ON a.id = ua.achievement_id
            WHERE ua.user_id = :uid AND a.tier >= 4
        """), {"uid": user_id}).fetchone()

        return {"has_premium": row[0] > 0 if row else False}

    except Exception:
        return {"has_premium": False}
