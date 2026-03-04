from sqlalchemy.orm import Session
from sqlalchemy import text
from passlib.context import CryptContext
from typing import Tuple

class SecurityGate:
    """
    Module responsible for verifying user authorization before critical actions.
    It isolates the password checking logic from the rest.
    """

    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def verify_password(self, db: Session, user_id: int, password: str) -> Tuple[bool, str]:
        """
        Verify if the provided password matches the user's stored hash.

        Returns:
            (success, message)
        """
        try:
            # 1. Fetch user hash
            query = text("SELECT password_hash, role, status FROM users WHERE id = :user_id")
            result = db.execute(query, {"user_id": user_id})
            user = result.fetchone()

            if not user:
                return False, "Usuario no encontrado"

            if user.status != 'active':
                return False, "Usuario inactivo"

            # 2. Verify hash format (bcrypt)
            current_hash = user.password_hash
            if not current_hash.startswith(('$2b$', '$2a$')):
                 return False, "Error de configuración de seguridad"

            # 3. Verify password
            # Handle bcrypt 72 byte limit truncation logic same as auth.py if needed
            password_bytes = password.encode('utf-8')
            if len(password_bytes) > 72:
                password = password_bytes[:72].decode('utf-8', errors='ignore')

            if self.pwd_context.verify(password, current_hash):
                return True, "Autorizado"
            else:
                return False, "Contraseña incorrecta"

        except Exception as e:
            print(f"SecurityGate Error: {e}")
            return False, "Error interno de seguridad"

    def is_admin(self, db: Session, user_id: int) -> bool:
        """
        Check if user has admin privileges.
        """
        query = text("SELECT role FROM users WHERE id = :user_id")
        result = db.execute(query, {"user_id": user_id})
        user = result.fetchone()

        return user and user.role == 'admin'
