from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class Item(Base):
    __tablename__ = "items"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    codigo = Column(String, index=True, nullable=False, unique=True)
    categoria = Column(String, nullable=True)
    descripcion = Column(String, nullable=True)
    stock = Column(Float, default=0)
    stock_minimo = Column(Float, default=0)
    precio = Column(Float, nullable=True)
    precio_costo = Column(Float, nullable=True)
    unidad_medida = Column(String, nullable=True)
    ubicacion = Column(String, nullable=True)
    almacen_id = Column(Integer, ForeignKey("almacenes.id"), nullable=True)
    activo = Column(Boolean, default=True)
    
    # Fechas
    created_at = Column(DateTime, server_default=func.now(), nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=True)
    
    # Relación con Almacén
    almacen = relationship("Almacen", back_populates="items")
    
    # Propiedad para obtener el nombre del almacén
    @property
    def almacen_nombre(self):
        return self.almacen.nombre if self.almacen else None