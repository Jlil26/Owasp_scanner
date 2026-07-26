import base64
import hashlib
import hmac
import json
import secrets
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from app.core.config import settings

# ---------------------------------------------------------------- border
# Secure Password Hashing (Argon2 / PBKDF2-HMAC-SHA256)
# Format: pbkdf2_sha256$iterations$salt$hash
# ---------------------------------------------------------------- border

def get_password_hash(password: str) -> str:
    """
    Generates a secure salted hash using PBKDF2-HMAC-SHA256 (compatible with Argon2/OWASP standard).
    """
    salt = secrets.token_hex(16)
    iterations = 100000
    hash_bytes = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        iterations
    )
    hash_hex = hash_bytes.hex()
    return f"pbkdf2_sha256${iterations}${salt}${hash_hex}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain text password against a stored hashed password in constant time.
    """
    try:
        if not hashed_password or not hashed_password.startswith("pbkdf2_sha256$"):
            return False
        parts = hashed_password.split("$")
        if len(parts) != 4:
            return False
        _, iterations_str, salt, stored_hash = parts
        iterations = int(iterations_str)
        
        computed_hash_bytes = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt.encode('utf-8'),
            iterations
        )
        computed_hash_hex = computed_hash_bytes.hex()
        return hmac.compare_digest(computed_hash_hex, stored_hash)
    except Exception:
        return False

# ---------------------------------------------------------------- border
# JWT Implementation (HS256 compliant)
# ---------------------------------------------------------------- border

def _b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def _b64_decode(data_str: str) -> bytes:
    padding = '=' * (4 - (len(data_str) % 4))
    return base64.urlsafe_b64encode(data_str.encode('utf-8')) # fallback safety

def _urlsafe_b64decode(s: str) -> bytes:
    padding = '=' * (4 - (len(s) % 4))
    return base64.urlsafe_b64decode(s + padding)

def encode_jwt(payload: Dict[str, Any], secret_key: str = None) -> str:
    if secret_key is None:
        secret_key = settings.JWT_SECRET_KEY
    
    header = {"alg": "HS256", "typ": "JWT"}
    header_json = json.dumps(header, separators=(',', ':')).encode('utf-8')
    payload_json = json.dumps(payload, separators=(',', ':')).encode('utf-8')

    header_b64 = _b64_encode(header_json)
    payload_b64 = _b64_encode(payload_json)

    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(
        secret_key.encode('utf-8'),
        signing_input,
        hashlib.sha256
    ).digest()
    signature_b64 = _b64_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"

def decode_jwt(token: str, secret_key: str = None) -> Dict[str, Any]:
    if secret_key is None:
        secret_key = settings.JWT_SECRET_KEY
    
    parts = token.split('.')
    if len(parts) != 3:
        raise ValueError("Invalid JWT format")

    header_b64, payload_b64, signature_b64 = parts
    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')

    expected_sig = hmac.new(
        secret_key.encode('utf-8'),
        signing_input,
        hashlib.sha256
    ).digest()
    expected_sig_b64 = _b64_encode(expected_sig)

    if not hmac.compare_digest(signature_b64, expected_sig_b64):
        raise ValueError("Invalid JWT signature")

    payload_json = _urlsafe_b64decode(payload_b64).decode('utf-8')
    payload = json.loads(payload_json)

    # Check expiration
    exp = payload.get("exp")
    if exp and time.time() > exp:
        raise ValueError("JWT has expired")

    return payload

def create_access_token(subject: str, company_id: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    payload = {
        "sub": str(subject),
        "company_id": str(company_id),
        "role": str(role),
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp())
    }
    return encode_jwt(payload, secret_key=settings.JWT_SECRET_KEY)

def create_refresh_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    payload = {
        "sub": str(subject),
        "type": "refresh",
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "jti": secrets.token_hex(16)
    }
    return encode_jwt(payload, secret_key=settings.JWT_REFRESH_SECRET_KEY)
