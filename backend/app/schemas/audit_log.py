from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AuditLogBase(BaseModel):
    usuario_email: Optional[str] = None
    usuario_id: Optional[str] = None
    accion: str
    tabla: str
    registro_id: Optional[int] = None
    campo: Optional[str] = None
    valor_anterior: Optional[str] = None
    valor_nuevo: Optional[str] = None
    ip: Optional[str] = None
    user_agent: Optional[str] = None


class AuditLogCreate(AuditLogBase):
    pass


class AuditLog(AuditLogBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True