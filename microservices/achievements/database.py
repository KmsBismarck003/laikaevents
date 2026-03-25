import os
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Float, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# MySQL URL from same env as other services
MYSQL_URL = (
    f"mysql+pymysql://{os.getenv('MYSQL_USER','root')}:{os.getenv('MYSQL_PASSWORD','')}"
    f"@{os.getenv('MYSQL_HOST','localhost')}:3306/{os.getenv('MYSQL_DATABASE','laika_club')}"
)

try:
    engine = create_engine(MYSQL_URL, pool_pre_ping=True, connect_args={'connect_timeout': 5})
    engine.connect()
    print("[ACHIEVEMENTS] Connected to MySQL.")
except Exception:
    print("[ACHIEVEMENTS] MySQL unavailable. Using SQLite fallback...")
    SQLALCHEMY_DATABASE_URL = "sqlite:///./microservices/achievements/achievements.db"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class UserAchievement(Base):
    __tablename__ = "user_achievements"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    tier = Column(Integer)
    tier_name = Column(String(100))
    phase = Column(String(50))
    unlocked_at = Column(DateTime, default=datetime.utcnow)

class UserCoupon(Base):
    __tablename__ = "user_coupons"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    code = Column(String(50), unique=True, index=True)
    discount_type = Column(String(20)) # 'percentage', 'fixed', 'service_fee'
    discount_value = Column(Float)
    description = Column(String(255))
    uses_left = Column(Integer, default=1)
    expires_at = Column(DateTime, nullable=True)
    is_permanent = Column(Integer, default=0) # 1 for benefits like Tier 9
    created_at = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
