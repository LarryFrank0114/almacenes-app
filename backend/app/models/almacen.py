from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class Almacen(Base):
    __tablename__ = "almacenes"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    distrito = Column(String, nullable=True)
    direccion = Column(String, nullable=True)
    encargado_nombre = Column(String, nullable=True)
    encargado_telefono = Column(String, nullable=True)
    latitud = Column(Float, nullable=True)
    longitud = Column(Float, nullable=True)
    imagen_url = Column(String, nullable=True)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=True)
    
    items = relationship("Item", back_populates="almacen")