"""JWT authentication + bcrypt password hashing."""

import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt


class AuthHandler:
    _secret: str = os.getenv("JWT_SECRET", "f1-navigator-change-me-in-production")
    _algo:   str = "HS256"
    _ttl_days: int = 30

    # ── Passwords ─────────────────────────────────────────────────────────────

    def hash_password(self, password: str) -> str:
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    def verify_password(self, password: str, hashed: str) -> bool:
        return bcrypt.checkpw(password.encode(), hashed.encode())

    # ── Tokens ────────────────────────────────────────────────────────────────

    def create_token(self, user_id: str) -> str:
        payload = {
            "user_id": user_id,
            "exp": datetime.now(tz=timezone.utc) + timedelta(days=self._ttl_days),
        }
        return jwt.encode(payload, self._secret, algorithm=self._algo)

    def decode_token(self, token: str) -> str | None:
        try:
            payload = jwt.decode(token, self._secret, algorithms=[self._algo])
            return payload.get("user_id")
        except jwt.PyJWTError:
            return None
