from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Text, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class Movimiento(Base):
    __tablename__ = "movimientos"
    
    id = Column(BigInteger, primary_key=True, index=True)
    tipo = Column(String(20), nullable=False)  # 'entrada' o 'salida'
    fecha = Column(Date, nullable=False, server_default=func.current_date())
    numero_documento = Column(String(100), nullable=True)
    proveedor = Column(String(200), nullable=True)  # Solo para entradas
    destino = Column(String(200), nullable=True)     # Solo para salidas
    observacion = Column(Text, nullable=True)
    usuario_email = Column(String(200), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relación con detalles
    detalles = relationship(
        "MovimientoDetalle",
        back_populates="movimiento",
        cascade="all, delete-orphan"
    )


class MovimientoDetalle(Base):
    __tablename__ = "movimiento_detalles"
    
    id = Column(BigInteger, primary_key=True, index=True)
    movimiento_id = Column(BigInteger, ForeignKey("movimientos.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    cantidad = Column(Float, nullable=False)
    stock_anterior = Column(Float, nullable=True)
    stock_nuevo = Column(Float, nullable=True)
    
    # Relaciones
    movimiento = relationship("Movimiento", back_populates="detalles")
    item = relationship("Item")
    
    # Propiedad para obtener el nombre del producto
    @property
    def item_nombre(self):
        return self.item.nombre if self.item else None
    
    @property
    def item_codigo(self):
        return self.item.codigo if self.item else None
