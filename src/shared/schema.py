from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel

class Status(Enum):
    SUCCESS = "success"
    FAILURE = "failure"
    SKIPPED = "skipped"

class EmailTask(BaseModel):
    email_id: str
    thread_id: str
    body: str
    sender: str

class AgentOutput(BaseModel):
    status: Status
    draft_id: Optional[str] = None

class UserModel(BaseModel):
    id: Optional[str] = None
    email: str
    provider: str
    access_token_encrypted: bytes
    refresh_token_encrypted: Optional[bytes] = None
    expires_at: Optional[Any] = None
    next_check_time: Optional[Any] = None
    check_interval_minutes: int = 15
    is_active: bool = True
    target_email: Optional[str] = None
    client_id: Optional[str] = None
    tenant_id: Optional[str] = None
    created_at: Optional[Any] = None
    updated_at: Optional[Any] = None

class TokenEncryption:
    def __init__(self, key: str):
        from cryptography.fernet import Fernet
        import base64
        
        if not key:
            # Generate a dummy key for development if none provided
            # In production, this should raise an error
            self._fernet = Fernet(Fernet.generate_key())
        else:
            # Ensure key is bytes
            if isinstance(key, str):
                key = key.encode()
            self._fernet = Fernet(key)
    
    def encrypt(self, data: str) -> bytes:
        if not data:
            return None
        return self._fernet.encrypt(data.encode())
    
    def decrypt(self, data: bytes) -> str:
        if not data:
            return None
        return self._fernet.decrypt(data).decode()
