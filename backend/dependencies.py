from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
import os

# Esquema de autenticación (Bearer token)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Clave secreta y algoritmo (deben coincidir con auth.py)
SECRET_KEY = os.getenv('JWT_SECRET', 'tu_clave_secreta_aqui')
ALGORITHM = "HS256"

def get_db():
    from main import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Dependencia para obtener el usuario autenticado desde el token JWT.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decodificar el token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")

        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    # Obtener usuario de la base de datos
    query = text("SELECT * FROM users WHERE id = :user_id")
    result = db.execute(query, {"user_id": user_id})
    user = result.fetchone()

    if user is None:
        raise credentials_exception

    # Convertir Row a dict para acceso seguro en todos los endpoints
    user_dict = dict(user._mapping)
    return user_dict
