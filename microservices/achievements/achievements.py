import random
import string
from datetime import datetime, timedelta

TIERS = [
    {
        "tier": 1,
        "name": "Pasaporte Cósmico",
        "phase": "Gancho",
        "requirement": 0,
        "reward": "100% discount on Service Fee in first purchase",
        "reward_type": "service_fee",
        "reward_value": 100,
        "uses": 1
    },
    {
        "tier": 2,
        "name": "Ignición: T-Minus 0",
        "phase": "Gancho",
        "requirement": 1,
        "reward": "Preventa Exclusiva 'Laika Priority'",
        "reward_type": "benefit",
        "benefit_id": "laika_priority"
    },
    {
        "tier": 3,
        "name": "Órbita Baja",
        "phase": "Gancho",
        "requirement": 3,
        "reward": "5% discount direct on next purchase",
        "reward_type": "percentage",
        "reward_value": 5,
        "uses": 1
    },
    {
        "tier": 4,
        "name": "Alunizaje VIP",
        "phase": "Retención",
        "requirement": 5,
        "reward": "Skin dorada premium permanente en boletos",
        "reward_type": "benefit",
        "benefit_id": "golden_skin",
        "permanent": True
    },
    {
        "tier": 5,
        "name": "Piloto Sputnik",
        "phase": "Retención",
        "requirement": 10,
        "reward": "Cupones 2x1 en cargos por servicio (2 usos)",
        "reward_type": "service_fee",
        "reward_value": 100,
        "uses": 2
    },
    {
        "tier": 6,
        "name": "Viajero de Marte",
        "phase": "Retención",
        "requirement": 20,
        "reward": "Fila Rápida permanente ('Laika Pass')",
        "reward_type": "benefit",
        "benefit_id": "laika_pass",
        "permanent": True
    },
    {
        "tier": 7,
        "name": "Comandante Interestelar",
        "phase": "Fidelización",
        "requirement": 50,
        "reward": "Kit físico de Merch exclusivo del LAIKA Club",
        "reward_type": "benefit",
        "benefit_id": "merch_kit"
    },
    {
        "tier": 8,
        "name": "Salto al Hiperespacio",
        "phase": "Fidelización",
        "requirement": 75,
        "reward": "Un boleto de regalo cada año por su cumpleaños",
        "reward_type": "benefit",
        "benefit_id": "birthday_ticket"
    },
    {
        "tier": 9,
        "name": "Supernova",
        "phase": "Fidelización",
        "requirement": 90,
        "reward": "20% de descuento permanente en todos los fees",
        "reward_type": "service_fee",
        "reward_value": 20,
        "permanent": True
    },
    {
        "tier": 10,
        "name": "El Legado Laika",
        "phase": "Leyenda",
        "requirement": 100,
        "reward": "40% de descuento anual en fees + Backstage Hero",
        "reward_type": "service_fee",
        "reward_value": 40,
        "permanent": True
    }
]

def generate_coupon_code(tier_num: int):
    # Format: LAIKA-[Tier]-[Random]
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"LAIKA-{tier_num:02d}-{random_str}"

def get_achievements_for_count(ticket_count: int):
    unlocked = []
    for t in TIERS:
        if ticket_count >= t["requirement"]:
            unlocked.append(t)
    return unlocked
