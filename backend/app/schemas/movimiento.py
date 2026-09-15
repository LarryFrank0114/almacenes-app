from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List


# ============================================
# DETALLE DE MOVIMIENTO
# ============================================
class MovimientoDetalleCreate(BaseModel):
    item_id: int
    cantidad: float


class MovimientoDetalleResponse(BaseModel):
    id: int
    item_id: int
    cantidad: float
    stock_anterior: Optional[float] = None
    stock_nuevo: Optional[float] = None
    item_nombre: Optional[str] = None
    item_codigo: Optional[str] = None
    
    class Config:
        from_attributes = True


# ============================================
# MOVIMIENTO (con N detalles)
# ============================================
class MovimientoCreate(BaseModel):
    tipo: str  # 'entrada' o 'salida'
    fecha: Optional[date] = None
    numero_documento: Optional[str] = None
    proveedor: Optional[str] = None
    destino: Optional[str] = None
    observacion: Optional[str] = None
    usuario_email: Optional[str] = None
    detalles: List[MovimientoDetalleCreate]


class MovimientoResponse(BaseModel):
    id: int
    tipo: str
    fecha: date
    numero_documento: Optional[str] = None
    proveedor: Optional[str] = None
    destino: Optional[str] = None
    observacion: Optional[str] = None
    usuario_email: Optional[str] = None
    created_at: Optional[datetime] = None
    detalles: List[MovimientoDetalleResponse] = []
    
    class Config:
        from_attributes = True
