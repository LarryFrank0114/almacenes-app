from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class AlmacenBase(BaseModel):
    nombre: str
    distrito: Optional[str] = None
    direccion: Optional[str] = None
    encargado_nombre: Optional[str] = None
    encargado_telefono: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    imagen_url: Optional[str] = None
    activo: bool = True

class AlmacenCreate(AlmacenBase):
    pass

class AlmacenUpdate(BaseModel):
    nombre: Optional[str] = None
    distrito: Optional[str] = None
    direccion: Optional[str] = None
    encargado_nombre: Optional[str] = None
    encargado_telefono: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    imagen_url: Optional[str] = None
    activo: Optional[bool] = None

class Almacen(AlmacenBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    items_count: Optional[int] = 0  # ✅ Campo para contar items
    
    class Config:
        from_attributes = True