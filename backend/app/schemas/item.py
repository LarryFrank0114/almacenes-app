from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class ItemBase(BaseModel):
    nombre: str
    codigo: str
    categoria: Optional[str] = None
    descripcion: Optional[str] = None
    stock: float = 0
    stock_minimo: float = 0
    precio: Optional[float] = None
    precio_costo: Optional[float] = None
    unidad_medida: Optional[str] = None
    ubicacion: Optional[str] = None
    almacen_id: Optional[int] = None
    activo: bool = True

class ItemCreate(ItemBase):
    pass

class ItemUpdate(BaseModel):
    nombre: Optional[str] = None
    codigo: Optional[str] = None
    categoria: Optional[str] = None
    descripcion: Optional[str] = None
    stock: Optional[float] = None
    stock_minimo: Optional[float] = None
    precio: Optional[float] = None
    precio_costo: Optional[float] = None
    unidad_medida: Optional[str] = None
    ubicacion: Optional[str] = None
    almacen_id: Optional[int] = None
    activo: Optional[bool] = None

class Item(ItemBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    almacen_nombre: Optional[str] = None
    
    class Config:
        from_attributes = True
