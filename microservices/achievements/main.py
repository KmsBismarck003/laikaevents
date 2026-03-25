import httpx
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import database, achievements
from .database import get_db, UserAchievement, UserCoupon
from datetime import datetime, timedelta
import os

app = FastAPI(title="Laika Achievements Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB
database.init_db()

TICKET_SERVICE_URL = "http://localhost:8003"

async def get_user_ticket_count(user_id: int, request: Request):
    token = request.headers.get("Authorization")
    headers = {"Authorization": token} if token else {}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{TICKET_SERVICE_URL}/my-tickets", headers=headers)
            if resp.status_code == 200:
                tickets = resp.json()
                return len(tickets)
    except Exception as e:
        print(f"Error fetching tickets: {e}")
    return 0

def get_current_user_id(request: Request):
    # This should normally verify the token, but for this simulation 
    # we'll assume the Auth/Gateway has verified it and passed info
    # In a real microservice, we'd use a shared secret or verify JWT.
    # For now, we'll try to extract simple ID from 'X-User-Id' or similar
    # if it doesn't exist, we'll return a default for testing or error out.
    user_id = request.headers.get("X-User-Id")
    if user_id: return int(user_id)
    # Fallback to a mock user for testing if no id provided
    return 1

@app.get("/")
async def get_progress(request: Request, db: Session = Depends(get_db)):
    user_id = get_current_user_id(request)
    ticket_count = await get_user_ticket_count(user_id, request)
    
    # Sync achievements
    await check_achievements_logic(user_id, ticket_count, db)
    
    unlocked = db.query(UserAchievement).filter(UserAchievement.user_id == user_id).all()
    user_tier = 1
    if unlocked:
        user_tier = max([a.tier for a in unlocked])
    
    return {
        "user_id": user_id,
        "ticket_count": ticket_count,
        "total_points": ticket_count * 100, # 1 ticket = 100 XP
        "tier": user_tier,
        "achievements": unlocked
    }

@app.get("/my")
async def get_my_info(request: Request, db: Session = Depends(get_db)):
    return await get_progress(request, db)

@app.get("/coupons")
async def get_coupons(request: Request, db: Session = Depends(get_db)):
    user_id = get_current_user_id(request)
    now = datetime.utcnow()
    coupons = db.query(UserCoupon).filter(
        UserCoupon.user_id == user_id,
        (UserCoupon.uses_left > 0) | (UserCoupon.is_permanent == 1)
    ).all()
    
    # Filter expired
    active_coupons = []
    for c in coupons:
        if c.expires_at and c.expires_at < now:
            continue
        active_coupons.append(c)
        
    return active_coupons

@app.post("/check")
async def manual_check(request: Request, db: Session = Depends(get_db)):
    user_id = get_current_user_id(request)
    ticket_count = await get_user_ticket_count(user_id, request)
    await check_achievements_logic(user_id, ticket_count, db)
    return {"status": "success", "ticket_count": ticket_count}

async def check_achievements_logic(user_id: int, ticket_count: int, db: Session):
    unlocked_tiers = achievements.get_achievements_for_count(ticket_count)
    already_unlocked = [a.tier for a in db.query(UserAchievement).filter(UserAchievement.user_id == user_id).all()]
    
    for t in unlocked_tiers:
        if t["tier"] not in already_unlocked:
            # Create Achievement
            new_ach = UserAchievement(
                user_id=user_id,
                tier=t["tier"],
                tier_name=t["name"],
                phase=t["phase"]
            )
            db.add(new_ach)
            
            # Create Coupon reward if applicable
            if t.get("reward_type") in ["percentage", "fixed", "service_fee"]:
                new_coupon = UserCoupon(
                    user_id=user_id,
                    code=achievements.generate_coupon_code(t["tier"]),
                    discount_type=t["reward_type"],
                    discount_value=t["reward_value"],
                    description=t["reward"],
                    uses_left=t.get("uses", 1),
                    is_permanent=1 if t.get("permanent") else 0
                )
                db.add(new_coupon)
    
    db.commit()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)
