from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UsuarioBase(BaseModel):
    email: EmailStr
    nombre: str
    rol: Optional[str] = "usuario"
    activo: Optional[bool] = True

class UsuarioCreate(UsuarioBase):
    pass

class UsuarioUpdate(BaseModel):
    rol: Optional[str] = None
    activo: Optional[bool] = None

class Usuario(UsuarioBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True